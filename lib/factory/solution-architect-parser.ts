// Parser for the Solution Architect agent's prose output.
//
// The agent emits TWO labeled sections — CONFIG_SUMMARY and RATIONALE — and nothing else.
// All numbers and provenance tags live in the engine's output (separate from the model's prose).
// This parser only extracts the prose; if a section is missing, returns empty string.

export interface SolutionArchitectProse {
  config_summary: string
  rationale: string
  raw: string
}

function stripMarkdownHeader(s: string): string {
  return s.replace(/^[#\s*]+/, '').trim()
}

function extractSection(text: string, label: string, nextLabels: string[]): string {
  // Match "LABEL:" (optionally preceded by markdown decoration) and capture until
  // the next labeled section or end-of-text.
  const labelPattern = `(?:\\*{1,2}|#{1,3}\\s*)?${label}:\\*{0,2}`
  const stopPattern = nextLabels
    .map((l) => `\\n\\s*(?:\\*{1,2}|#{1,3}\\s*)?${l}:`)
    .join('|')
  const re = new RegExp(`${labelPattern}\\s*([\\s\\S]+?)(?=${stopPattern}|$)`, 'i')
  const m = text.match(re)
  if (!m) return ''
  return stripMarkdownHeader(m[1]).trim()
}

export function parseAgentProse(text: string): SolutionArchitectProse {
  return {
    config_summary: extractSection(text, 'CONFIG_SUMMARY', ['RATIONALE']),
    rationale: extractSection(text, 'RATIONALE', ['CONFIG_SUMMARY']),
    raw: text,
  }
}
