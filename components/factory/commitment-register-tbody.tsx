'use client'

import { Fragment, useState, type KeyboardEvent } from 'react'
import type {
  CommitmentRegisterEntry,
  CommitmentStatus,
} from '@/lib/factory/types'
import { RoadmapCommsPanel } from './roadmap-comms-panel'

const INTERACTIVE_COMMITMENTS = new Set([
  'SNL Tier-1 Federal::CN6000 EX-series integration delivery',
  'Neocloud A (under NDA)::10K-NIC CN6000 leaf-spine deployment',
  'Enterprise Automotive (Tier-1 OEM)::Internal AI training cluster — CN6000 RoCEv2',
])

const STATUS_LABEL: Record<CommitmentStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  slip: 'Slip',
}

const STATUS_BADGE: Record<CommitmentStatus, string> = {
  on_track: 'bg-[#6FA37A]/20 text-[#A8D4B5] border border-[#6FA37A]/50',
  at_risk: 'bg-amber-900/40 text-amber-200 border border-amber-700/50',
  slip: 'bg-[#A85D5D]/25 text-[#E6B5B5] border border-[#A85D5D]/60',
}

function entryKey(e: CommitmentRegisterEntry): string {
  return `${e.customer}::${e.commitment}`
}

export function CommitmentRegisterTbody({
  entries,
}: {
  entries: CommitmentRegisterEntry[]
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)

  return (
    <tbody>
      {entries.map((e) => {
        const key = entryKey(e)
        const interactive = INTERACTIVE_COMMITMENTS.has(key)
        const isActive = activeKey === key

        const toggle = () => setActiveKey(isActive ? null : key)

        const onKeyDown = (ev: KeyboardEvent<HTMLTableRowElement>) => {
          if (!interactive) return
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            toggle()
          }
        }

        const rowClass = interactive
          ? `border-b border-gray-800 last:border-b-0 cursor-pointer ${
              isActive
                ? 'bg-gray-800/60'
                : 'hover:bg-gray-800/40 focus:bg-gray-800/40'
            } focus:outline-none focus:ring-1 focus:ring-amber-500/60`
          : 'border-b border-gray-800 last:border-b-0'

        return (
          <Fragment key={key}>
            <tr
              className={rowClass}
              onClick={interactive ? toggle : undefined}
              onKeyDown={interactive ? onKeyDown : undefined}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-expanded={interactive ? isActive : undefined}
              aria-label={
                interactive
                  ? `Generate customer comms for ${e.customer} — ${e.commitment}`
                  : undefined
              }
            >
              <td className="text-blue-400 font-bold align-top py-2 pr-3 leading-relaxed">
                {interactive && (
                  <span
                    aria-hidden
                    className="inline-block w-3 text-amber-500/80 mr-1 text-[10px]"
                  >
                    {isActive ? '▾' : '▸'}
                  </span>
                )}
                {e.customer}
              </td>
              <td className="text-gray-200 align-top py-2 pr-3 leading-relaxed">
                {e.commitment}
              </td>
              <td className="text-gray-300 align-top py-2 pr-3 leading-relaxed">
                {e.date}
              </td>
              <td className="align-top py-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[e.status]}`}
                >
                  {STATUS_LABEL[e.status]}
                </span>
              </td>
            </tr>
            {interactive && isActive && (
              <tr className="border-b border-gray-800 last:border-b-0">
                <td colSpan={4} className="p-0">
                  <RoadmapCommsPanel
                    customer={e.customer}
                    commitment={e.commitment}
                    status={e.status}
                    onClose={() => setActiveKey(null)}
                  />
                </td>
              </tr>
            )}
          </Fragment>
        )
      })}
    </tbody>
  )
}
