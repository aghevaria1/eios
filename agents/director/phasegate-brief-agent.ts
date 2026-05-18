import Anthropic from '@anthropic-ai/sdk'
import { loadPhaseGate } from '@/lib/director/load-target'
import { parseBrief, type PhaseGateBrief } from '@/lib/director/phase-gate-brief-parser'
import { retrieveChunks, chunksToSources, type RagChunk } from '@/lib/director/rag'
import {
  listSegmentsTool,
  getSegmentTool,
} from '@/lib/director/mcp/segments-server'
import type { Segment, SegmentId } from '@/lib/director/types'

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

function relevantSegmentsForCell(
  cell: ReturnType<typeof loadPhaseGate>['states'][number],
  decision: ReturnType<typeof findMatchingDecision>,
): SegmentId[] {
  const text = [
    cell.lane,
    cell.phase,
    cell.detail ?? '',
    decision?.title ?? '',
    decision?.detail ?? '',
  ]
    .join(' ')
    .toLowerCase()
  const result: SegmentId[] = []
  if (/federal|doe|nnsa|llnl|snl|lanl/.test(text)) result.push('federal-hpc')
  if (/sovereign|france|allied|eurohpc|mistral/.test(text))
    result.push('sovereign-ai')
  if (/enterprise|automotive|oem|fortune/.test(text))
    result.push('enterprise-ai')
  if (/neocloud|coreweave|lambda|crusoe|runpod/.test(text))
    result.push('neoclouds')
  if (/academic|university|nsf|campus/.test(text)) result.push('academic-hpc')
  // Default for critical-path NPI cells without explicit segment hints:
  // the two segments most exposed to schedule risk on a CN6000 GA miss.
  if (result.length === 0) return ['federal-hpc', 'sovereign-ai']
  return result
}

function buildPrompt(
  cell: ReturnType<typeof loadPhaseGate>['states'][number],
  decision: ReturnType<typeof findMatchingDecision>,
  chunks: RagChunk[],
  segmentImpact: Segment[],
): string {
  const productContextBlock =
    chunks.length > 0
      ? `PROGRAM AND PRODUCT CONTEXT (background reference from Cornelis CN5000 product briefs and CN6000 NPI program docs — use as supporting context, do not cite line-by-line):
${chunks
  .map((c, i) => {
    const loc = c.section
      ? ` — ${c.section}`
      : c.page != null
        ? ` — p.${c.page}`
        : ''
    return `[${i + 1}] ${c.title}${loc}\n${c.text}`
  })
  .join('\n\n')}

`
      : ''

  const segmentImpactBlock =
    segmentImpact.length > 0
      ? `CUSTOMER SEGMENT IMPACT (live data from MCP segments server — production stand-in for Salesforce/ERP):
${segmentImpact
  .map((s, i) => {
    const buyingCriteria = Array.isArray(s.workload.buying_criteria)
      ? s.workload.buying_criteria
      : [s.workload.buying_criteria]
    return `[${i + 1}] ${s.name} — ${s.subtitle}
Value position: ${s.value_proposition.statement}
Top buying criteria: ${buyingCriteria.slice(0, 3).join('; ')}
Day-1 ISV priority: ${Array.isArray(s.channel.day1_isv_priority) ? s.channel.day1_isv_priority.join('; ') : s.channel.day1_isv_priority}`
  })
  .join('\n\n')}

`
      : ''

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

${segmentImpactBlock}${productContextBlock}Write the brief in this exact format. Be terse, executive-grade, decision-forcing. The decision owner will skim this in 30 seconds.

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

  const PRODUCT_FAMILY_TAIL =
    'CN5000 CN6000 SuperNIC director class switch Omni-Path fabric'
  const ragQuery = [
    cell.lane.replace(/_/g, ' '),
    cell.phase,
    cell.detail ?? '',
    decision?.title ?? '',
    PRODUCT_FAMILY_TAIL,
  ]
    .join(' ')
    .trim()
  const retrievedChunks = retrieveChunks(ragQuery, 3)

  let segmentImpact: Segment[] = []
  let mcpOk = false
  try {
    await listSegmentsTool.invoke({})
    const relevantIds = relevantSegmentsForCell(cell, decision)
    segmentImpact = await Promise.all(
      relevantIds.map((id) => getSegmentTool.invoke({ segment_id: id })),
    )
    mcpOk = true
  } catch (e) {
    console.warn(
      '[MCP] segments-server call failed; brief will generate without segment data:',
      e instanceof Error ? e.message : e,
    )
    mcpOk = false
  }

  const prompt = buildPrompt(cell, decision, retrievedChunks, segmentImpact)

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

  const sources = chunksToSources(retrievedChunks)
  const orchestration = {
    rag_chunk_count: retrievedChunks.length,
    mcp_segment_count: segmentImpact.length,
    mcp_ok: mcpOk,
  }

  let tailMarker = ''
  tailMarker += `\nORCHESTRATION: ${JSON.stringify(orchestration)}`
  if (sources.length > 0) {
    tailMarker += `\nSOURCES: ${JSON.stringify(sources)}`
  }
  if (tailMarker) onStream?.(tailMarker)

  const parsed = parseBrief(full + tailMarker, {
    owner: decision?.owner,
    target_date: decision?.target_date,
  })
  parsed.sources = sources
  parsed.orchestration = orchestration
  return parsed
}
