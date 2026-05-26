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
  // Software-layer components for the layer-fight-map. The engine's
  // applySwap below is single-slot GPU; the LayerFightMap composes per-layer
  // qualitative verdicts (L1-L5) from both component pairs — the bird's-eye
  // synthesis that complements the L2-only quantitative scorecard below.
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
      <LayerFightMap
        competitorName="AMD"
        competitorColor="sky"
        verdicts={layerVerdicts}
        narrative={AMD_NARRATIVE}
      />
      <WinLossScorecard baselineGpu={baselineGpu} targetGpu={targetGpu} />
      <BlastRadiusStrip
        highlightedLayers={['L2']}
        slotLabel="GPU (compute sub-slot)"
        changedCount={report.changed.length}
        heldCount={report.held.length}
        framingText="GPU-slot swap. The dependency-graph engine counts here reflect the L2 (GPU) swap only — see Layer Fight Map above for the L4/L5 verdicts that do not run through this single-slot swap, and for the SHARED L1/L3 layers (same regardless of GPU vendor)."
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
// Layer Fight Map composition — per-layer verdicts for AMD vs NVIDIA.
// Order: L5 (top) → L1 (bottom) to match cake order.
//
// AMD's per-layer mapping (the corrected taxonomy):
//   L5 Ecosystem            CONTESTED · NVIDIA · DECISIVE
//   L4 Software (frameworks) CONTESTED · TIE · CLOSE + nuance:'workload-dependent'
//   L3 ISV / orchestration  SHARED   (same regardless of GPU vendor)
//   L2 GPU (compute)         CONTESTED · TIE · CLOSE
//   L1 Facility              SHARED   (same regardless of GPU vendor)
//
// SHARED reasoning: L1 (datacenter) and L3 (Red Hat / VMware / Nutanix /
// VAST orchestration) are present-and-identical in either stack. Switching
// to AMD doesn't remove the datacenter or the ISV — those layers stay,
// unchanged, regardless of GPU vendor. SHARED ≠ N/A: N/A would mean the
// competitor doesn't play there at all (the Broadcom-fabric case at L4/L5,
// later). Conflating SHARED with N/A would falsely imply AMD "doesn't
// compete" at L1/L3 when in fact the layer is present and indifferent.
//
// L4 nuance: tie is correct (ROCm mainstream-inference ~90-95% viable),
// but the tie is workload-dependent — memory-bound favors MI300X,
// compute-bound favors H100. The 'workload-dependent' badge surfaces this
// at-a-glance without fragmenting the state taxonomy.
//
// Pointers cite seeded KPI data (TensorRT-LLM gap, FA3 30-40% throughput
// cost, etc.) — no values invented in this composition layer.
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
      layerName: 'Ecosystem (libs · platform depth · switching cost)',
      state: { kind: 'contested', winner: 'nvidia', strength: 'decisive' },
      shortLabel: 'NVIDIA — DECISIVE',
      evidence:
        'CUDA-exclusive libraries (TensorRT-LLM, FlashAttention 3, NCCL), ~20-year ecosystem depth, the CUDA-first default for new ML research. ROCm cannot close this without a multi-year compounding effort.',
      pointers: [
        'TensorRT-LLM — CUDA-only, no ROCm port planned',
        'FlashAttention 3 — CUDA-only as of 2026; missing FA3 costs ~30-40% training throughput on 7B+ models per Spheron May 2026',
        'NCCL collective communication — no ROCm equivalent',
        '~20 years of compounding CUDA ecosystem (cuDNN, cuBLAS, TensorRT, Triton, NeMo, NIM); CUDA-first default for new ML tooling',
        'Switching cost: high for CUDA-native codebases; lower for stacks already abstracted (PyTorch / vLLM / SGLang)',
      ],
      sourceRef: `See ${baselineSoftware.id}.kpi_values + ${targetSoftware.id}.kpi_values for per-KPI evidence + provenance pills.`,
    },
    {
      layerId: 'L4',
      layerName: 'Software (frameworks · mainstream inference)',
      state: {
        kind: 'contested',
        winner: 'tie',
        strength: 'close',
        nuance: 'workload-dependent',
      },
      shortLabel: 'TIE — CLOSE',
      evidence:
        'ROCm reaches ~90-95% of CUDA on mainstream PyTorch / vLLM / SGLang inference — viable. The tie is workload-dependent: memory-bound workloads favor MI300X (~40% lower latency on Llama-2-70B per Clarifai / Tensorwave 2026), compute-bound workloads favor H100 (vLLM ROCm 37-75% higher latency on some configurations per aimultiple 2026).',
      pointers: [
        'Frameworks officially supported on ROCm: PyTorch, vLLM, SGLang, FlashInfer, llama.cpp',
        'Memory-bound workloads (large-model inference, KV-cache-heavy) favor MI300X',
        'Compute-bound workloads (training, prefill, dense matmul) favor H100',
        '~90-95% mainstream-throughput claim is the optimistic end of a workload-dependent range — flagged VERIFY-NEEDED in seeded data',
      ],
      sourceRef: `See ${targetSoftware.id}.software_mainstream_inference + provenance notes (NVIDIA baseline: ${baselineSoftware.id}).`,
    },
    {
      layerId: 'L3',
      layerName: 'ISV / orchestration',
      state: { kind: 'shared' },
      shortLabel: 'Same regardless of GPU vendor',
      evidence:
        'Both stacks include the same ISV / orchestration layer — Red Hat OpenShift AI, VMware Private AI Foundation, Nutanix Enterprise AI, VAST Data — present in either deployment and identical to operate. Switching the GPU does not change L3.',
      pointers: [
        'Red Hat OpenShift AI: vendor-agnostic — runs on both NVIDIA and AMD',
        'VMware Private AI Foundation: vendor-agnostic',
        'Nutanix Enterprise AI: vendor-agnostic',
        'VAST Data (storage): vendor-agnostic',
      ],
    },
    {
      layerId: 'L2',
      layerName: 'GPU (compute silicon)',
      state: { kind: 'contested', winner: 'tie', strength: 'close' },
      shortLabel: 'TIE — CLOSE',
      evidence: `${baselineGpu.name} vs ${targetGpu.name} near-parity at current generation. AMD wins memory capacity decisively (288 vs 192 GB, +50%); memory bandwidth + FP4 dense within ~5% (PARITY); FP8 dense UNRESOLVED (both sides carry verify-needed); shipping availability parity.`,
      sourceRef: 'See Win/Loss Scorecard below for the full per-axis breakdown.',
    },
    {
      layerId: 'L1',
      layerName: 'Facility (land · power · shell)',
      state: { kind: 'shared' },
      shortLabel: 'Same regardless of GPU vendor',
      evidence:
        'Both stacks deploy in the same DC / colo / hyperscale facility patterns — same Dell PowerEdge XE9680 chassis (HGX-class, available in NVIDIA and AMD configurations), same air-cooled ceiling ~10-15 kW/rack for enterprise, same liquid-cooling envelopes for rack-scale. L1 is present-and-identical in either stack.',
      pointers: [
        'Dell PowerEdge XE9680: HGX-class chassis available for both vendors',
        'Same DC / colo / hyperscale facility patterns',
        'Same power + cooling envelopes',
      ],
    },
  ]
}

// Pattern roll-up — names the shape of the fight. No numeric score
// (would require defensible layer-weighting + would miscount SHARED layers
// + would flatten the at-a-glance pattern the colored cake already shows).
const AMD_NARRATIVE =
  'AMD contests 3 of 5 layers. L1 (facility) and L3 (ISV / orchestration) are SHARED — present in both stacks identically, so not differentiators regardless of GPU vendor. Of the 3 contested layers: silicon (L2) is a close tie (B200 vs MI355X near-parity); software (L4) is a workload-dependent tie (memory-bound favors AMD, compute-bound favors NVIDIA); and ecosystem (L5) is a decisive NVIDIA advantage — CUDA-exclusive libraries, 20-year depth, the CUDA-first default. Net: competitive on the commodity layers, structural moat at L5. The fight isn’t the chip — it’s the ecosystem above it.'

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
