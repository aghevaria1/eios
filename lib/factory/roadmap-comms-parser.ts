// Shared types + parser for the Roadmap Comms Generator agent.
// No server-only imports — safe to import from both server (agent, route) and client (panel).

import type { CommitmentStatus } from './types'

export interface RoadmapComms {
  subject: string
  to: string
  from: string
  re: string
  situation: string
  impact: string
  mitigation: string
  escalation: string
  sign_off: string
  status: CommitmentStatus
  raw: string
}

const LABEL_PATTERNS = [
  'SUBJECT',
  'TO',
  'FROM',
  'RE',
  'SITUATION',
  'IMPACT',
  'MITIGATION(?:\\s*\\/\\s*NEXT\\s*STEPS)?',
  'ESCALATION(?:\\s+PATH)?',
  'SIGN[-\\s]?OFF',
]

function stripMarkdown(s: string): string {
  return s
    .replace(/^\*+\s*/, '')
    .replace(/\s*\*+$/, '')
    .replace(/^#+\s*/, '')
    .trim()
}

function extractLine(text: string, label: string): string {
  const re = new RegExp(`(?:\\*{1,2}|#{1,3}\\s*)?${label}:\\*{0,2}\\s*([^\\n]+)`, 'i')
  return stripMarkdown(text.match(re)?.[1] ?? '')
}

function extractBlock(text: string, label: string): string {
  const others = LABEL_PATTERNS.filter((l) => l !== label).join('|')
  const re = new RegExp(
    `(?:\\*{1,2}|#{1,3}\\s*)?${label}:\\*{0,2}\\s*\\n?([\\s\\S]+?)(?=\\n\\s*(?:\\*{1,2}|#{1,3}\\s*)?(?:${others}):|$)`,
    'i',
  )
  const m = text.match(re)
  if (!m) return ''
  return stripMarkdown(m[1])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

export function parseRoadmapComms(text: string, status: CommitmentStatus): RoadmapComms {
  return {
    subject: extractLine(text, 'SUBJECT'),
    to: extractLine(text, 'TO'),
    from: extractLine(text, 'FROM'),
    re: extractLine(text, 'RE'),
    situation: extractBlock(text, 'SITUATION'),
    impact: extractBlock(text, 'IMPACT'),
    mitigation: extractBlock(text, 'MITIGATION(?:\\s*\\/\\s*NEXT\\s*STEPS)?'),
    escalation: extractBlock(text, 'ESCALATION(?:\\s+PATH)?'),
    sign_off: extractBlock(text, 'SIGN[-\\s]?OFF'),
    status,
    raw: text,
  }
}
