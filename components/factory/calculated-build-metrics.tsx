'use client'

import { useState, useMemo } from 'react'
import type { KpiDefinition, KpiValue, Provenance } from '@/lib/factory/kpi'

// Calculated Build Metrics — the honesty-architecture surface that makes
// the calculated-vs-directional boundary visible.
//
// CATEGORY 1 (CALCULATED — recompute live as GPU-count slider moves):
//   · FP4 dense PFLOPS = count × per-GPU FP4 dense (sparse footnoted)
//   · FP8 dense PFLOPS = count × per-GPU FP8 dense (verify-needed flag propagated)
//   · Aggregate HBM    = count × per-GPU HBM
//   · GPU power        = count × per-GPU TDP
//   · Facility power   = GPU power × PUE band [1.10-1.40] (range)
//   · Physical units   = ceil(count / gpus-per-unit) — RA-dependent label
//   · CapEx range      = count × per-GPU price band [low, high] (range)
//
// CATEGORY 2 (DIRECTIONAL — NOT touched by this component): MFU, TTT,
// TCO/token, Production ROI, Inference p99, Data residency %, Domain
// accuracy. These live in DeliveredKpisPanel + segment.delivered_kpis;
// the slider's count never enters their prop chain. The architectural
// separation IS the immutability guarantee — count doesn't reach them.
//
// THE SLIDER TELL: move it, Cat-1 scales linearly, Cat-2 stays put. The
// boundary between hardware-determined and workload-determined becomes
// visible. That's the feature, not a limitation.
//
// PROVENANCE COMPOSITION: every calculated output inherits worst-case
// input provenance. If FP4 input is CITED (B200-lead segments), the
// CALCULATED badge is "pure" violet. If FP4 input is directional +
// verify-needed (GB200-lead segments), the badge is compound — violet
// CALCULATED with a directional/verify-needed marker. Output is no more
// certain than input.
//
// THE HONESTY FRAMING (above the panel): "Hardware-determined KPIs are
// calculated live from cited specs and prices; workload-determined KPIs
// stay directional because the configuration alone doesn't determine
// them. Knowing which is which is the engineering judgment, not a
// limitation."

interface KpiInput {
  kpi: KpiDefinition
  value: KpiValue
}

export interface CalculatedBuildMetricsProps {
  // Slider config
  sliderMin: number
  sliderMax: number
  sliderDefault: number
  // Physical-unit label per lead RA
  gpusPerUnit: number
  unitLabel: string         // "NVL72 racks" / "HGX 8-GPU nodes" / "RTX PRO units"
  // Lead-RA GPU's per-unit specs (each KPI + its provenance)
  fp4DensePerGpu: KpiInput  // PFLOPS dense
  fp8DensePerGpu: KpiInput  // PFLOPS dense — verify-needed
  hbmPerGpu: KpiInput       // GB
  tdpPerGpu: KpiInput       // W
  pricePerGpu: KpiInput     // USD range
  leadGpuName: string       // e.g. "NVIDIA Blackwell B200"
}

const PUE_BAND_MIN = 1.10  // hyperscaler best (cited via hyperscaler segment delivered_kpis)
const PUE_BAND_MAX = 1.40  // enterprise typical (industry-published band)

export function CalculatedBuildMetrics(props: CalculatedBuildMetricsProps) {
  const [count, setCount] = useState(props.sliderDefault)

  // All Category-1 math derived from count + cited inputs. Memoized so
  // slider drag doesn't thrash GC.
  const computed = useMemo(() => {
    const fp4PerGpu = props.fp4DensePerGpu.value.range?.min ?? 0
    const fp8PerGpu = props.fp8DensePerGpu.value.range?.min ?? 0
    const hbmPerGpu = props.hbmPerGpu.value.range?.min ?? 0
    const tdpPerGpu = props.tdpPerGpu.value.range?.min ?? 0
    const priceLow = props.pricePerGpu.value.range?.min ?? 0
    const priceHigh = props.pricePerGpu.value.range?.max ?? 0

    const fp4DenseTotal = count * fp4PerGpu        // PFLOPS
    const fp4SparseTotal = fp4DenseTotal * 2       // sparse vendor footnote
    const fp8DenseTotal = count * fp8PerGpu        // PFLOPS
    const hbmTotalGB = count * hbmPerGpu           // GB
    const gpuPowerW = count * tdpPerGpu            // watts
    const facilityLowW = gpuPowerW * PUE_BAND_MIN
    const facilityHighW = gpuPowerW * PUE_BAND_MAX
    const unitCount = Math.ceil(count / props.gpusPerUnit)
    const capexLow = count * priceLow              // USD
    const capexHigh = count * priceHigh            // USD

    return {
      fp4DenseTotal,
      fp4SparseTotal,
      fp8DenseTotal,
      hbmTotalGB,
      gpuPowerW,
      facilityLowW,
      facilityHighW,
      unitCount,
      capexLow,
      capexHigh,
    }
  }, [count, props])

  return (
    <section className="overflow-hidden rounded-md border border-violet-500/30 bg-gray-900/30">
      <header className="border-b border-violet-500/30 bg-violet-500/5 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-violet-300">
          CALCULATED BUILD METRICS  ·  hardware-determined, computed live
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          Hardware-determined KPIs are calculated live from cited specs and
          prices; workload-determined KPIs (MFU, ROI, TCO-per-token, etc.)
          stay directional because the configuration alone doesn&apos;t
          determine them. Knowing which is which is the engineering
          judgment, not a limitation.
        </p>
      </header>

      <SliderRow
        count={count}
        min={props.sliderMin}
        max={props.sliderMax}
        leadGpuName={props.leadGpuName}
        onChange={setCount}
      />

      <div className="grid grid-cols-1 gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="FP4 PFLOPS (dense)"
          formula={`${count.toLocaleString()} × ${props.fp4DensePerGpu.value.range?.min ?? 0} PFLOPS`}
          primary={formatPflops(computed.fp4DenseTotal)}
          secondary={`sparse ≈ ${formatPflops(computed.fp4SparseTotal)} (vendor footnote — 2× dense)`}
          inputProvenance={props.fp4DensePerGpu.value.provenance}
          inputSourceLabel={`${props.leadGpuName} · compute_flops_fp4_per_gpu_dense`}
        />
        <MetricCard
          label="FP8 PFLOPS (dense)"
          formula={`${count.toLocaleString()} × ${props.fp8DensePerGpu.value.range?.min ?? 0} PFLOPS`}
          primary={formatPflops(computed.fp8DenseTotal)}
          secondary="verify-needed flag propagated (datasheet column read; dense/sparse attribution unconfirmed)"
          inputProvenance={props.fp8DensePerGpu.value.provenance}
          inputSourceLabel={`${props.leadGpuName} · compute_flops_fp8_per_gpu_dense`}
        />
        <MetricCard
          label="Aggregate HBM"
          formula={`${count.toLocaleString()} × ${props.hbmPerGpu.value.range?.min ?? 0} GB`}
          primary={formatHbm(computed.hbmTotalGB)}
          secondary={null}
          inputProvenance={props.hbmPerGpu.value.provenance}
          inputSourceLabel={`${props.leadGpuName} · compute_memory_capacity_per_gpu`}
        />
        <MetricCard
          label="GPU power"
          formula={`${count.toLocaleString()} × ${props.tdpPerGpu.value.range?.min ?? 0} W TDP`}
          primary={formatPower(computed.gpuPowerW)}
          secondary={null}
          inputProvenance={props.tdpPerGpu.value.provenance}
          inputSourceLabel={`${props.leadGpuName} · compute_tdp_per_gpu`}
        />
        <MetricCard
          label="Facility power (range)"
          formula={`GPU power × PUE band [${PUE_BAND_MIN.toFixed(2)} – ${PUE_BAND_MAX.toFixed(2)}]`}
          primary={`${formatPower(computed.facilityLowW)} – ${formatPower(computed.facilityHighW)}`}
          secondary="PUE band: hyperscaler best 1.10 (cited) → enterprise typical 1.40 (industry-published) — directional factor on GPU power"
          inputProvenance={props.tdpPerGpu.value.provenance}
          inputSourceLabel="GPU power × PUE band"
          forceDirectional
        />
        <MetricCard
          label={`Physical units (${props.unitLabel})`}
          formula={`ceil(${count.toLocaleString()} / ${props.gpusPerUnit}) = ${computed.unitCount.toLocaleString()}`}
          primary={`${computed.unitCount.toLocaleString()} ${props.unitLabel}`}
          secondary={null}
          inputProvenance={CITED_ARCH_PROVENANCE}
          inputSourceLabel="reference architecture density"
        />
        <CapExCard
          countLabel={count.toLocaleString()}
          priceLow={props.pricePerGpu.value.range?.min ?? 0}
          priceHigh={props.pricePerGpu.value.range?.max ?? 0}
          capexLow={computed.capexLow}
          capexHigh={computed.capexHigh}
          inputProvenance={props.pricePerGpu.value.provenance}
          leadGpuName={props.leadGpuName}
        />
      </div>

      <SourceAttribution />
    </section>
  )
}

// ─── Slider row ────────────────────────────────────────────────────────
function SliderRow({
  count,
  min,
  max,
  leadGpuName,
  onChange,
}: {
  count: number
  min: number
  max: number
  leadGpuName: string
  onChange: (n: number) => void
}) {
  return (
    <div className="border-b border-violet-500/30 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            GPU count  ·  scaling the {leadGpuName}-lead reference
          </div>
          <div className="mt-1 text-2xl font-semibold text-violet-200">
            {count.toLocaleString()}{' '}
            <span className="text-[12px] font-normal text-gray-500">GPUs</span>
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
          range: {min.toLocaleString()} – {max.toLocaleString()}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={sliderStep(min, max)}
        value={count}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-violet-400"
        aria-label="GPU count"
      />
      <div className="mt-1 flex justify-between text-[9px] font-mono text-gray-600">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  )
}

function sliderStep(min: number, max: number): number {
  const range = max - min
  if (range >= 100000) return 1000
  if (range >= 10000) return 100
  if (range >= 1000) return 10
  return 1
}

// ─── One calculated metric card ───────────────────────────────────────
function MetricCard({
  label,
  formula,
  primary,
  secondary,
  inputProvenance,
  inputSourceLabel,
  forceDirectional = false,
}: {
  label: string
  formula: string
  primary: string
  secondary: string | null
  inputProvenance: Provenance
  inputSourceLabel: string
  forceDirectional?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 rounded border border-gray-800/60 bg-gray-950/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </div>
        <CalculatedBadge
          inputProvenance={inputProvenance}
          forceDirectional={forceDirectional}
        />
      </div>
      <div className="text-xl font-semibold text-violet-100">{primary}</div>
      {secondary && (
        <div className="text-[10px] leading-relaxed text-gray-500">{secondary}</div>
      )}
      <div className="mt-auto border-t border-gray-800/60 pt-2 text-[9px] font-mono leading-relaxed text-gray-600">
        <div>{formula}</div>
        <div className="mt-0.5 text-gray-700">input: {inputSourceLabel}</div>
      </div>
    </div>
  )
}

// ─── CapEx card — gets EXTRA-PROMINENT compute-only label ─────────────
// The user flagged this specifically: at hyperscaler default (50,000 GPUs →
// ~$2.1B), a bare "$2.1B" could misread as total build cost. The label
// must be prominent at all scales so the compute-only scope reads loud.
function CapExCard({
  countLabel,
  priceLow,
  priceHigh,
  capexLow,
  capexHigh,
  inputProvenance,
  leadGpuName,
}: {
  countLabel: string
  priceLow: number
  priceHigh: number
  capexLow: number
  capexHigh: number
  inputProvenance: Provenance
  leadGpuName: string
}) {
  const atScale = capexHigh >= 500_000_000  // $500M+ — bump prominence
  return (
    <div
      className={`flex flex-col gap-2 rounded border bg-gray-950/30 p-3 md:col-span-2 ${
        atScale ? 'border-amber-500/40' : 'border-gray-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400">
          Compute-hardware CapEx (range)
        </div>
        <CalculatedBadge inputProvenance={inputProvenance} forceDirectional />
      </div>
      <div className="text-xl font-semibold text-violet-100">
        {formatUsd(capexLow)} – {formatUsd(capexHigh)}
      </div>
      <div
        className={`rounded border px-2 py-1.5 text-[10px] font-mono uppercase leading-tight tracking-widest ${
          atScale
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
            : 'border-gray-700 bg-gray-900/50 text-gray-400'
        }`}
      >
        {atScale && '⚠ '}
        COMPUTE-HARDWARE ONLY — excludes network · storage · facility · install
        {atScale && ' · NOT total build cost'}
      </div>
      <div className="text-[10px] leading-relaxed text-gray-500">
        Per-GPU price is a directional band (varies by volume, config, region,
        partner deal). Range × range produces the displayed range.
      </div>
      <div className="mt-auto border-t border-gray-800/60 pt-2 text-[9px] font-mono leading-relaxed text-gray-600">
        <div>
          {countLabel} × ${priceLow.toLocaleString()} → ${priceHigh.toLocaleString()}/GPU
        </div>
        <div className="mt-0.5 text-gray-700">
          input: {leadGpuName} · compute_per_gpu_price_band
        </div>
      </div>
    </div>
  )
}

// ─── CALCULATED badge with input-provenance composition ───────────────
// Pure violet when input is CITED. Compound (violet + amber) when input
// is DIRECTIONAL. Compound (violet + rose) when input is verify-needed.
// The output is no more certain than its input — the badge composition
// makes that legible.
function CalculatedBadge({
  inputProvenance,
  forceDirectional = false,
}: {
  inputProvenance: Provenance
  forceDirectional?: boolean
}) {
  const isVerifyNeeded = inputProvenance.flag === 'verify-needed'
  const isDirectional =
    forceDirectional || inputProvenance.status === 'directional'

  if (isVerifyNeeded) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Pill text="CALCULATED" tone="violet" />
        <Pill text="VERIFY-NEEDED INPUT" tone="rose" small />
      </div>
    )
  }
  if (isDirectional) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Pill text="CALCULATED" tone="violet" />
        <Pill text="DIRECTIONAL INPUT" tone="amber" small />
      </div>
    )
  }
  return <Pill text="CALCULATED" tone="violet" />
}

function Pill({
  text,
  tone,
  small = false,
}: {
  text: string
  tone: 'violet' | 'amber' | 'rose'
  small?: boolean
}) {
  const classes =
    tone === 'violet'
      ? 'bg-violet-500/10 border-violet-500/40 text-violet-200'
      : tone === 'amber'
        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
        : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
  const size = small ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`whitespace-nowrap rounded border font-mono font-semibold tracking-widest ${size} ${classes}`}
    >
      {text}
    </span>
  )
}

// ─── Source attribution row ───────────────────────────────────────────
function SourceAttribution() {
  return (
    <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-3 text-[10px] leading-relaxed text-gray-500">
      <span className="font-mono uppercase tracking-widest text-gray-600">
        sources:
      </span>{' '}
      Blackwell B200 / GB200 datasheets (FP4 dense, HBM3e, TDP) ·{' '}
      HSBC analyst pricing (GB200 NVL72 ~$3M/72-GPU rack) ·{' '}
      gpu.fm March 2026 (standalone B200 $45-55K) ·{' '}
      Tom&apos;s Hardware corroboration ·{' '}
      PUE band: hyperscaler-best 1.10 (cited via hyperscaler segment KPIs) →{' '}
      enterprise-typical 1.40 (industry-published).
    </div>
  )
}

// ─── Synthetic "cited" provenance for architecture-density derivation ─
// Used by the Physical Units card — ceil(count / gpus-per-unit) is firm
// arithmetic on architectural definitions (NVL72 = 72, HGX = 8); the
// provenance is the architecture spec itself.
const CITED_ARCH_PROVENANCE: Provenance = {
  status: 'cited',
  source:
    'Reference architecture density — NVL72 = 72 GPUs/rack; HGX = 8 GPUs/baseboard; RTX PRO = 1 GPU/unit.',
  last_verified: '2026-05-26',
}

// ─── Unit-aware formatters ────────────────────────────────────────────
function formatPflops(p: number): string {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)} ZFLOPS`
  if (p >= 1000) return `${(p / 1000).toFixed(2)} EFLOPS`
  return `${p.toLocaleString()} PFLOPS`
}

function formatHbm(gb: number): string {
  if (gb >= 1_048_576) return `${(gb / 1_048_576).toFixed(2)} PB`
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  return `${gb.toLocaleString()} GB`
}

function formatPower(w: number): string {
  if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`
  if (w >= 1000) return `${(w / 1000).toFixed(2)} kW`
  return `${w.toLocaleString()} W`
}

function formatUsd(d: number): string {
  if (d >= 1_000_000_000) return `$${(d / 1_000_000_000).toFixed(2)}B`
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}K`
  return `$${d.toLocaleString()}`
}
