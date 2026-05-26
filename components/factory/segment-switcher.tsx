'use client'

import { useState } from 'react'
import type {
  Component,
  KpiDefinition,
  KpiValue,
  L1Profile,
  Layer,
  Segment,
} from '@/lib/factory/kpi'
import { AIFactoryCake, type L2Tile } from './ai-factory-cake'
import {
  DeliveredKpisPanel,
  type KpiResult,
} from './delivered-kpis-panel'
import { TcoBars } from './tco-bars'
import { CalculatedBuildMetrics } from './calculated-build-metrics'

export interface CalcInputs {
  // Lead-RA GPU per-unit specs (each KPI + its provenance)
  fp4DensePerGpu: { kpi: KpiDefinition; value: KpiValue }
  fp8DensePerGpu: { kpi: KpiDefinition; value: KpiValue }
  hbmPerGpu: { kpi: KpiDefinition; value: KpiValue }
  tdpPerGpu: { kpi: KpiDefinition; value: KpiValue }
  pricePerGpu: { kpi: KpiDefinition; value: KpiValue }
  leadGpuName: string
  // Slider config (per-segment defaults set by the architect page)
  sliderMin: number
  sliderMax: number
  sliderDefault: number
  // Physical-unit metadata per lead RA
  gpusPerUnit: number
  unitLabel: string
}

export interface SegmentView {
  segment: Segment
  raBlendDisplay: string
  blendNote: string
  l2Tiles: L2Tile[]
  chosenFabric: Component
  // Ordered list of ISV components from segment.isv_blend (lead-first).
  // Rendered as the L3 multi-tile row in the cake.
  chosenIsvs: Component[]
  softwareWrapper: Component
  oem: Component
  // Per-segment L1 (Land/Power/Shell) facility profile when seeded; undefined
  // segments fall back to the stack.json layer description at the cake's L1 band.
  l1Profile?: L1Profile
  northStar: KpiResult[]
  supporting: KpiResult[]
  tcoCapex: KpiResult
  tcoOpex: KpiResult
  // CalculatedBuildMetrics inputs (Category-1 calculated KPIs). Category-2
  // KPIs (northStar / supporting / tcoCapex / tcoOpex) intentionally do NOT
  // receive the slider count — architectural immutability.
  calc: CalcInputs
}

interface Props {
  views: SegmentView[]
  layers: Layer[]
  defaultSegmentId: string
}

export function SegmentSwitcher({ views, layers, defaultSegmentId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultSegmentId)
  const active = views.find((v) => v.segment.id === selectedId) ?? views[0]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <SegmentTabs
        views={views}
        selectedId={active.segment.id}
        onSelect={setSelectedId}
      />

      <header className="mb-8 mt-8">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          AI FACTORY · SOLUTION ARCHITECT
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">
          {active.segment.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-mono text-[#76B900]">
            {active.raBlendDisplay}
          </span>
          <span className="text-gray-500"> reference  ·  </span>
          <span className="text-gray-300">{active.blendNote}</span>
        </p>
        {active.segment.subtitle && (
          <p className="mt-1 text-xs text-gray-500">
            {active.segment.subtitle}
          </p>
        )}
        <GroundingBlock segment={active.segment} />
      </header>

      <AIFactoryCake
        layers={layers}
        l2Tiles={active.l2Tiles}
        chosenFabric={active.chosenFabric}
        chosenIsvs={active.chosenIsvs}
        softwareWrapper={active.softwareWrapper}
        oem={active.oem}
        l1Profile={active.l1Profile}
      />

      <p className="mt-6 text-[10px] font-mono leading-relaxed text-gray-500">
        Curated reference data — L2 tiles are the engine-resolved GPUs for each
        RA in <span className="text-gray-300">{active.segment.id}</span>&apos;s
        blend; L1 / L3 / L4 / L5 are shared across the blend (the blend lives
        at compute, not facility/software). Highlighted slots (GPU, FABRIC,
        ISV) are the swappable choices.
      </p>

      <div className="mt-10 space-y-6">
        {/* CalculatedBuildMetrics sits between the cake and the directional
            DeliveredKpisPanel. The progression teaches the boundary:
            architecture (cake) → what that scale builds to (live math) →
            what the workload determines (directional KPIs + TCO bars).
            The `key` prop forces a remount on segment change so slider state
            resets to the per-segment default — simpler than preserving
            counts across segment switches. */}
        <CalculatedBuildMetrics
          key={active.segment.id}
          sliderMin={active.calc.sliderMin}
          sliderMax={active.calc.sliderMax}
          sliderDefault={active.calc.sliderDefault}
          gpusPerUnit={active.calc.gpusPerUnit}
          unitLabel={active.calc.unitLabel}
          fp4DensePerGpu={active.calc.fp4DensePerGpu}
          fp8DensePerGpu={active.calc.fp8DensePerGpu}
          hbmPerGpu={active.calc.hbmPerGpu}
          tdpPerGpu={active.calc.tdpPerGpu}
          pricePerGpu={active.calc.pricePerGpu}
          leadGpuName={active.calc.leadGpuName}
        />
        <DeliveredKpisPanel
          northStar={active.northStar}
          supporting={active.supporting}
        />
        <TcoBars capex={active.tcoCapex} opex={active.tcoOpex} />
      </div>
    </div>
  )
}

// ─── Grounding block — archetype / buying_behavior / representative
// build / customer-competitor note. Optional fields; render only the
// ones present. Label-prefixed lines reinforce the illustrative framing
// ("REPRESENTATIVE BUILD" announces the discipline at the visual level).
// ────────────────────────────────────────────────────────────────────
function GroundingBlock({ segment }: { segment: Segment }) {
  const hasAny =
    segment.archetype ||
    segment.buying_behavior ||
    segment.representative_deployment ||
    segment.customer_competitor_note
  if (!hasAny) return null
  return (
    <div className="mt-4 rounded-md border border-gray-800 bg-gray-900/40 px-4 py-3 text-xs leading-relaxed">
      {segment.archetype && (
        <GroundingRow label="ARCHETYPE" body={segment.archetype} />
      )}
      {segment.buying_behavior && (
        <GroundingRow label="OPTIMIZES FOR" body={segment.buying_behavior} />
      )}
      {segment.representative_deployment && (
        <GroundingRow
          label="REPRESENTATIVE BUILD"
          body={segment.representative_deployment}
        />
      )}
      {segment.customer_competitor_note && (
        <GroundingRow
          label="ALSO COMPETITOR"
          body={segment.customer_competitor_note}
          tone="dual-role"
        />
      )}
    </div>
  )
}

function GroundingRow({
  label,
  body,
  tone = 'default',
}: {
  label: string
  body: string
  tone?: 'default' | 'dual-role'
}) {
  const bodyClass =
    tone === 'dual-role' ? 'text-amber-200/90' : 'text-gray-300'
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 py-0.5">
      <div className="whitespace-nowrap pt-[2px] text-[9px] font-mono uppercase tracking-widest text-gray-500">
        {label}
      </div>
      <div className={bodyClass}>{body}</div>
    </div>
  )
}

function SegmentTabs({
  views,
  selectedId,
  onSelect,
}: {
  views: SegmentView[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          SEGMENT
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Five customer segments seeded with delivered KPIs and RA blends.
          Switch to recompose the architect view — engine output is
          deterministic; no LLM call on switch.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-5 md:divide-x md:divide-y-0">
        {views.map((v) => {
          const selected = v.segment.id === selectedId
          const northStarLabel = v.northStar
            .map((r) => compactKpiName(r.kpi.name))
            .join(' + ')
          return (
            <button
              key={v.segment.id}
              onClick={() => onSelect(v.segment.id)}
              type="button"
              className={[
                'text-left px-4 py-3 transition-colors',
                selected
                  ? 'bg-[#76B900]/10'
                  : 'hover:bg-gray-900/60',
                selected
                  ? 'border-l-2 border-l-[#76B900] md:border-l-0 md:border-b-2 md:border-b-[#76B900]'
                  : 'border-l-2 border-l-transparent md:border-l-0 md:border-b-2 md:border-b-transparent',
              ].join(' ')}
            >
              <div
                className={`text-sm font-semibold leading-tight ${
                  selected ? 'text-[#76B900]' : 'text-gray-300'
                }`}
              >
                {v.segment.name}
              </div>
              <div className="mt-1 truncate text-[10px] font-mono tracking-wider">
                <span
                  className={selected ? 'text-[#76B900]/70' : 'text-gray-500'}
                >
                  north-star:{' '}
                </span>
                <span
                  className={selected ? 'text-[#76B900]' : 'text-gray-400'}
                >
                  {northStarLabel}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Compact a KPI name — extract uppercase abbreviation in parens if present
// ("Model FLOPS Utilization (MFU)" → "MFU"); otherwise keep the name as-is.
function compactKpiName(name: string): string {
  const m = name.match(/\(([A-Z]{2,6})\)/)
  return m ? m[1] : name
}
