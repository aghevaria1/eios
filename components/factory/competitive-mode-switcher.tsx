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

type CompetitiveMode = 'slot' | 'replacement' | 'paradigm' | 'self-supply'

interface Props {
  // Fabric slot-swap mode (existing — unchanged)
  fabricBaseline: Component
  fabricTargets: SwapTarget[]
  fabricDefaultTargetId: string
  // AMD full-stack replacement mode.
  amdBaselineGpu: Component
  amdTargetGpu: Component
  amdBaselineSoftware: Component
  amdTargetSoftware: Component
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
  amdBaselineSoftware,
  amdTargetSoftware,
  amdReport,
  cerebras,
  hyperscalerGoogle,
  hyperscalerAws,
  hyperscalerMeta,
  hyperscalerMicrosoft,
}: Props) {
  const [mode, setMode] = useState<CompetitiveMode>('slot')

  return (
    <div className="space-y-6">
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
          baselineSoftware={amdBaselineSoftware}
          targetSoftware={amdTargetSoftware}
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
    </div>
  )
}

// Top-level mode tabs. FOUR modes encode the complete switching-cost
// spectrum + competitive-type framework:
//   SLOT SWAPS              — one component swapped, narrow blast radius
//   FULL-STACK REPLACEMENT  — whole platform swapped, broader blast radius
//   ALTERNATIVE PARADIGM    — different machine entirely (re-architecture)
//   CUSTOMER SELF-SUPPLY    — buyer becomes supplier (vertical integration)
// That's the 4 fundamental ways an incumbent gets competed with — a
// FRAMEWORK, not a competitor list. The tab labels teach the taxonomy.
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
          Four fundamental ways an incumbent gets competed with. Slot swaps =
          contained blast radius. Full-stack replacement = broader. Alternative
          paradigm = different machine entirely. Customer self-supply = the
          buyer-exits-the-market end. The tab labels are the framework.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-2 md:divide-x lg:grid-cols-4 lg:divide-y-0">
        <ModeTab
          label="SLOT SWAPS"
          sublabel="Fabric — low switching cost"
          selected={mode === 'slot'}
          onClick={() => onSelect('slot')}
        />
        <ModeTab
          label="FULL-STACK REPLACEMENT"
          sublabel="AMD — broader blast radius"
          selected={mode === 'replacement'}
          onClick={() => onSelect('replacement')}
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
