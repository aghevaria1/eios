'use client'

import { useState } from 'react'
import type { Component, SwapReport } from '@/lib/factory/kpi'
import { SwapReportCard } from './swap-report-card'

export interface SwapTarget {
  component: Component
  report: SwapReport
}

interface Props {
  baseline: Component
  targets: SwapTarget[]
  defaultTargetId: string
}

export function FabricSwapView({ baseline, targets, defaultTargetId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultTargetId)
  const active =
    targets.find((t) => t.component.id === selectedId) ?? targets[0]

  return (
    <div className="space-y-6">
      <TargetTabs
        targets={targets}
        selectedId={active.component.id}
        onSelect={setSelectedId}
      />
      <SwapReportCard
        baseline={baseline}
        target={active.component}
        report={active.report}
      />
    </div>
  )
}

function TargetTabs({
  targets,
  selectedId,
  onSelect,
}: {
  targets: SwapTarget[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          SWAP TARGET
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Each tab is a fabric-slot swap target. Switching recomposes the
          report instantly from the pre-resolved engine output — no fetch,
          no LLM.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-4 md:divide-x md:divide-y-0">
        {targets.map((t) => {
          const selected = t.component.id === selectedId
          const vendor = t.component.vendor ?? 'unknown'
          const generation = t.component.generation
          return (
            <button
              key={t.component.id}
              type="button"
              onClick={() => onSelect(t.component.id)}
              className={[
                'text-left px-4 py-3 transition-colors',
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
                {t.component.name}
              </div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest">
                <span
                  className={selected ? 'text-[#76B900]/70' : 'text-gray-500'}
                >
                  {vendor}
                </span>
                {generation && (
                  <span
                    className={selected ? 'text-[#76B900]/50' : 'text-gray-600'}
                  >
                    {' · '}
                    {generation}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
