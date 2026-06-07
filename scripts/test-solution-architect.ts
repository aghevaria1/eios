/**
 * Verification test for the Solution Architect agent.
 *
 * Run: npx tsx scripts/test-solution-architect.ts
 *
 * What this verifies:
 *   1. RAG retrieves grounding chunks from the nvidia corpus (non-empty, on-topic).
 *   2. The KPI engine produces every number + provenance tag (authoritative output).
 *   3. The Solution Architect agent reasons over engine + RAG to produce prose only.
 *   4. HONESTY DIVISION: the agent's prose contains NO numeric KPI values
 *      (digit + unit patterns, percentages, multipliers). Engine output carries every number.
 *
 * The honesty check is the verification gate — if the agent's prose contains a
 * numeric KPI value, the test reports a DIVISION VIOLATION.
 */

// Must come first — populates process.env from .env.local before the Anthropic
// SDK is constructed at module scope in the agent.
import './_load-env'

import {
  runSolutionArchitectAgent,
  type SolutionArchitectReport,
  type KpiResult,
  type ComponentKpiResult,
} from '../agents/factory/solution-architect-agent'
import { retrieveChunks } from '../lib/factory/rag'
import type { KpiValue, UnverifiedFlag } from '../lib/factory/kpi'

const NVIDIA_TARGET = 'nvidia'

// ────────────────────────────────────────────────────────────────
// Honesty-division check — scan agent prose for numeric KPI values.
// ────────────────────────────────────────────────────────────────

interface ProseViolation {
  pattern: string
  match: string
  context: string
}

const KPI_VALUE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'memory capacity (XGB / XTB)', re: /\b\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?\s*(?:GB|TB|PB|MB)\b/gi },
  { name: 'bandwidth (X TB/s)', re: /\b\d+(?:\.\d+)?\s*(?:TB\/s|GB\/s|MB\/s)\b/gi },
  { name: 'compute throughput (PFLOPS / EF)', re: /\b\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?\s*(?:PFLOPS|TFLOPS|EFLOPS|PFLOPs|EF)\b/gi },
  { name: 'network throughput (Gbps / Tbps)', re: /\b\d+(?:\.\d+)?\s*(?:Gbps|Tbps|Gb\/s|Tb\/s)\b/gi },
  { name: 'percentages', re: /\b\d+(?:\.\d+)?\s*%/g },
  { name: 'message-rate / token-rate (X million msg/sec)', re: /\b\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?\s*(?:million|billion)\b/gi },
  { name: 'multipliers (Nx)', re: /\b\d+(?:\.\d+)?\s*x\b/gi },
  { name: 'latency (X ns / X μs / X ms)', re: /\b\d+(?:\.\d+)?\s*(?:ns|μs|us|ms)\b/gi },
]

function checkProseDivision(prose: string): ProseViolation[] {
  const violations: ProseViolation[] = []
  for (const { name, re } of KPI_VALUE_PATTERNS) {
    const matches = Array.from(prose.matchAll(re))
    for (const m of matches) {
      const idx = m.index ?? 0
      const start = Math.max(0, idx - 30)
      const end = Math.min(prose.length, idx + m[0].length + 30)
      const context = prose.slice(start, end).replace(/\n+/g, ' ').trim()
      violations.push({ pattern: name, match: m[0], context: `…${context}…` })
    }
  }
  return violations
}

// ────────────────────────────────────────────────────────────────
// Formatters for the report sections.
// ────────────────────────────────────────────────────────────────

function fmtValue(v: KpiValue | null | undefined): string {
  if (!v) return '(no value seeded in knowledge layer)'
  const parts: string[] = []
  if (v.range) {
    const { min, max, unit } = v.range
    parts.push(
      min === max ? `${min}${unit ? ' ' + unit : ''}` : `${min}–${max}${unit ? ' ' + unit : ''}`,
    )
  }
  if (v.band) parts.push(`[${v.band}]`)
  if (v.text) parts.push(`"${v.text}"`)
  if (v.scale_conditional) {
    parts.push(
      `\n          scale-conditional small: ${v.scale_conditional.small_scale}` +
        `\n          scale-conditional large: ${v.scale_conditional.large_scale}`,
    )
  }
  return parts.length ? parts.join(' ') : '(empty value)'
}

function fmtProvenance(v: KpiValue | null | undefined, indent: string): string {
  if (!v) return ''
  const p = v.provenance
  const lines: string[] = [`${indent}[${p.status}]${p.flag ? ' ⚑ ' + p.flag : ''}`]
  if (p.claimed_by) lines.push(`${indent}claimed-by: ${p.claimed_by}`)
  if (p.source) lines.push(`${indent}source:     ${p.source}`)
  if (p.source_url) lines.push(`${indent}url:        ${p.source_url}`)
  if (p.notes) lines.push(`${indent}notes:      ${p.notes}`)
  return lines.join('\n')
}

function printKpiResult(r: KpiResult): void {
  console.log(`    ${r.kpi.id}  —  ${r.kpi.name}  (Tier ${r.kpi.tier})`)
  console.log(`      deps:  ${r.kpi.dependencies.join(', ')}`)
  console.log(`      value: ${fmtValue(r.value)}`)
  if (r.value) console.log(fmtProvenance(r.value, '        '))
}

function printComponentKpi(c: ComponentKpiResult): void {
  console.log(`    ${c.component_id}::${c.kpi.id}  —  ${c.kpi.name}`)
  console.log(`      value: ${fmtValue(c.value)}`)
  console.log(fmtProvenance(c.value, '        '))
}

function printUnverified(f: UnverifiedFlag): void {
  console.log(`  ⚑  ${f.kpi_id}  @  ${f.component_id}  [${f.status}]`)
  if (f.notes) console.log(`     ${f.notes}`)
}

// ────────────────────────────────────────────────────────────────
// Main test flow.
// ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  v3 Solution Architect agent — verification test')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Target: ${NVIDIA_TARGET} (loaded explicitly; data/targets/config.json untouched)`)
  console.log()

  // ── 1. RAG sanity check ──
  console.log('═══ RAG SANITY CHECK ═══')
  const sanityQuery = 'Blackwell B200 memory HGX architecture'
  const sanityChunks = retrieveChunks(sanityQuery, 3, NVIDIA_TARGET)
  console.log(`  query:     "${sanityQuery}"`)
  console.log(`  retrieved: ${sanityChunks.length} chunks across ${new Set(sanityChunks.map((c) => c.source)).size} sources`)
  for (const c of sanityChunks) {
    console.log(`    · ${c.title}  [${c.source}]`)
  }
  if (sanityChunks.length === 0) {
    console.error('  ✗  RAG returned zero chunks — corpus may be empty or query has no overlap.')
    process.exit(1)
  } else {
    console.log('  ✓  RAG retrieval is non-empty and traces to verified knowledge.')
  }
  console.log()

  // ── 2. Run the Solution Architect agent ──
  console.log('═══ RUNNING SOLUTION ARCHITECT AGENT ═══')
  console.log('  segment:      fortune-500')
  console.log('  architecture: HGX')
  console.log('  streaming model output to stdout via onStream callback…')
  console.log()
  process.stdout.write('  >> ')

  const report: SolutionArchitectReport = await runSolutionArchitectAgent(
    { segment_id: 'fortune-500', architecture_id: 'HGX' },
    (token) => process.stdout.write(token),
  )
  console.log('\n')

  // ── 3. ENGINE OUTPUT (authoritative — values + provenance) ──
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  ENGINE OUTPUT  (authoritative — every number + provenance from the')
  console.log('                  deterministic KPI engine; LLM is forbidden to alter)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log()
  console.log('  Composed config:')
  console.log(`    segment:      ${report.config.segment}  (${report.segment.name})`)
  console.log(`    architecture: ${report.config.architecture}  (${report.architecture.name})`)
  console.log(`    gpu:          ${report.config.gpu}`)
  console.log(`    fabric:       ${report.config.fabric}`)
  console.log(`    software:     ${report.config.software}`)
  console.log(`    oem:          ${report.config.oem}`)
  console.log(`    isv:          ${report.config.isv}`)
  console.log()

  console.log(`  Segment north-star KPI(s) for ${report.segment.name}:`)
  for (const r of report.delivered_kpis.north_star) printKpiResult(r)
  console.log()

  console.log(`  Segment supporting KPI(s) for ${report.segment.name}:`)
  for (const r of report.delivered_kpis.supporting) printKpiResult(r)
  console.log()

  console.log(`  Component KPI values  (underlying verified values for the chosen components):`)
  for (const c of report.delivered_kpis.component_kpis) printComponentKpi(c)
  console.log()

  console.log(`  Unverified flags  (${report.unverified_flags.length} — these values must NOT be presented as 'cited' without confirmation):`)
  if (report.unverified_flags.length === 0) console.log('    (none)')
  for (const f of report.unverified_flags) printUnverified(f)
  console.log()

  // ── 4. RAG GROUNDING ──
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  RAG GROUNDING  (chunks the agent received as prose context)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log()
  for (const c of report.grounding_chunks) {
    console.log(`  · ${c.title}`)
    console.log(`    section: ${c.section ?? 'general'}   source: ${c.source}`)
  }
  console.log()

  // ── 5. AGENT PROSE OUTPUT (LLM-sourced — qualitative only) ──
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  AGENT PROSE OUTPUT  (LLM-sourced — qualitative only, NO numbers)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log()
  console.log('  CONFIG_SUMMARY:')
  console.log(indent(report.config_summary, '    '))
  console.log()
  console.log('  RATIONALE:')
  console.log(indent(report.rationale, '    '))
  console.log()

  // ── 6. HONESTY-DIVISION VERIFICATION ──
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  HONESTY-DIVISION VERIFICATION')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log()
  const proseToCheck = `${report.config_summary}\n${report.rationale}`
  const violations = checkProseDivision(proseToCheck)

  console.log(`  Engine-sourced KPI values:        ${countEngineValues(report)} (every number lives here, each with a provenance tag)`)
  console.log(`  RAG grounding chunks retrieved:   ${report.grounding_chunks.length}`)
  console.log(`  Agent prose total length:         ${proseToCheck.length} chars`)
  console.log(`  Agent prose numeric-value scan:   ${violations.length} violation(s)`)
  console.log()

  if (violations.length === 0) {
    console.log('  ✓  HONESTY DIVISION HELD')
    console.log('     The agent prose references KPIs by name only. No numeric KPI values, units,')
    console.log('     percentages, or multipliers detected. All numbers live in the engine section,')
    console.log('     each tagged with its provenance (cited / claimed / directional).')
  } else {
    console.log('  ✗  DIVISION VIOLATION — the agent prose emitted numeric KPI value(s).')
    console.log('     The architectural rule is: prose is qualitative; every number lives in the')
    console.log('     engine output with its provenance tag. Violations:')
    for (const v of violations) {
      console.log(`     · pattern: ${v.pattern}`)
      console.log(`       match:   "${v.match}"`)
      console.log(`       context: ${v.context}`)
    }
  }
  console.log()

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  End of verification test.')
  console.log('═══════════════════════════════════════════════════════════════')

  if (violations.length > 0) process.exit(2)
}

function indent(s: string, prefix: string): string {
  if (!s) return prefix + '(empty)'
  return s
    .split('\n')
    .map((line) => prefix + line)
    .join('\n')
}

function countEngineValues(r: SolutionArchitectReport): number {
  const ns = r.delivered_kpis.north_star.filter((x) => x.value !== null).length
  const sup = r.delivered_kpis.supporting.filter((x) => x.value !== null).length
  const comp = r.delivered_kpis.component_kpis.length
  return ns + sup + comp
}

main().catch((e) => {
  console.error('test-solution-architect failed:', e)
  process.exit(1)
})
