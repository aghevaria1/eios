'use client'

import type { PhaseGateStatus } from '@/lib/factory/types'
import { useOpenBrief } from '@/lib/factory/phase-gate-brief-context'
import { PhaseGateCell } from './phase-gate-cell'

export function PhaseGateCellInteractive({
  lane,
  phase,
  status,
  targetDate,
  detail,
}: {
  lane: string
  phase: string
  status: PhaseGateStatus
  targetDate: string | null
  detail: string | null
}) {
  console.log('INTERACTIVE CELL RENDERED', lane, phase)
  const openBrief = useOpenBrief()
  console.log('INTERACTIVE CELL openBrief value', openBrief)
  return (
    <button
      type="button"
      onClick={() => {
        console.log('OPEN BRIEF CALLED', lane, phase, 'openBrief is', typeof openBrief)
        openBrief?.(lane, phase)
      }}
      className="text-left rounded p-0 cursor-pointer ring-offset-2 ring-offset-gray-950 hover:ring-2 hover:ring-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
      aria-label={`Generate executive brief for ${lane} × ${phase}`}
    >
      <PhaseGateCell status={status} targetDate={targetDate} detail={detail} />
    </button>
  )
}
