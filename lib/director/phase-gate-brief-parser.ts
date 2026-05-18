// Shared types + parser for the Phase-Gate Brief Generator agent.
// No server-only imports — safe to import from both server (agent, route) and client (panel).

export type BriefConfidence = 'high' | 'medium' | 'low'

export interface BriefSource {
  source: string
  title: string
}

export interface PhaseGateBrief {
  issue: string
  recommendation: string
  confidence: BriefConfidence
  decision_owner: string
  decision_by: string
  rationale: string
  sources: BriefSource[]
  raw: string
}

function stripMarkdown(s: string): string {
  return s
    .replace(/^\*+\s*/, '')
    .replace(/\s*\*+$/, '')
    .replace(/^#+\s*/, '')
    .trim()
}

function extractField(text: string, label: string): string {
  // Match optional leading markdown (**, #) before the label
  const re = new RegExp(`(?:\\*{1,2}|#{1,3}\\s*)?${label}:\\*{0,2}\\s*([^\\n]+)`, 'i')
  const raw = text.match(re)?.[1] ?? ''
  return stripMarkdown(raw)
}

function extractRationale(text: string): string {
  // Stop at end-of-text OR at the SOURCES marker (appended by the agent after model output)
  const re = /(?:\*{1,2}|#{1,3}\s*)?RATIONALE:\*{0,2}\s*([\s\S]+?)(?=\n\s*SOURCES:|$)/i
  const m = text.match(re)
  if (!m) return ''
  return stripMarkdown(m[1]).replace(/\n+/g, ' ').trim()
}

function extractSources(text: string): BriefSource[] {
  const m = text.match(/\n\s*SOURCES:\s*(\[[\s\S]*\])\s*$/i)
  if (!m) return []
  try {
    const parsed = JSON.parse(m[1]) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is BriefSource =>
        x !== null &&
        typeof x === 'object' &&
        typeof (x as BriefSource).source === 'string' &&
        typeof (x as BriefSource).title === 'string',
      )
  } catch {
    return []
  }
}

export function parseBrief(
  text: string,
  fallback?: { owner?: string; target_date?: string },
): PhaseGateBrief {
  const confidenceRaw = extractField(text, 'CONFIDENCE').toLowerCase()
  const confidence: BriefConfidence = confidenceRaw.includes('high')
    ? 'high'
    : confidenceRaw.includes('low')
      ? 'low'
      : 'medium'
  return {
    issue: extractField(text, 'ISSUE'),
    recommendation: extractField(text, 'RECOMMENDATION'),
    confidence,
    decision_owner: extractField(text, 'DECISION OWNER') || fallback?.owner || 'TBD',
    decision_by: extractField(text, 'DECISION BY') || fallback?.target_date || 'TBD',
    rationale: extractRationale(text),
    sources: extractSources(text),
    raw: text,
  }
}
