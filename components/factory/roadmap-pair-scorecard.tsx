'use client'

import type { Component, KpiValue, Provenance } from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'

// Roadmap Pair Scorecard — Rubin VR200 vs MI455X (next-gen pairing).
//
// MIRRORS WinLossScorecard's visual pattern (4-column table: AXIS / Rubin /
// MI455X / WINNER) but is a SEPARATE component because:
//   · Every cell is CLAIMED / VERIFY-NEEDED / UNRESOLVED (no CITED possible
//     — both chips unreleased)
//   · FP4 is a RANGE (35-50 PFLOPS) — current-gen scorecard assumes min=max
//     for PARITY comparison; ranges need different handling
//   · Integration axis is qualitative (NVIDIA NVLink 6 + SHARP vs no AMD
//     equivalent at scale) — doesn't fit numeric PARITY-tolerance logic
//   · Heavy ROADMAP banner is mandatory framing, not optional
//
// HONESTY DISCIPLINE:
//   · The "⚠ ROADMAP PAIR" banner up top names neither chip as buyable
//   · Memory bandwidth cell surfaces the competitive-response story
//     inline (NVIDIA bumped 13→22 TB/s at CES 2026 to beat AMD)
//   · FP4 UNRESOLVED because AMD claim sits inside NVIDIA spread
//   · FP8 UNRESOLVED because Rubin figure is a multiplier on a verify-
//     needed base (double uncertainty) — distinct from FP4 (overlapping
//     ranges) — both unresolved for different honest reasons
//   · Pattern-repeats footer names the moat-locus stability: memory-AMD
//     + bandwidth-NVIDIA + integration-NVIDIA pattern carries from
//     current gen — moat is integration/ecosystem, not silicon

interface Props {
  rubin: Component
  mi455x: Component
}

export function RoadmapPairScorecard({ rubin, mi455x }: Props) {
  const axes = buildRoadmapAxes(rubin, mi455x)
  return (
    <section className="overflow-hidden rounded-md border border-amber-500/40 bg-gray-900/30">
      <header className="border-b border-amber-500/40 bg-amber-500/5 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-amber-300">
          ROADMAP PAIR · NEXT-GEN SCORECARD  ·  Rubin VR200 vs MI455X
        </div>
        <div className="mt-1 text-xs leading-relaxed text-amber-100/80">
          <span className="font-mono text-amber-300">⚠ ROADMAP PAIR —</span>{' '}
          both unreleased, every figure a vendor claim. Neither chip is
          buyable today. Pills reflect claim-vs-claim comparison. UNRESOLVED
          is the honest verdict where claim-spreads overlap (FP4) or
          comparison-quality is uneven (FP8). The heaviest-caveated scorecard
          in the app — by design.
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950/50 text-left">
              <th className="w-[22%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                AXIS
              </th>
              <th className="w-[26%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                {rubin.name}
              </th>
              <th className="w-[26%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                {mi455x.name}
              </th>
              <th className="w-[26%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                WINNER
              </th>
            </tr>
          </thead>
          <tbody>
            {axes.map((axis) => (
              <RoadmapAxisRow key={axis.id} axis={axis} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-amber-500/30 bg-amber-500/5 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-amber-300">
          PATTERN REPEATS
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">
          The current-gen story repeats at the roadmap pair: AMD wins memory
          capacity, NVIDIA wins bandwidth + integration, compute axes
          unresolved. The moat locus is{' '}
          <span className="font-mono text-[#9FD848]">stable across generations</span>{' '}
          — integration / ecosystem, not raw silicon. The bandwidth lead is
          tactically positioned (NVIDIA bumped 13 → 22 TB/s at CES 2026
          specifically to land above MI455X&apos;s claimed 19.6 TB/s) — see
          the bandwidth-axis caveat.
        </p>
      </div>
    </section>
  )
}

// ─── Axis types ────────────────────────────────────────────────────────
type RoadmapVerdict = 'nvidia' | 'amd' | 'unresolved'

interface RoadmapAxis {
  id: string
  name: string
  rubinDisplay: string
  rubinProvenance: Provenance | null
  mi455xDisplay: string
  mi455xProvenance: Provenance | null
  verdict: RoadmapVerdict
  verdictLabel: string
  verdictSublabel: string
  caveatNote: string | null
}

function RoadmapAxisRow({ axis }: { axis: RoadmapAxis }) {
  const classes = verdictClasses(axis.verdict)
  return (
    <>
      <tr className="border-t border-gray-800 align-top">
        <td className="bg-gray-900/40 px-4 py-3">
          <div className="text-sm font-semibold text-gray-100">{axis.name}</div>
          <div className="mt-1 font-mono text-[10px] tracking-widest text-gray-500">
            {axis.id}
          </div>
        </td>
        <td className="bg-gray-900/60 px-4 py-3">
          <ValueCell display={axis.rubinDisplay} provenance={axis.rubinProvenance} />
        </td>
        <td className="bg-gray-900/60 px-4 py-3">
          <ValueCell display={axis.mi455xDisplay} provenance={axis.mi455xProvenance} />
        </td>
        <td className="bg-gray-900/40 px-4 py-3">
          <div className="space-y-1">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes.pill}`}
            >
              {axis.verdict === 'unresolved'
                ? 'UNRESOLVED'
                : axis.verdict === 'nvidia'
                  ? 'NVIDIA'
                  : 'AMD'}
            </span>
            <div className={`text-xs font-semibold leading-tight ${classes.label}`}>
              {axis.verdictLabel}
            </div>
            {axis.verdictSublabel && (
              <div className="text-[10px] leading-relaxed text-gray-500">
                {axis.verdictSublabel}
              </div>
            )}
          </div>
        </td>
      </tr>
      {axis.caveatNote && (
        <tr className="border-t border-gray-800">
          <td colSpan={4} className="bg-gray-900/30 px-4 pb-3">
            <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] leading-relaxed text-amber-100/90">
              <span className="font-mono uppercase tracking-widest text-amber-300">
                caveat ·
              </span>{' '}
              {axis.caveatNote}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function ValueCell({
  display,
  provenance,
}: {
  display: string
  provenance: Provenance | null
}) {
  return (
    <div className="space-y-1">
      {provenance && <ProvenancePill provenance={provenance} />}
      <div className="text-xs leading-relaxed text-gray-200">{display}</div>
    </div>
  )
}

function verdictClasses(v: RoadmapVerdict): { pill: string; label: string } {
  switch (v) {
    case 'nvidia':
      return {
        pill: 'bg-[#76B900]/10 border-[#76B900]/40 text-[#9FD848]',
        label: 'text-[#9FD848]',
      }
    case 'amd':
      return {
        pill: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
        label: 'text-sky-300',
      }
    case 'unresolved':
      return {
        pill: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        label: 'text-rose-300',
      }
  }
}

// ─── Axis builder ─────────────────────────────────────────────────────
function buildRoadmapAxes(rubin: Component, mi455x: Component): RoadmapAxis[] {
  const rCap = rubin.kpi_values?.compute_memory_capacity_per_gpu
  const aCap = mi455x.kpi_values?.compute_memory_capacity_per_gpu
  const rBw = rubin.kpi_values?.compute_memory_bandwidth_per_gpu
  const aBw = mi455x.kpi_values?.compute_memory_bandwidth_per_gpu
  const rFp4 = rubin.kpi_values?.compute_flops_fp4_per_gpu_dense
  const aFp4 = mi455x.kpi_values?.compute_flops_fp4_per_gpu_dense
  const rFp8 = rubin.kpi_values?.compute_flops_fp8_per_gpu_dense
  const aFp8 = mi455x.kpi_values?.compute_flops_fp8_per_gpu_dense

  return [
    {
      id: 'compute_memory_capacity_per_gpu',
      name: 'Memory capacity (per GPU)',
      rubinDisplay: rangeDisplay(rCap),
      rubinProvenance: rCap?.provenance ?? null,
      mi455xDisplay: rangeDisplay(aCap),
      mi455xProvenance: aCap?.provenance ?? null,
      verdict: 'amd',
      verdictLabel: 'AMD (claimed)',
      verdictSublabel: '~50% capacity advantage — memory-wins pattern carries from current gen',
      caveatNote:
        'Both chips roadmap / unreleased. AMD MI455X claims 432 GB HBM4 vs NVIDIA Rubin VR200\'s 288 GB HBM4 — same memory-AMD-lead pattern observed at the current generation (MI355X 288 GB vs B200 192 GB). Pattern is stable across generations.',
    },
    {
      id: 'compute_memory_bandwidth_per_gpu',
      name: 'Memory bandwidth (per GPU)',
      rubinDisplay: rangeDisplay(rBw),
      rubinProvenance: rBw?.provenance ?? null,
      mi455xDisplay: rangeDisplay(aBw),
      mi455xProvenance: aBw?.provenance ?? null,
      verdict: 'nvidia',
      verdictLabel: 'NVIDIA (claimed)',
      verdictSublabel: '~13% lead — but chosen-late spec, see caveat',
      caveatNote:
        'COMPETITIVE-RESPONSE STORY: NVIDIA bumped Rubin bandwidth from ~13 TB/s at GTC 2025 to ~22 TB/s at CES 2026 in explicit response to AMD MI455X positioning. The bandwidth lead is real (per current claims) AND tactically chosen — both readings are honest. Not an organic generation step.',
    },
    {
      id: 'compute_flops_fp4_per_gpu_dense',
      name: 'FP4 compute (per GPU, dense)',
      rubinDisplay: rangeDisplay(rFp4),
      rubinProvenance: rFp4?.provenance ?? null,
      mi455xDisplay: rangeDisplay(aFp4),
      mi455xProvenance: aFp4?.provenance ?? null,
      verdict: 'unresolved',
      verdictLabel: 'UNRESOLVED',
      verdictSublabel: 'AMD 40 PFLOPS sits INSIDE Rubin 35-50 PFLOPS range',
      caveatNote:
        'Rubin FP4 figures vary across public disclosures by dense/sparse and per-GPU framing — rendered as a RANGE (35-50 PFLOPS), not a point, because the spread IS the honest signal. AMD\'s 40 PFLOPS claim sits inside the NVIDIA spread, so no defensible winner. Distinct from FP8 unresolved (which has no firm Rubin figure at all).',
    },
    {
      id: 'compute_flops_fp8_per_gpu_dense',
      name: 'FP8 compute (per GPU, dense)',
      rubinDisplay: rFp8?.text ?? rangeDisplay(rFp8),
      rubinProvenance: rFp8?.provenance ?? null,
      mi455xDisplay: rangeDisplay(aFp8),
      mi455xProvenance: aFp8?.provenance ?? null,
      verdict: 'unresolved',
      verdictLabel: 'UNRESOLVED',
      verdictSublabel: 'Rubin = vendor multiplier on a verify-needed base; no firm figure',
      caveatNote:
        'LAYERED UNCERTAINTY: Rubin FP8 is described as ~3.5× Blackwell B200; Blackwell FP8 dense is itself verify-needed (datasheet column read). A multiplier on a verify-needed base = double-uncertainty — no defensible point value to compare against AMD\'s 20 PFLOPS claim. UNRESOLVED is honest. NOT parity (asserts confidence we don\'t have), NOT a clean lead (no firm Rubin number).',
    },
    {
      id: 'integration_qualitative',
      name: 'Integration (qualitative)',
      rubinDisplay: 'NVLink 6 + SHARP + ecosystem',
      rubinProvenance: NVIDIA_INTEGRATION_PROVENANCE,
      mi455xDisplay: 'no NVLink-equivalent at scale; ROCm + open-fabric stack',
      mi455xProvenance: AMD_INTEGRATION_PROVENANCE,
      verdict: 'nvidia',
      verdictLabel: 'NVIDIA',
      verdictSublabel: 'integration moat carries forward from current gen',
      caveatNote:
        'Qualitative axis — not a numeric comparison. NVIDIA\'s NVLink + SHARP + CUDA ecosystem moat (documented at current gen) carries forward at the roadmap pair; AMD\'s open-fabric / ROCm posture continues to be the diagonal positioning, not a like-for-like substitute. Integration is the stable moat locus across generations.',
    },
  ]
}

function rangeDisplay(v: KpiValue | undefined): string {
  if (!v) return '(no value seeded)'
  if (v.text) return v.text
  if (v.range) {
    const { min, max, unit } = v.range
    if (min === max) return `${min}${unit ? ' ' + unit : ''}`
    return `${min}–${max}${unit ? ' ' + unit : ''}`
  }
  return '(empty value)'
}

// Qualitative provenance for the Integration axis. Cited at the architectural-
// difference level (NVLink + SHARP existence is documented); not a numeric
// comparison.
const NVIDIA_INTEGRATION_PROVENANCE: Provenance = {
  status: 'cited',
  source:
    'NVIDIA roadmap materials (Rubin / Vera Rubin architecture) — NVLink 6 + SHARP collective acceleration + CUDA / NVAIE ecosystem continuity.',
  last_verified: '2026-05-26',
}

const AMD_INTEGRATION_PROVENANCE: Provenance = {
  status: 'directional',
  source:
    'AMD Helios platform positioning — ROCm + Ultra Ethernet Consortium open-fabric posture; no NVLink-equivalent rack-scale interconnect at MI455X generation.',
  last_verified: '2026-05-26',
}
