'use client'

import { useState } from 'react'
import type { Component, SwapReport } from '@/lib/factory/kpi'
import {
  FabricSwapView,
  type SwapTarget,
} from './fabric-swap-view'
import { AmdReplacementView } from './amd-replacement-view'
import { CerebrasParadigmView } from './cerebras-paradigm-view'

type CompetitiveMode = 'slot' | 'replacement' | 'paradigm'

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
  // Cerebras alternative-paradigm mode (new). PARADIGM doesn't decompose
  // into NVIDIA's L1-L5 — no swap, no scorecard, no engine output. Just
  // the all-PARADIGM cake + the cross-layer ParadigmContrast panel.
  cerebras: Component
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
    </div>
  )
}

// Top-level mode tabs. Three modes encode the switching-cost spectrum:
//   SLOT SWAPS              — one component swapped, narrow blast radius
//   FULL-STACK REPLACEMENT  — whole platform swapped, broader blast radius
//   ALTERNATIVE PARADIGM    — different machine entirely (re-architecture,
//                             not a swap; no swap-report applies)
// The tab labels themselves teach the taxonomy.
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
          The switching-cost spectrum encoded as structure. Slot swaps =
          contained blast radius (one component). Full-stack replacement =
          broader blast radius (platform). Alternative paradigm = a
          different machine entirely — adopting it is a re-architecture,
          not a swap.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-3 md:divide-x md:divide-y-0">
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
