/**
 * Worked example for the dependency-graph KPI engine.
 *
 * Config: segment=fortune-500, architecture=HGX
 * Swap:   fabric  nvidia_spectrum_x → cornelis_cn5000
 *
 * Run:    npx tsx scripts/test-kpi-engine.ts
 *
 * Output sections:
 *   1. Engine setup confirmation
 *   2. CHANGED KPIs (with before / after values + provenance)
 *   3. HELD KPIs (with provenance preserved)
 *   4. Unverified flags — values the user must confirm before promoting to 'cited'
 *
 * The engine is pure and deterministic. The LLM (later phase) will read this
 * output and present it — it must never re-compute KPI values.
 */

import { applySwap, buildConfig, loadKnowledge } from '../lib/factory/kpi'
import type { KpiValue, SwapImpact, UnverifiedFlag } from '../lib/factory/kpi'

function fmtValue(v: KpiValue | null | undefined): string {
  if (!v) return '(no value in knowledge layer)'
  const parts: string[] = []
  if (v.range) {
    const { min, max, unit } = v.range
    const range =
      min === max ? `${min}${unit ? ' ' + unit : ''}` : `${min}–${max}${unit ? ' ' + unit : ''}`
    parts.push(range)
  }
  if (v.band) parts.push(`[${v.band}]`)
  if (v.text) parts.push(`"${v.text}"`)
  if (v.scale_conditional) {
    parts.push(
      `\n        scale-conditional:` +
        `\n          small-scale: ${v.scale_conditional.small_scale}` +
        `\n          large-scale: ${v.scale_conditional.large_scale}` +
        (v.scale_conditional.breakpoint
          ? `\n          breakpoint:  ${v.scale_conditional.breakpoint}`
          : ''),
    )
  }
  return parts.length ? parts.join(' ') : '(empty value)'
}

function fmtProvenance(v: KpiValue | null | undefined, indent: string = '        '): string {
  if (!v) return ''
  const p = v.provenance
  const lines: string[] = [`${indent}[${p.status}]${p.flag ? ' ⚑ ' + p.flag : ''}`]
  if (p.claimed_by) lines.push(`${indent}claimed-by: ${p.claimed_by}`)
  if (p.source) lines.push(`${indent}source:     ${p.source}`)
  if (p.source_url) lines.push(`${indent}url:        ${p.source_url}`)
  if (p.source_date) lines.push(`${indent}src-date:   ${p.source_date}`)
  lines.push(`${indent}verified:   ${p.last_verified}`)
  if (p.notes) lines.push(`${indent}notes:      ${p.notes}`)
  return lines.join('\n')
}

function printImpact(impact: SwapImpact, kind: 'changed' | 'held'): void {
  const kpi = impact.kpi
  console.log(`  ${kpi.id}  —  ${kpi.name}  (Tier ${kpi.tier})`)
  console.log(`    why: ${impact.why}`)
  if (kind === 'changed') {
    console.log(`    before: ${fmtValue(impact.before)}`)
    if (impact.before) console.log(fmtProvenance(impact.before, '      '))
    console.log(`    after:  ${fmtValue(impact.after)}`)
    if (impact.after) console.log(fmtProvenance(impact.after, '      '))
  } else {
    console.log(`    value:  ${fmtValue(impact.before)}`)
    if (impact.before) console.log(fmtProvenance(impact.before, '      '))
  }
  if (kpi.honesty_note) console.log(`    ⚠  honesty: ${kpi.honesty_note}`)
  console.log()
}

function printUnverified(flag: UnverifiedFlag): void {
  console.log(`  ⚑  ${flag.kpi_id}  @  ${flag.component_id}  [${flag.status}]`)
  if (flag.notes) console.log(`     ${flag.notes}`)
}

// ─────────────────────────────────────────────────────────────
// Run the worked example
// ─────────────────────────────────────────────────────────────

const knowledge = loadKnowledge()
console.log('═══════════════════════════════════════════════════════════════')
console.log('  Dependency-graph KPI engine — worked example')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`  Corpus version: ${knowledge.manifest.corpus_version}`)
console.log(`  Last verified:  ${knowledge.manifest.last_verified}`)
console.log(`  Knowledge:      ${knowledge.segments.length} segments, ${knowledge.architectures.length} architectures, ${knowledge.components.size} components`)
console.log()

const config = buildConfig('fortune-500', 'HGX')
console.log('  Config (Fortune 500 + HGX defaults):')
console.log(`    segment:      ${config.segment}`)
console.log(`    architecture: ${config.architecture}`)
console.log(`    gpu:          ${config.gpu}`)
console.log(`    fabric:       ${config.fabric}`)
console.log(`    software:     ${config.software}`)
console.log(`    oem:          ${config.oem}`)
console.log(`    isv:          ${config.isv}`)
console.log()

const swap = {
  slot: 'fabric' as const,
  from: 'nvidia_spectrum_x',
  to: 'cornelis_cn5000',
}
console.log(`  Swap:           fabric  ${swap.from}  →  ${swap.to}`)
console.log()

const report = applySwap(config, swap)

console.log('═══════════════════════════════════════════════════════════════')
console.log(`  CHANGED (${report.changed.length} KPIs touched by the swap)`)
console.log('═══════════════════════════════════════════════════════════════')
console.log()
for (const impact of report.changed) printImpact(impact, 'changed')

console.log('═══════════════════════════════════════════════════════════════')
console.log(`  HELD (${report.held.length} KPIs unchanged by the swap)`)
console.log('═══════════════════════════════════════════════════════════════')
console.log()
for (const impact of report.held) printImpact(impact, 'held')

console.log('═══════════════════════════════════════════════════════════════')
console.log(`  UNVERIFIED — VALUES FLAGGED FOR USER VERIFICATION  (${report.unverified.length})`)
console.log('═══════════════════════════════════════════════════════════════')
console.log('  These values were tagged `directional` with a `verify-needed` flag because')
console.log('  I could not confirm them against an authoritative public source during the')
console.log('  build pass. Each must be confirmed before being promoted to `cited`.')
console.log()
if (report.unverified.length === 0) {
  console.log('  (none — all touched values are confirmed)')
} else {
  for (const flag of report.unverified) printUnverified(flag)
}
console.log()

console.log('═══════════════════════════════════════════════════════════════')
console.log('  End of worked example.')
console.log(
  '  Honesty boundary: every value above carries its own provenance tag.',
)
console.log(
  '  Engine is pure and deterministic — the LLM never computes these values.',
)
console.log('═══════════════════════════════════════════════════════════════')
