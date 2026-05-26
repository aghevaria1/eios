'use client'

import { useState } from 'react'
import type { Component, SwapReport } from '@/lib/factory/kpi'
import {
  FabricSwapView,
  type SwapTarget,
} from './fabric-swap-view'
import { AmdReplacementView } from './amd-replacement-view'
import { CerebrasParadigmView } from './cerebras-paradigm-view'
import { HyperscalerSelfSupplyView } from './hyperscaler-self-supply-view'
import { BreadthHeatMap } from './breadth-heat-map'
import { BriefOverlay } from './brief/brief-overlay'
import { SalesBrief } from './brief/sales-brief'

// CompetitiveMode is exported because the BreadthHeatMap component needs
// to call back into the parent's mode setter when a cell is clicked
// (cell click-through → depth-tab navigation).
export type CompetitiveMode =
  | 'slot'
  | 'replacement'
  | 'paradigm'
  | 'self-supply'
  | 'breadth'

interface Props {
  // Fabric slot-swap mode (existing — unchanged)
  fabricBaseline: Component
  fabricTargets: SwapTarget[]
  fabricDefaultTargetId: string
  // AMD full-stack replacement mode.
  amdBaselineGpu: Component
  amdTargetGpu: Component
  amdRoadmapRubin: Component
  amdRoadmapMi455x: Component
  amdReport: SwapReport
  // Cerebras alternative-paradigm mode.
  cerebras: Component
  // Hyperscaler customer-self-supply mode (new — 4th tab).
  // Strategic panel, NOT a fight-map: hyperscaler captive chips are mostly
  // internal/unbenchmarked; the threat axis is market-structure /
  // vertical-integration, not spec. The 4 are differentiated by maturity.
  hyperscalerGoogle: Component
  hyperscalerAws: Component
  hyperscalerMeta: Component
  hyperscalerMicrosoft: Component
}

export function CompetitiveModeSwitcher({
  fabricBaseline,
  fabricTargets,
  fabricDefaultTargetId,
  amdBaselineGpu,
  amdTargetGpu,
  amdRoadmapRubin,
  amdRoadmapMi455x,
  amdReport,
  cerebras,
  hyperscalerGoogle,
  hyperscalerAws,
  hyperscalerMeta,
  hyperscalerMicrosoft,
}: Props) {
  // Bird's Eye View is the default landing — entry-point synthesis showing
  // all threats at-a-glance, then the user drills into depth tabs via the
  // cell click-throughs. Tab order: Bird's Eye → Full-Stack Replacement →
  // Slot Swaps → Alternative Paradigm → Customer Self-Supply.
  const [mode, setMode] = useState<CompetitiveMode>('breadth')
  const [briefOpen, setBriefOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Top utility row — GENERATE BRIEF primary action, top-right. */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setBriefOpen(true)}
          className="rounded border border-[#76B900]/40 bg-[#76B900]/10 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-[#9FD848] transition-colors hover:bg-[#76B900]/20"
        >
          Generate Brief
        </button>
      </div>
      <ModeTabs mode={mode} onSelect={setMode} />
      {mode === 'slot' && (
        <FabricSwapView
          baseline={fabricBaseline}
          targets={fabricTargets}
          defaultTargetId={fabricDefaultTargetId}
        />
      )}
      {mode === 'replacement' && (
        <AmdReplacementView
          baselineGpu={amdBaselineGpu}
          targetGpu={amdTargetGpu}
          roadmapRubin={amdRoadmapRubin}
          roadmapMi455x={amdRoadmapMi455x}
          report={amdReport}
        />
      )}
      {mode === 'paradigm' && <CerebrasParadigmView cerebras={cerebras} />}
      {mode === 'self-supply' && (
        <HyperscalerSelfSupplyView
          google={hyperscalerGoogle}
          aws={hyperscalerAws}
          meta={hyperscalerMeta}
          microsoft={hyperscalerMicrosoft}
        />
      )}
      {mode === 'breadth' && <BreadthHeatMap onCellClick={setMode} />}

      {briefOpen && (
        <BriefOverlay
          title={`Sales Brief · ${briefModeLabel(mode)}`}
          subtitle={briefModeSubtitle(mode)}
          onClose={() => setBriefOpen(false)}
        >
          <SalesBrief
            mode={mode}
            baselineGpu={amdBaselineGpu}
            targetGpu={amdTargetGpu}
            roadmapRubin={amdRoadmapRubin}
            roadmapMi455x={amdRoadmapMi455x}
            report={amdReport}
            cerebras={cerebras}
            hyperscalerGoogle={hyperscalerGoogle}
            hyperscalerAws={hyperscalerAws}
            hyperscalerMeta={hyperscalerMeta}
            hyperscalerMicrosoft={hyperscalerMicrosoft}
          />
        </BriefOverlay>
      )}
    </div>
  )
}

function briefModeSubtitle(m: CompetitiveMode): string {
  switch (m) {
    case 'replacement':
      return 'AMD MI355X · current-gen scorecard + roadmap pair + moat thesis + switching cost + talk track'
    case 'slot':
      return 'Fabric · Cornelis / Broadcom / Arista — split-by-axis verdicts (no NVIDIA-sweep), AGNOSTIC-as-tradeoff'
    case 'paradigm':
      return 'Cerebras WSE-3 · paradigm-different · 3-facet verdict (SERIOUS-BUT-NARROW + NICHE-SHARP + MARKET-ARC)'
    case 'self-supply':
      return 'Hyperscaler silicon · customer-AND-competitor duality · 4 maturity-differentiated programs'
    case 'breadth':
      return 'Segment × Threat Matrix · 5×4 cell map · cross-pressure insight'
  }
}

function briefModeLabel(m: CompetitiveMode): string {
  switch (m) {
    case 'replacement':
      return 'Full-Stack Replacement (AMD)'
    case 'slot':
      return 'Slot Swaps (Fabric)'
    case 'paradigm':
      return 'Alternative Paradigm (Cerebras)'
    case 'self-supply':
      return 'Customer Self-Supply (Hyperscaler silicon)'
    case 'breadth':
      return "Bird's Eye View (Segment × Threat Matrix)"
  }
}

// Top-level mode tabs. Tab order = column order in the Bird's Eye matrix
// (so cell click-throughs land in the expected place left-to-right):
//
//   BIRD'S EYE VIEW         breadth — segment × threat matrix (orthogonal entry)
//   FULL-STACK REPLACEMENT  depth — whole platform swapped (AMD)
//   SLOT SWAPS              depth — one component swapped (fabric)
//   ALTERNATIVE PARADIGM    depth — different machine entirely (Cerebras)
//   CUSTOMER SELF-SUPPLY    depth — buyer becomes supplier (hyperscaler)
//
// The 4 depth tabs answer "which competitor in which depth"; the breadth
// tab answers "which segment faces which threat." Same truth, two angles.
// Bird's Eye leads as the entry-point synthesis; drill into depth via
// cell click-throughs.
function ModeTabs({
  mode,
  onSelect,
}: {
  mode: CompetitiveMode
  onSelect: (m: CompetitiveMode) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          COMPETITIVE MODE
        </div>
        <div className="mt-1 text-xs text-gray-400">
          <span className="font-mono text-gray-300">4 depth tabs</span>{' '}
          (per competitive type){' '}
          <span className="font-mono text-gray-500">+</span>{' '}
          <span className="font-mono text-gray-300">1 breadth view</span>{' '}
          (segment × threat matrix). Depth tabs answer &quot;which competitor
          in which depth&quot;; breadth view answers &quot;which segment faces
          which threat.&quot; Same truth, two angles. The breadth tab is{' '}
          <span className="italic">orthogonal</span> — not a 5th competitive
          type.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-2 md:divide-x lg:grid-cols-5 lg:divide-y-0">
        <ModeTab
          label="BIRD'S EYE VIEW"
          sublabel="Segment × Threat Matrix · orthogonal"
          selected={mode === 'breadth'}
          onClick={() => onSelect('breadth')}
        />
        <ModeTab
          label="FULL-STACK REPLACEMENT"
          sublabel="AMD — broader blast radius"
          selected={mode === 'replacement'}
          onClick={() => onSelect('replacement')}
        />
        <ModeTab
          label="SLOT SWAPS"
          sublabel="Fabric — low switching cost"
          selected={mode === 'slot'}
          onClick={() => onSelect('slot')}
        />
        <ModeTab
          label="ALTERNATIVE PARADIGM"
          sublabel="Cerebras — different machine"
          selected={mode === 'paradigm'}
          onClick={() => onSelect('paradigm')}
        />
        <ModeTab
          label="CUSTOMER SELF-SUPPLY"
          sublabel="Hyperscaler silicon — buyer exits"
          selected={mode === 'self-supply'}
          onClick={() => onSelect('self-supply')}
        />
      </div>
    </div>
  )
}

function ModeTab({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string
  sublabel: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left px-5 py-4 transition-colors',
        selected ? 'bg-[#76B900]/10' : 'hover:bg-gray-900/60',
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
        {label}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest">
        <span className={selected ? 'text-[#76B900]/70' : 'text-gray-500'}>
          {sublabel}
        </span>
      </div>
    </button>
  )
}
