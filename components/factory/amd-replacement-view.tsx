'use client'

import type {
  Component,
  KpiValue,
  Provenance,
  SwapReport,
} from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'
import { BlastRadiusStrip } from './blast-radius-strip'
import {
  ChangedKpiSection,
  HeldKpiSection,
  UnverifiedFlagsSection,
  NotesBlock,
  isCautionNote,
} from './swap-report-card'
import { RoadmapPairScorecard } from './roadmap-pair-scorecard'
import { CadenceTimelineStrip } from './cadence-timeline-strip'
import { Act1LayerTable } from './act1-layer-table'
import { MoatTrajectoryTable } from './moat-trajectory-table'
import { SwitchingCostTable } from './switching-cost-table'

interface Props {
  baselineGpu: Component
  targetGpu: Component
  // Roadmap-pair scorecard inputs (NVIDIA Rubin VR200 vs AMD MI455X). Both
  // are generation: 'roadmap'. The scorecard reflects the heaviest-caveated
  // comparison in the app — every figure a vendor claim, neither buyable.
  roadmapRubin: Component
  roadmapMi455x: Component
  report: SwapReport
}

export function AmdReplacementView({
  baselineGpu,
  targetGpu,
  roadmapRubin,
  roadmapMi455x,
  report,
}: Props) {
  const heldWithValues = report.held.filter((h) => h.before || h.after)
  return (
    <div className="space-y-8">
      {/* ─── ACT 1 ──────────────────────────────────────────────────
          WHERE'S THE FIGHT — diagnosis. Brief THESIS paragraph + the new
          5-row layer-verdict TABLE (replaces the LayerFightMap band-style
          rendering in this view; LayerFightMap component itself untouched
          for use by Cerebras + fabric tabs). All 5 verdicts are FROZEN
          byte-for-byte from the AMD branch of LayerFightMap's verdicts.
      */}
      <ActSection>
        <ActHeader
          number="1"
          title="WHERE'S THE FIGHT"
          subtitle="diagnosis — where does AMD compete?"
        />
        <DiagonalFramingLine />
        <Act1LayerTable />
      </ActSection>

      {/* ─── ACT 2 ──────────────────────────────────────────────────
          THE SILICON RACE & THE MOAT — evidence. Internal structure:
            Half 1: dated silicon (current-gen + roadmap-pair + cadence)
            TURN:   "SILICON RESETS — THE MOAT COMPOUNDS"
            Half 2: directional moat (L5/L4/L3 table — visually distinct
                    via dashed border + "DIRECTION — NOT SCORED" header)
          All silicon-half components FROZEN byte-for-byte; sub-labels
          live OUTSIDE them (no scorecard component is edited). The moat
          table replaces the band-style MoatTrajectoryPanel — trajectories
          frozen, presentation now tabular.
      */}
      <ActSection>
        <ActHeader
          number="2"
          title="THE SILICON RACE & THE MOAT"
          subtitle="evidence — what's contested and where the moat actually lives"
        />

        {/* Half 1 — THE SILICON RACE (dated, frozen) */}
        <HalfSubLabel
          label="THE SILICON RACE"
          caption="dated, resets every generation"
        />
        <ScorecardSubStrip label="CURRENT GEN" tone="neutral" />
        <WinLossScorecard baselineGpu={baselineGpu} targetGpu={targetGpu} />
        <ScorecardSubStrip label="NEXT GEN · ROADMAP" tone="amber" />
        <RoadmapPairScorecard rubin={roadmapRubin} mi455x={roadmapMi455x} />
        <CadenceTimelineStrip />

        {/* THE TURN — pivot between dated silicon and directional moat */}
        <TheTurn text="SILICON RESETS — THE MOAT COMPOUNDS" />

        {/* Half 2 — THE MOAT (directional table, visually distinct) */}
        <HalfSubLabel
          label="THE MOAT"
          caption="directional, compounding · not scored"
        />
        <MoatTrajectoryTable />
      </ActSection>

      {/* ─── ACT 3 ──────────────────────────────────────────────────
          THE SWITCHING COST — consequence. Cost articulation LEADS
          (the SwitchingCostTable answers "what does it actually cost?")
          followed by the engine-output dependency cascade BELOW as the
          technical proof (BlastRadius + Changed/Held/Unverified — the
          dependency model in action). Cost first, then the engine
          cascade — sequencing solves the wordiness, not deletion.
      */}
      <ActSection>
        <ActHeader
          number="3"
          title="THE SWITCHING COST"
          subtitle="consequence — cost articulation, then the engine cascade as proof"
        />

        {/* The cost answer first */}
        <SwitchingCostTable />

        {/* Dependency-detail sub-label, then the engine output below */}
        <HalfSubLabel
          label="DEPENDENCY DETAIL"
          caption="the engine cascade — what changes vs holds when you swap the GPU slot"
        />
        <BlastRadiusStrip
          highlightedLayers={['L2']}
          slotLabel="GPU (compute sub-slot)"
          changedCount={report.changed.length}
          heldCount={report.held.length}
          framingText="GPU-slot swap. The dependency-graph engine counts here reflect the L2 (GPU) swap only — see Act 1's Layer Verdicts table above for the L4/L5 verdicts that do not run through this single-slot swap, and for the SHARED L1/L3 layers."
        />
        <ChangedKpiSection
          impacts={report.changed}
          target={targetGpu}
          slotLabel="gpu"
        />
        <HeldKpiSection
          impacts={heldWithValues}
          totalHeld={report.held.length}
          slotLabel="gpu"
        />
        {report.unverified.length > 0 && (
          <UnverifiedFlagsSection flags={report.unverified} />
        )}
      </ActSection>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// 3-Act scaffolding — the recomposition spine.
//
// HIERARCHY (consistent across all 3 acts):
//   · ACT HEADER     primary    NVIDIA-green left border + green caption
//   · HALF SUB-LABEL secondary  amber left border + amber caption
//   · SCORECARD SUB  tertiary   plain text strip (neutral gray or amber)
//   · THE TURN       pivot      centered + italic + emphatic divider
//
// Three colors, three levels — green-primary / amber-secondary /
// gray-tertiary. No competing colors.
// ────────────────────────────────────────────────────────────────────────

function ActSection({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>
}

function ActHeader({
  number,
  title,
  subtitle,
}: {
  number: string
  title: string
  subtitle: string
}) {
  return (
    <div className="border-l-2 border-l-[#76B900] bg-gray-900/60 px-4 py-3">
      <div className="text-[10px] font-mono font-semibold tracking-widest text-[#76B900]">
        ACT {number}  ·  {title}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-300">{subtitle}</p>
    </div>
  )
}

function HalfSubLabel({
  label,
  caption,
}: {
  label: string
  caption: string
}) {
  return (
    <div className="border-l border-l-amber-500/40 bg-amber-500/5 px-3 py-2">
      <div className="text-[10px] font-mono font-semibold tracking-widest text-amber-300">
        {label}
      </div>
      <p className="mt-0.5 text-[11px] italic leading-relaxed text-amber-100/80">
        {caption}
      </p>
    </div>
  )
}

function ScorecardSubStrip({
  label,
  tone,
}: {
  label: string
  tone: 'neutral' | 'amber'
}) {
  const color = tone === 'amber' ? 'text-amber-400' : 'text-gray-500'
  return (
    <div
      className={`text-[10px] font-mono font-semibold uppercase tracking-widest ${color}`}
    >
      {label}
    </div>
  )
}

function TheTurn({ text }: { text: string }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-600 to-gray-600/0" />
      <span className="whitespace-nowrap px-3 text-sm font-mono font-semibold italic tracking-wider text-amber-200">
        {text}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-600 to-gray-600/0" />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// (The previous buildLayerVerdicts function + AMD_NARRATIVE constant
// were removed in the tables-everywhere recomposition. The AMD layer
// verdicts now live in components/factory/act1-layer-table.tsx in their
// canonical tabular form. The LayerFightMap component is no longer used
// in this view; it remains in the codebase and is rendered by the
// Cerebras + fabric tabs as before.)
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Diagonal framing — concede-then-locate. User-approved text verbatim.
// Neutral gray styling (not NVIDIA-green) so it reads as analytical frame,
// not sales pitch. The honesty IS the persuasion.
// ────────────────────────────────────────────────────────────────────────
function DiagonalFramingLine() {
  return (
    <section className="rounded-md border border-gray-700 bg-gray-900/40 p-5">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        THESIS · concede-then-locate
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-200">
        At the current generation, the hardware race is close: B200 and MI355X
        are near-parity on FP4 compute (~9 vs ~9.2 PFLOPS), and MI355X actually
        leads on memory (288 vs 192 GB). The spec sheet was never the moat — and
        this generation proves it. NVIDIA&apos;s switching cost lives above the
        chip:{' '}
        <span className="font-mono text-[#76B900]">CUDA maturity</span>,{' '}
        <span className="font-mono text-[#76B900]">TensorRT-LLM</span>, and the
        software ecosystem, where ROCm is still closing the gap. (Roadmap view
        — Vera Rubin vs MI455X — coming next.)
      </p>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Win/Loss Scorecard — axis-by-axis, PARITY-aware (~5% tolerance).
// Pill double-duty: AMD-wins render sky CLAIMED, NVIDIA-wins render emerald
// CITED, PARITY renders neutral gray, UNRESOLVED renders rose VERIFY-NEEDED.
// Both products ship today — pills reflect evidence basis (NVIDIA datasheet
// vs AMD vendor-stated), NOT announced-vs-shipping.
// ────────────────────────────────────────────────────────────────────────

const PARITY_TOLERANCE_PCT = 5 // numbers within ~5% read as PARITY, not a winner

type ScorecardWinnerVariant =
  | 'baseline' // NVIDIA-wins
  | 'target'   // AMD-wins
  | 'parity'   // within tolerance, neutral
  | 'unresolved' // verify-needed on either side, low-confidence
  | 'na'       // missing data

interface ScorecardCellValue {
  displayText: string
  provenance: Provenance | null
}

interface ScorecardAxis {
  id: string
  name: string
  baselineValue: ScorecardCellValue
  targetValue: ScorecardCellValue
  winnerVariant: ScorecardWinnerVariant
  winnerLabel: string
  winnerSublabel: string
  winnerPillProvenance: Provenance | null
  cautionNote: string | null
}

function WinLossScorecard({
  baselineGpu,
  targetGpu,
}: {
  baselineGpu: Component
  targetGpu: Component
}) {
  const axes = buildScorecardAxes(baselineGpu, targetGpu)
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          WIN / LOSS SCORECARD  ·  axis-by-axis
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          <span className="font-mono text-emerald-300">
            {baselineGpu.name}
          </span>{' '}
          <span className="text-gray-500">(shipping, CITED)</span>
          <span className="text-gray-600"> vs </span>
          <span className="font-mono text-sky-300">{targetGpu.name}</span>{' '}
          <span className="text-gray-500">(shipping, CLAIMED)</span>
        </div>
        <div className="mt-1 text-[10px] leading-relaxed text-gray-500">
          PARITY tolerance: ~{PARITY_TOLERANCE_PCT}% — vendor-claim vs datasheet
          noise reads as tie, not a winner. UNRESOLVED when either side carries
          a verify-needed flag.
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
                NVIDIA B200
              </th>
              <th className="w-[26%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                AMD MI355X
              </th>
              <th className="w-[26%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                WINNER
              </th>
            </tr>
          </thead>
          <tbody>
            {axes.map((axis) => (
              <ScorecardRow key={axis.id} axis={axis} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ScorecardRow({ axis }: { axis: ScorecardAxis }) {
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
          <ScorecardValueCell value={axis.baselineValue} />
        </td>
        <td className="bg-gray-900/60 px-4 py-3">
          <ScorecardValueCell value={axis.targetValue} />
        </td>
        <td className="bg-gray-900/40 px-4 py-3">
          <ScorecardWinnerCell axis={axis} />
        </td>
      </tr>
      {axis.cautionNote && (
        <tr className="border-t border-gray-800">
          <td colSpan={4} className="bg-gray-900/30 px-4 pb-3">
            <NotesBlock notes={axis.cautionNote} />
          </td>
        </tr>
      )}
    </>
  )
}

function ScorecardValueCell({ value }: { value: ScorecardCellValue }) {
  return (
    <div className="space-y-1">
      {value.provenance && (
        <ProvenancePill provenance={value.provenance} />
      )}
      <div className="text-xs leading-relaxed text-gray-200">
        {value.displayText}
      </div>
    </div>
  )
}

function ScorecardWinnerCell({ axis }: { axis: ScorecardAxis }) {
  const classes = winnerClasses(axis.winnerVariant)
  return (
    <div className="space-y-1">
      {axis.winnerPillProvenance ? (
        <ProvenancePill provenance={axis.winnerPillProvenance} />
      ) : (
        <span
          className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes.pill}`}
        >
          {axis.winnerVariant === 'parity'
            ? 'PARITY'
            : axis.winnerVariant === 'unresolved'
              ? 'UNRESOLVED'
              : '—'}
        </span>
      )}
      <div className={`text-xs font-semibold leading-tight ${classes.label}`}>
        {axis.winnerLabel}
      </div>
      {axis.winnerSublabel && (
        <div className="text-[10px] leading-relaxed text-gray-500">
          {axis.winnerSublabel}
        </div>
      )}
    </div>
  )
}

function winnerClasses(variant: ScorecardWinnerVariant) {
  switch (variant) {
    case 'baseline':
      return {
        pill: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
        label: 'text-emerald-300',
      }
    case 'target':
      return {
        pill: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
        label: 'text-sky-300',
      }
    case 'parity':
      return {
        pill: 'bg-gray-700/30 border-gray-600/50 text-gray-400',
        label: 'text-gray-400',
      }
    case 'unresolved':
      return {
        pill: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        label: 'text-rose-300',
      }
    default:
      return {
        pill: 'bg-gray-800 border-gray-700 text-gray-500',
        label: 'text-gray-500',
      }
  }
}

// ────────────────────────────────────────────────────────────────────────
// Scorecard axis builder — pulls KPI values from baseline + target
// components, computes PARITY-aware winner per axis, attaches caution
// notes when present on either side.
//
// Axes (in render order):
//   1. compute_memory_capacity_per_gpu       (numeric, AMD wins clearly)
//   2. compute_memory_bandwidth_per_gpu      (numeric, parity)
//   3. compute_flops_fp4_per_gpu_dense       (numeric, parity, caveat note)
//   4. compute_flops_fp8_per_gpu_dense       (numeric, UNRESOLVED, caveat note)
//   5. shipping availability                 (synthetic, derived from generation field)
// ────────────────────────────────────────────────────────────────────────

const SCORECARD_KPI_AXES = [
  { id: 'compute_memory_capacity_per_gpu', name: 'Memory capacity (per GPU)' },
  { id: 'compute_memory_bandwidth_per_gpu', name: 'Memory bandwidth (per GPU)' },
  { id: 'compute_flops_fp4_per_gpu_dense', name: 'FP4 compute (per GPU, dense)' },
  { id: 'compute_flops_fp8_per_gpu_dense', name: 'FP8 compute (per GPU, dense)' },
] as const

function buildScorecardAxes(
  baseline: Component,
  target: Component,
): ScorecardAxis[] {
  const numeric = SCORECARD_KPI_AXES.map(({ id, name }) =>
    buildNumericAxis(id, name, baseline, target),
  )
  const shipping = buildShippingAxis(baseline, target)
  return [...numeric, shipping]
}

function buildNumericAxis(
  kpiId: string,
  axisName: string,
  baseline: Component,
  target: Component,
): ScorecardAxis {
  const baselineKpi = baseline.kpi_values?.[kpiId] ?? null
  const targetKpi = target.kpi_values?.[kpiId] ?? null

  const baselineValue = kpiToCellValue(baselineKpi)
  const targetValue = kpiToCellValue(targetKpi)

  const winner = computeNumericWinner(baselineKpi, targetKpi)
  const cautionNote = pickCautionNote(baselineKpi, targetKpi)

  return {
    id: kpiId,
    name: axisName,
    baselineValue,
    targetValue,
    ...winnerLabels(winner, baselineKpi, targetKpi),
    cautionNote,
  }
}

function buildShippingAxis(
  baseline: Component,
  target: Component,
): ScorecardAxis {
  const baselineCurrent = baseline.generation === 'current'
  const targetCurrent = target.generation === 'current'

  const baselineProvenance: Provenance = {
    status: 'cited',
    source: `${baseline.name} generation: ${baseline.generation ?? '(none)'} (shipping today — NVIDIA datasheet-confirmed)`,
    last_verified: '2026-05-25',
  }
  const targetProvenance: Provenance = {
    status: 'claimed',
    claimed_by: target.vendor,
    source: `${target.name} generation: ${target.generation ?? '(none)'} (shipping today — AMD vendor-stated)`,
    last_verified: '2026-05-25',
  }

  let variant: ScorecardWinnerVariant
  let winnerLabel: string
  let winnerSublabel: string
  let winnerPillProvenance: Provenance | null

  if (baselineCurrent && targetCurrent) {
    variant = 'parity'
    winnerLabel = 'BOTH SHIPPING'
    winnerSublabel = 'contemporaries — no shipping advantage either way'
    winnerPillProvenance = null
  } else if (baselineCurrent && !targetCurrent) {
    variant = 'baseline'
    winnerLabel = 'NVIDIA'
    winnerSublabel = 'delivered'
    winnerPillProvenance = baselineProvenance
  } else if (!baselineCurrent && targetCurrent) {
    variant = 'target'
    winnerLabel = 'AMD'
    winnerSublabel = 'delivered'
    winnerPillProvenance = targetProvenance
  } else {
    variant = 'na'
    winnerLabel = '—'
    winnerSublabel = 'neither shipping (both pre-launch)'
    winnerPillProvenance = null
  }

  return {
    id: 'shipping',
    name: 'Shipping availability',
    baselineValue: {
      displayText: baselineCurrent
        ? 'shipping today'
        : `${baseline.generation ?? 'unknown'}-gen`,
      provenance: baselineProvenance,
    },
    targetValue: {
      displayText: targetCurrent
        ? 'shipping today'
        : `${target.generation ?? 'unknown'}-gen`,
      provenance: targetProvenance,
    },
    winnerVariant: variant,
    winnerLabel,
    winnerSublabel,
    winnerPillProvenance,
    cautionNote: null,
  }
}

function kpiToCellValue(v: KpiValue | null): ScorecardCellValue {
  if (!v) {
    return {
      displayText: '(no value seeded)',
      provenance: null,
    }
  }
  return {
    displayText: formatKpiDisplay(v),
    provenance: v.provenance,
  }
}

function formatKpiDisplay(v: KpiValue): string {
  const parts: string[] = []
  if (v.range) {
    const { min, max, unit } = v.range
    parts.push(
      min === max
        ? `${min}${unit ? ' ' + unit : ''}`
        : `${min}–${max}${unit ? ' ' + unit : ''}`,
    )
  }
  if (v.band) parts.push(`[${v.band}]`)
  if (v.text) parts.push(v.text)
  return parts.join(' · ') || '(empty value)'
}

function computeNumericWinner(
  b: KpiValue | null,
  t: KpiValue | null,
): ScorecardWinnerVariant {
  if (!b || !t) return 'na'
  // EITHER side flagged verify-needed → comparison is low-confidence
  if (
    b.provenance.flag === 'verify-needed' ||
    t.provenance.flag === 'verify-needed'
  ) {
    return 'unresolved'
  }
  // Numeric comparison via range.min
  if (b.range && t.range) {
    const bVal = b.range.min
    const tVal = t.range.min
    const max = Math.max(bVal, tVal)
    if (max === 0) return 'parity'
    const pctDiff = (Math.abs(bVal - tVal) / max) * 100
    if (pctDiff <= PARITY_TOLERANCE_PCT) return 'parity'
    return bVal > tVal ? 'baseline' : 'target'
  }
  return 'na'
}

function winnerLabels(
  variant: ScorecardWinnerVariant,
  b: KpiValue | null,
  t: KpiValue | null,
): Pick<
  ScorecardAxis,
  'winnerVariant' | 'winnerLabel' | 'winnerSublabel' | 'winnerPillProvenance'
> {
  const hasCaveat =
    isCautionNote(b?.provenance.notes ?? '') ||
    isCautionNote(t?.provenance.notes ?? '')
  switch (variant) {
    case 'baseline':
      return {
        winnerVariant: 'baseline',
        winnerLabel: hasCaveat ? 'NVIDIA (with caveat)' : 'NVIDIA',
        winnerSublabel: 'datasheet-confirmed',
        winnerPillProvenance: b?.provenance ?? null,
      }
    case 'target':
      return {
        winnerVariant: 'target',
        winnerLabel: hasCaveat ? 'AMD (raw, with caveat)' : 'AMD',
        winnerSublabel: 'vendor-claimed',
        winnerPillProvenance: t?.provenance ?? null,
      }
    case 'parity':
      return {
        winnerVariant: 'parity',
        winnerLabel: 'PARITY',
        winnerSublabel: `within ~${PARITY_TOLERANCE_PCT}% — neither side wins`,
        winnerPillProvenance: null,
      }
    case 'unresolved':
      return {
        winnerVariant: 'unresolved',
        winnerLabel: 'UNRESOLVED',
        winnerSublabel: 'verify-needed on at least one side — neither solid',
        winnerPillProvenance: null,
      }
    default:
      return {
        winnerVariant: 'na',
        winnerLabel: '—',
        winnerSublabel: 'data not seeded',
        winnerPillProvenance: null,
      }
  }
}

function pickCautionNote(
  b: KpiValue | null,
  t: KpiValue | null,
): string | null {
  const candidates = [b?.provenance.notes, t?.provenance.notes].filter(
    (n): n is string => typeof n === 'string',
  )
  for (const note of candidates) {
    if (isCautionNote(note)) return note
  }
  return null
}
