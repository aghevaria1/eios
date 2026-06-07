import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Partner Prioritization — "Score from KB" backend.
//
// RAG-lite: the per-partner KB is small, so it goes straight into the prompt
// (no vector store). The client posts { name, type, kb }; Claude returns ONLY
// a JSON score object against a FIXED rubric (below). The route returns the
// model's raw text — the client parses it safely (strip fences / try-catch)
// and, on failure, falls back to the existing manual score. The API key lives
// only on the server (process.env.ANTHROPIC_API_KEY), same as every other
// agent route in this app — never hardcoded, never sent to the browser.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Model + budget fixed per the feature spec.
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

const SYSTEM = `You are an NVIDIA partner-prioritization analyst. You score a prospective partner for onboarding priority using ONLY the knowledge-base (KB) text provided, against this fixed rubric:

IMPACT (1-10): size of customer segment unlocked, NVIDIA inference pull-through potential, strategic/sovereign leverage, regulatory fit. Higher = unlocks a bigger/more strategic segment.
EFFORT (1-10): integration complexity, certification burden, whether they're already committed to a competing stack, geo/contractual friction. Higher = harder to onboard.

Return ONLY a single JSON object — no prose, no explanation, no markdown code fences. Exact shape:
{"impact": <1-10 integer>, "effort": <1-10 integer>, "segment": "<short string: the customer segment this partner unlocks>", "rationale": "<2-3 sentence justification grounded in the KB>", "sources": ["<short quote or snippet from the KB that drove the score>"]}

Base every field strictly on the provided KB. Put the KB snippets that drove the score in "sources". Output valid JSON and nothing else.`

function buildUserPrompt(name: string, type: string, kb: string): string {
  return `Partner name: ${name}
Partner type: ${type}

Knowledge base (source text to score from):
"""
${kb}
"""

Score this partner per the rubric. Return ONLY the JSON object.`
}

export async function POST(req: NextRequest) {
  let body: { name?: string; type?: string; kb?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, type, kb } = body
  if (!name || !type || !kb || !kb.trim()) {
    return Response.json(
      { error: 'Missing name, type, or kb' },
      { status: 400 },
    )
  }

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(name, type, kb) }],
    })

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    if (!text) {
      return Response.json({ error: 'Empty model response' }, { status: 502 })
    }

    // Return raw text — client does the safe parse + fallback.
    return Response.json({ text })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown scoring error'
    return Response.json({ error: message }, { status: 502 })
  }
}
