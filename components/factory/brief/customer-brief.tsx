'use client'

import type { KpiValue, Provenance } from '@/lib/factory/kpi'
import { ProvenancePill } from '../provenance-pill'
import {
  BriefHeader,
  BriefSection,
  BriefFooter,
} from './brief-overlay'
import type { SegmentView } from '../segment-switcher'

// Customer Brief — snapshot of /factory/architect.
//
// CAPTURES current state:
//   · selected segment (1 of 6)
//   · current GPU count from the slider
//   · resolved metrics + KPIs (engine output, no new computation)
//
// HONESTY DISCIPLINE:
//   · ProvenancePill carries through — DIRECTIONAL/VERIFY-NEEDED/CITED pills
//     render identically to the view
//   · Calculated metrics labeled CALCULATED with compound provenance when
//     inputs are directional/verify-needed (matches the view's calculator)
//   · Compute-only CapEx label preserved (with amber-emphasized "NOT total
//     build cost" callout at $500M+ scale, matching the view)
//   · TCO bars rendered as honest band labels (HIGH / MEDIUM / LOW), never
//     summed
//   · Footer reminds reader this is a snapshot of /factory/architect

interface Props {
  view: SegmentView
  currentGpuCount: number
}

const PUE_BAND_MIN = 1.10
const PUE_BAND_MAX = 1.40

export function CustomerBrief({ view, currentGpuCount }: Props) {
  const computed = computeMetrics(view, currentGpuCount)
  const capexAtScale = computed.capexHigh >= 500_000_000

  return (
    <>
      <BriefHeader
        title={`Customer Brief · ${view.segment.name}`}
        subtitle={`${view.raBlendDisplay} reference · ${view.blendNote}`}
        sourceLabel="snapshot of /factory/architect"
      />

      {/* Segment context — pulls from existing seeded grounding */}
      <BriefSection label="SEGMENT CONTEXT">
        {view.segment.archetype && (
          <p>
            <span className="font-mono text-gray-500">ARCHETYPE: </span>
            <span>{view.segment.archetype}</span>
          </p>
        )}
        {view.segment.buying_behavior && (
          <p className="mt-1">
            <span className="font-mono text-gray-500">OPTIMIZES FOR: </span>
            <span>{view.segment.buying_behavior}</span>
          </p>
        )}
        {view.segment.representative_deployment && (
          <p className="mt-1">
            <span className="font-mono text-gray-500">REPRESENTATIVE BUILD: </span>
            <span>{view.segment.representative_deployment}</span>
          </p>
        )}
        {view.segment.customer_competitor_note && (
          <p className="mt-1 text-amber-200/90 print:text-amber-800">
            <span className="font-mono text-amber-300 print:text-amber-700">
              ALSO COMPETITOR:{' '}
            </span>
            <span>{view.segment.customer_competitor_note}</span>
          </p>
        )}
        {view.segment.customer_channel_note && (
          <p className="mt-1 text-amber-200/90 print:text-amber-800">
            <span className="font-mono text-amber-300 print:text-amber-700">
              ALSO CHANNEL:{' '}
            </span>
            <span>{view.segment.customer_channel_note}</span>
          </p>
        )}
      </BriefSection>

      {/* The build — 5-layer slot composition */}
      <BriefSection label="THE BUILD · slot composition">
        <table className="w-full table-fixed text-[11px]">
          <tbody>
            <BuildRow
              layer="L5 · Ecosystem"
              component="NVIDIA AI Enterprise (NVAIE)"
            />
            <BuildRow
              layer="L4 · Software"
              component="NIM / Nemotron / Dynamo / NeMo Guardrails (NVAIE-wrapped)"
            />
            <BuildRow
              layer="L3 · ISV"
              component={view.chosenIsvs.map((i) => i.name).join(' + ')}
            />
            <BuildRow
              layer="L2 · GPU + Fabric"
              component={`${view.l2Tiles.map((t) => `${t.gpu.name} (${t.ra.id})`).join(' + ')} · ${view.chosenFabric.name}`}
            />
            <BuildRow
              layer="L1 · Facility"
              component={view.oem.name}
            />
          </tbody>
        </table>
      </BriefSection>

      {/* Calculated metrics at CURRENT slider scale */}
      <BriefSection
        label={`AT THIS SCALE · ${currentGpuCount.toLocaleString()} GPUs (live calculator state)`}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetricCard
            label="FP4 PFLOPS (dense)"
            value={formatPflops(computed.fp4DenseTotal)}
            sub={`sparse ≈ ${formatPflops(computed.fp4SparseTotal)} (vendor footnote · 2× dense)`}
            inputProvenance={view.calc.fp4DensePerGpu.value.provenance}
          />
          <MetricCard
            label="FP8 PFLOPS (dense)"
            value={formatPflops(computed.fp8DenseTotal)}
            sub="verify-needed flag propagated"
            inputProvenance={view.calc.fp8DensePerGpu.value.provenance}
          />
          <MetricCard
            label="Aggregate HBM"
            value={formatHbm(computed.hbmTotalGB)}
            sub={null}
            inputProvenance={view.calc.hbmPerGpu.value.provenance}
          />
          <MetricCard
            label="GPU power"
            value={formatPower(computed.gpuPowerW)}
            sub={null}
            inputProvenance={view.calc.tdpPerGpu.value.provenance}
          />
          <MetricCard
            label="Facility power (range)"
            value={`${formatPower(computed.facilityLowW)} – ${formatPower(computed.facilityHighW)}`}
            sub={`GPU power × PUE band [${PUE_BAND_MIN.toFixed(2)}–${PUE_BAND_MAX.toFixed(2)}]`}
            inputProvenance={view.calc.tdpPerGpu.value.provenance}
            forceDirectional
          />
          <MetricCard
            label={`Physical units (${view.calc.unitLabel})`}
            value={`${computed.unitCount.toLocaleString()} ${view.calc.unitLabel}`}
            sub={`ceil(${currentGpuCount.toLocaleString()} / ${view.calc.gpusPerUnit})`}
            inputProvenance={CITED_ARCH_PROVENANCE}
          />
        </div>

        {/* CapEx — full-width, with mandatory compute-only label */}
        <div
          className={`mt-3 rounded border p-3 ${
            capexAtScale
              ? 'border-amber-500/50 bg-amber-500/8 print:border-amber-700 print:bg-amber-50'
              : 'border-gray-700 bg-gray-900/40 print:border-gray-400 print:bg-gray-50'
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400 print:text-gray-700">
              Compute-hardware CapEx (range)
            </div>
            <CalculatedBadge
              inputProvenance={view.calc.pricePerGpu.value.provenance}
              forceDirectional
            />
          </div>
          <div className="mt-1 text-lg font-semibold text-violet-100 print:text-violet-900">
            {formatUsd(computed.capexLow)} – {formatUsd(computed.capexHigh)}
          </div>
          <div
            className={`mt-2 rounded border px-2 py-1.5 text-[10px] font-mono uppercase leading-tight tracking-widest ${
              capexAtScale
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-200 print:border-amber-700 print:bg-amber-100 print:text-amber-800'
                : 'border-gray-700 bg-gray-900/50 text-gray-400 print:border-gray-400 print:bg-white print:text-gray-700'
            }`}
          >
            {capexAtScale && '⚠ '}
            COMPUTE-HARDWARE ONLY — excludes network · storage · facility · install
            {capexAtScale && ' · NOT total build cost'}
          </div>
        </div>
      </BriefSection>

      {/* Workload-determined KPIs — frozen, directional, the immutable cat-2 */}
      <BriefSection label="WORKLOAD-DETERMINED KPIs · directional, independent of scale">
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
            ★ NORTH-STAR
          </div>
          {view.northStar.map((r) => (
            <KpiRow key={r.kpi.id} name={r.kpi.name} value={r.value} />
          ))}
          {view.supporting.length > 0 && (
            <>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                SUPPORTING
              </div>
              {view.supporting.map((r) => (
                <KpiRow key={r.kpi.id} name={r.kpi.name} value={r.value} />
              ))}
            </>
          )}
        </div>
      </BriefSection>

      {/* TCO bands — never summed, directional, factor lists */}
      <BriefSection label="TCO · directional bands, never summed">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TcoBand label="CapEx" value={view.tcoCapex.value} />
          <TcoBand label="OpEx" value={view.tcoOpex.value} />
        </div>
      </BriefSection>

      <BriefFooter
        note="Hardware-determined metrics calculated live from cited specs at the current slider value; workload-determined KPIs stay directional because the configuration alone doesn't determine them. Provenance pills carry through from the live view — never represent a directional / verify-needed value as a fact. Snapshot of /factory/architect."
      />
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function BuildRow({ layer, component }: { layer: string; component: string }) {
  return (
    <tr className="border-t border-gray-800 first:border-t-0 print:border-gray-300">
      <td className="py-1.5 pr-3 align-top font-mono text-[10px] uppercase tracking-widest text-gray-500 print:text-gray-700">
        {layer}
      </td>
      <td className="py-1.5 align-top text-gray-200 print:text-black">
        {component}
      </td>
    </tr>
  )
}

function MetricCard({
  label,
  value,
  sub,
  inputProvenance,
  forceDirectional = false,
}: {
  label: string
  value: string
  sub: string | null
  inputProvenance: Provenance
  forceDirectional?: boolean
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/40 p-2 print:border-gray-300 print:bg-white">
      <div className="flex items-start justify-between gap-1.5">
        <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-gray-500 print:text-gray-700">
          {label}
        </div>
        <CalculatedBadge
          inputProvenance={inputProvenance}
          forceDirectional={forceDirectional}
        />
      </div>
      <div className="mt-1 text-sm font-semibold text-violet-100 print:text-violet-900">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[9px] leading-relaxed text-gray-500 print:text-gray-600">
          {sub}
        </div>
      )}
    </div>
  )
}

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
        <Pill text="CALC" tone="violet" />
        <Pill text="VERIFY-NEEDED" tone="rose" small />
      </div>
    )
  }
  if (isDirectional) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Pill text="CALC" tone="violet" />
        <Pill text="DIR" tone="amber" small />
      </div>
    )
  }
  return <Pill text="CALC" tone="violet" />
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
      ? 'bg-violet-500/10 border-violet-500/40 text-violet-200 print:bg-violet-50 print:border-violet-500 print:text-violet-900'
      : tone === 'amber'
        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 print:bg-amber-50 print:border-amber-700 print:text-amber-800'
        : 'bg-rose-500/10 border-rose-500/40 text-rose-200 print:bg-rose-50 print:border-rose-700 print:text-rose-800'
  const size = small ? 'text-[7px] px-1 py-0' : 'text-[8px] px-1.5 py-0.5'
  return (
    <span
      className={`whitespace-nowrap rounded border font-mono font-semibold tracking-widest ${size} ${classes}`}
    >
      {text}
    </span>
  )
}

function KpiRow({
  name,
  value,
}: {
  name: string
  value: KpiValue | null
}) {
  if (!value) {
    return (
      <div className="flex items-baseline justify-between gap-2 border-b border-gray-800/40 pb-1 print:border-gray-300">
        <span className="text-[11px] text-gray-400 print:text-gray-700">
          {name}
        </span>
        <span className="text-[10px] italic text-gray-600 print:text-gray-500">
          (no value seeded)
        </span>
      </div>
    )
  }
  return (
    <div className="border-b border-gray-800/40 pb-1.5 print:border-gray-300">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold text-gray-200 print:text-black">
          {name}
        </span>
        <ProvenancePill provenance={value.provenance} />
      </div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-gray-300 print:text-gray-800">
        {formatKpiValue(value)}
      </div>
    </div>
  )
}

function TcoBand({
  label,
  value,
}: {
  label: string
  value: KpiValue | null
}) {
  if (!value) return null
  return (
    <div className="rounded border border-gray-800 bg-gray-950/40 p-3 print:border-gray-300 print:bg-white">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400 print:text-gray-700">
          {label} band
        </div>
        <ProvenancePill provenance={value.provenance} />
      </div>
      {value.band && (
        <div className="mt-1 text-sm font-semibold text-gray-100 print:text-black">
          [{value.band.toUpperCase()}]
        </div>
      )}
      {value.text && (
        <div className="mt-1 text-[10px] leading-relaxed text-gray-400 print:text-gray-700">
          {value.text}
        </div>
      )}
      <div className="mt-2 text-[9px] italic text-gray-600 print:text-gray-500">
        CapEx and OpEx are never summed — separate directional bands by design.
      </div>
    </div>
  )
}

// ─── Math + formatters (reused from calculated-build-metrics) ────────

function computeMetrics(view: SegmentView, count: number) {
  const fp4PerGpu = view.calc.fp4DensePerGpu.value.range?.min ?? 0
  const fp8PerGpu = view.calc.fp8DensePerGpu.value.range?.min ?? 0
  const hbmPerGpu = view.calc.hbmPerGpu.value.range?.min ?? 0
  const tdpPerGpu = view.calc.tdpPerGpu.value.range?.min ?? 0
  const priceLow = view.calc.pricePerGpu.value.range?.min ?? 0
  const priceHigh = view.calc.pricePerGpu.value.range?.max ?? 0

  return {
    fp4DenseTotal: count * fp4PerGpu,
    fp4SparseTotal: count * fp4PerGpu * 2,
    fp8DenseTotal: count * fp8PerGpu,
    hbmTotalGB: count * hbmPerGpu,
    gpuPowerW: count * tdpPerGpu,
    facilityLowW: count * tdpPerGpu * PUE_BAND_MIN,
    facilityHighW: count * tdpPerGpu * PUE_BAND_MAX,
    unitCount: Math.ceil(count / view.calc.gpusPerUnit),
    capexLow: count * priceLow,
    capexHigh: count * priceHigh,
  }
}

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
function formatKpiValue(v: KpiValue): string {
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

const CITED_ARCH_PROVENANCE: Provenance = {
  status: 'cited',
  source:
    'Reference architecture density — NVL72 = 72 GPUs/rack; HGX = 8 GPUs/baseboard; RTX PRO = 1 GPU/unit.',
  last_verified: '2026-05-26',
}
