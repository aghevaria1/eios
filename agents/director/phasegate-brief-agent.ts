import Anthropic from '@anthropic-ai/sdk'
import { loadPhaseGate } from '@/lib/director/load-target'
import { parseBrief, type PhaseGateBrief } from '@/lib/director/phase-gate-brief-parser'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL_PRIMARY = 'claude-sonnet-4-5'
const MODEL_FALLBACK = 'claude-sonnet-4-20250514'

export interface PhaseGateBriefInput {
  lane: string
  phase: string
}

function findMatchingDecision(
  decisions: ReturnType<typeof loadPhaseGate>['exec_decisions_needed'],
  lane: string,
  phase: string,
) {
  const laneToken = lane.replace(/_/g, ' ').toLowerCase()
  const phaseToken = phase.toLowerCase()
  return (
    decisions.find(
      (d) =>
        d.title.toLowerCase().includes(laneToken) ||
        d.title.toLowerCase().includes(phaseToken),
    ) ?? null
  )
}

function buildPrompt(
  cell: ReturnType<typeof loadPhaseGate>['states'][number],
  decision: ReturnType<typeof findMatchingDecision>,
): string {
  return `You are the Phase-Gate Brief Generator for the Cornelis Networks CN6000 SuperNIC program. A Director PM has clicked an at-risk phase-gate cell. Write an executive escalation brief for the decision owner.

PHASE-GATE CELL:
Lane: ${cell.lane}
Phase: ${cell.phase}
Status: ${cell.status}
Target date: ${cell.target_date ?? 'unset'}
Cell detail: ${cell.detail ?? 'no detail'}

${
  decision
    ? `REGISTERED EXECUTIVE DECISION (from program decision register):
Title: ${decision.title}
Detail: ${decision.detail}
Owner: ${decision.owner}
Escalate to: ${decision.escalate_to}
Target decision date: ${decision.target_date}`
    : 'NO REGISTERED EXECUTIVE DECISION matches this cell yet.'
}

PROGRAM CONTEXT:
- CN6000 SuperNIC serves 5 customer segments: Federal HPC, Academic HPC, Enterprise AI, Neoclouds, Sovereign AI
- Critical path: silicon bring-up → validation → ISV certification → manufacturing → customer ship
- This cell sits on the critical path; downstream impacts include sampling phase compression, GA commitment slip, and customer-segment ship risk
- Major customer commitments anchored: federal HPC (DOE, LLNL, SNL), enterprise AI automotive Tier-1, sovereign AI France pilot

Write the brief in this exact format. Be terse, executive-grade, decision-forcing. The decision owner will skim this in 30 seconds.

ISSUE: [one sentence — what the slip/risk is and why it matters now]
RECOMMENDATION: [one sentence — pick Option A or Option B from the registered decision detail, with the tradeoff stated explicitly]
CONFIDENCE: [one word: high | medium | low — based on whether the recommended option has clear precedent or open risks]
DECISION OWNER: ${decision?.owner ?? 'VP Engineering'}
DECISION BY: ${decision?.target_date ?? cell.target_date ?? 'Q1 2026'}

RATIONALE: [3 sentences only — why this recommendation, what cross-functional impact it has, what alternatives were considered]`
}

async function streamFromModel(
  model: string,
  prompt: string,
  onStream?: (token: string) => void,
): Promise<string> {
  let full = ''
  const stream = await client.messages.stream({
    model,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      full += chunk.delta.text
      onStream?.(chunk.delta.text)
    }
  }
  return full
}

export async function runPhaseGateBriefAgent(
  input: PhaseGateBriefInput,
  onStream?: (token: string) => void,
): Promise<PhaseGateBrief> {
  const phaseGate = loadPhaseGate()
  const cell = phaseGate.states.find(
    (s) => s.lane === input.lane && s.phase === input.phase,
  )
  if (!cell) {
    throw new Error(`Phase-gate cell not found: ${input.lane}/${input.phase}`)
  }
  const decision = findMatchingDecision(
    phaseGate.exec_decisions_needed,
    input.lane,
    input.phase,
  )
  const prompt = buildPrompt(cell, decision)

  let full: string
  try {
    full = await streamFromModel(MODEL_PRIMARY, prompt, onStream)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (msg.toLowerCase().includes('model') || msg.includes('400') || msg.includes('404')) {
      full = await streamFromModel(MODEL_FALLBACK, prompt, onStream)
    } else {
      throw e
    }
  }

  return parseBrief(full, {
    owner: decision?.owner,
    target_date: decision?.target_date,
  })
}
