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
import {
  LayerFightMap,
  type LayerVerdict,
} from './layer-fight-map'

interface Props {
  baselineGpu: Component
  targetGpu: Component
  // Software-layer components for the layer-fight-map (added in phase 3c-2
  // step 2 part 2). The engine's applySwap below is still single-slot GPU,
  // so the BlastRadiusStrip counts reflect GPU-dependencies only. The
  // LayerFightMap composes per-layer verdicts qualitatively from baseline +
  // target component data (across L1-L5) — that's the bird's-eye summary
  // that complements the L2-only quantitative scorecard.
  baselineSoftware: Component
  targetSoftware: Component
  report: SwapReport
}

export function AmdReplacementView({
  baselineGpu,
  targetGpu,
  baselineSoftware,
  targetSoftware,
  report,
}: Props) {
  const heldWithValues = report.held.filter((h) => h.before || h.after)
  const layerVerdicts = buildLayerVerdicts(
    baselineGpu,
    targetGpu,
    baselineSoftware,
    targetSoftware,
  )
  return (
    <div className="space-y-6">
      <DiagonalFramingLine />
      <LayerFightMap verdicts={layerVerdicts} />
      <WinLossScorecard baselineGpu={baselineGpu} targetGpu={targetGpu} />
      <BlastRadiusStrip
        highlightedLayers={['L2']}
        slotLabel="GPU (compute sub-slot)"
        changedCount={report.changed.length}
        heldCount={report.held.length}
        framingText="GPU-slot swap. The dependency-graph engine counts here reflect the L2 (GPU) swap only — see Layer Fight Map above for the L4/L5 verdicts that do not run through this single-slot swap. Roadmap pair (Vera Rubin vs MI455X) is the next fast-follow — same shape, future generation."
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
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Layer Fight Map composition — builds per-layer verdicts from baseline +
// target component data. Order: L5 (top) → L1 (bottom) to match cake order.
//
// Verdicts are composed in-component (not data-driven) because they're
// narrative summaries pulling from multiple seeded KPI values across two
// components. Each verdict's `pointers` cite specific seeded data so the
// reader can trace back. Per the honesty discipline: pointers reference
// seeded values; nothing is invented here that isn't in the data.
//
// L4 carries the workload-dependence nuance per user direction: NIM/Nemotron/
// Dynamo are NVIDIA-proprietary (no AMD equivalent — NVIDIA wins), AND
// software_mainstream_inference is workload-split (memory-bound MI300X wins,
// compute-bound H100 leads). So L4 reads "NVIDIA WINS — workload-dependent"
// rather than a clean NVIDIA WINS or a clean tie.
// ────────────────────────────────────────────────────────────────────────
function buildLayerVerdicts(
  baselineGpu: Component,
  targetGpu: Component,
  baselineSoftware: Component,
  targetSoftware: Component,
): LayerVerdict[] {
  return [
    {
      layerId: 'L5',
      layerName: 'Applications · NVAIE wrapper',
      verdict: 'nvidia-wins',
      verdictLabel: 'NVIDIA WINS — software ecosystem moat',
      evidence:
        "NVAIE wraps the CUDA-rooted software stack with a library moat ROCm has not closed. The gap is precise and named, not handwaved.",
      pointers: [
        `TensorRT-LLM (CUDA-only, no ROCm port planned) — confirmed across multiple 2026 analyses`,
        `FlashAttention 3 (CUDA-only as of 2026; ROCm has FA2 via Triton, not FA3) — missing FA3 costs ~30-40% training throughput on 7B+ models per Spheron May 2026`,
        `NCCL collective communication — no ROCm equivalent`,
        `~20 years of compounding CUDA ecosystem (cuDNN, cuBLAS, TensorRT, Triton inference server, NeMo, NIM); CUDA-first default for new research and ML tooling`,
        `Switching cost: high for CUDA-native codebases with exclusive-lib dependencies; lower for stacks already abstracted (PyTorch / vLLM / SGLang)`,
      ],
      sourceRef: `See ${baselineSoftware.id}.kpi_values + ${targetSoftware.id}.kpi_values for full per-KPI evidence + provenance pills.`,
    },
    {
      layerId: 'L4',
      layerName: 'Models / Microservices',
      verdict: 'workload-dependent',
      verdictLabel:
        'NVIDIA WINS — workload-dependent (no clean tie; depends what you’re running)',
      evidence:
        'NIM / Nemotron / Dynamo / NeMo Guardrails are NVIDIA-proprietary microservices with no AMD equivalent — that’s a clean NVIDIA win for the L4 platform layer. But underneath, mainstream PyTorch / vLLM / SGLang inference performance is workload-dependent: memory-bound workloads favor MI300X, compute-bound workloads favor H100. The L4 verdict reads as NVIDIA WINS for the proprietary microservices, with the explicit workload-split caveat for the runtime layer beneath.',
      pointers: [
        'NVIDIA-proprietary L4 layer: NIM (microservices), Nemotron (foundation models), Dynamo (orchestration), NeMo Guardrails — no AMD equivalent shipping today',
        'Mainstream inference performance: memory-bound MI300X often beats H100 (~40% lower latency on Llama-2-70B per Clarifai / Tensorwave 2026), compute-bound H100 leads (vLLM ROCm 37-75% higher latency than H200 in some configurations per aimultiple 2026)',
        'The "~90-95% of H100 throughput" framing is the optimistic end of a workload-dependent range, not cleanly citable as a single number — flagged VERIFY-NEEDED in seeded data',
      ],
      sourceRef: `See ${targetSoftware.id}.software_mainstream_inference + sources cited in its provenance notes (paired with ${baselineSoftware.id} as the NVIDIA baseline).`,
    },
    {
      layerId: 'L3',
      layerName: 'ISV Platform',
      verdict: 'shared',
      verdictLabel: 'SHARED — both vendors compose with same ISVs',
      evidence:
        'The L3 ISV platform layer (Red Hat OpenShift AI, VMware Private AI Foundation, Nutanix Enterprise AI, VAST Data) is composable across both vendor ecosystems. Neither vendor has an ISV lock-in moat at this layer — it’s structurally non-differentiating for the AMD vs NVIDIA comparison.',
      pointers: [
        'Red Hat OpenShift AI: runs on both NVIDIA and AMD platforms',
        'VMware Private AI Foundation: vendor-agnostic',
        'Nutanix Enterprise AI: vendor-agnostic',
        'VAST Data: storage layer, vendor-agnostic',
      ],
    },
    {
      layerId: 'L2',
      layerName: 'Chips · GPU + Fabric',
      verdict: 'parity-dominant',
      verdictLabel: 'PARITY-DOMINANT — with AMD memory win + FP8 unresolved',
      evidence:
        'Hardware close at current generation. AMD wins memory capacity decisively (288 vs 192 GB, +50%); memory bandwidth + FP4 dense are within ~5% (PARITY); FP8 dense is UNRESOLVED (both sides carry verify-needed). Shipping availability is parity (both ship today).',
      pointers: [
        `${targetGpu.name} memory capacity: 288 GB HBM3e (CLAIMED) vs ${baselineGpu.name} 192 GB HBM3e (CITED) — AMD wins (+50%)`,
        'Memory bandwidth: 8 vs 8 TB/s — PARITY',
        'FP4 dense: ~9.2 vs 9 PFLOPS — PARITY (within ~5%, AMD dense/sparse caveat applies)',
        'FP8 dense: B200 verify-needed, MI355X CLAIMED + verify-needed — UNRESOLVED (figure-spread across sources)',
        'Shipping availability: both current — PARITY',
      ],
      sourceRef: 'See Win/Loss Scorecard below for the full per-axis breakdown.',
    },
    {
      layerId: 'L1',
      layerName: 'Land · Power · Shell',
      verdict: 'shared',
      verdictLabel: 'SHARED — same facility infrastructure',
      evidence:
        'Both vendors deploy in the same enterprise DC / colo / hyperscale facility patterns. Dell PowerEdge XE9680 (HGX-class chassis) is common to both; same liquid-cooling envelopes for rack-scale, same air-cooled ceilings for enterprise (~10-15 kW/rack). L1 is structurally non-differentiating for the vendor comparison.',
      pointers: [
        'Dell PowerEdge XE9680 chassis: HGX-class server, both NVIDIA and AMD configurations available',
        'Enterprise DC / colo / hyperscale facility patterns: vendor-agnostic',
        'Air-cooling ceiling ~10-15 kW/rack + liquid-cooling envelope for rack-scale: same physics either vendor',
      ],
    },
  ]
}

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
