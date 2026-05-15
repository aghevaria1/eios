import { Fragment } from 'react'
import type {
  PhaseGateCellState,
  PhaseGateLane,
  PhaseGatePhase,
} from '@/lib/director/types'
import { PhaseGateCell } from './phase-gate-cell'

const LANE_LABELS: Record<PhaseGateLane, string> = {
  architecture: 'Architecture',
  silicon_design: 'Silicon Design',
  validation: 'Validation',
  isv_certification: 'ISV Certification',
  manufacturing: 'Manufacturing',
  supply_chain: 'Supply Chain',
  program: 'Program',
}

const PHASE_LABELS: Record<PhaseGatePhase, string> = {
  concept: 'Concept',
  plan: 'Plan',
  development: 'Development',
  sampling: 'Sampling',
  production: 'Production',
  sustaining: 'Sustaining',
}

export function PhaseGateGrid({
  lanes,
  phases,
  states,
}: {
  lanes: PhaseGateLane[]
  phases: PhaseGatePhase[]
  states: PhaseGateCellState[]
}) {
  const stateMap = new Map<string, PhaseGateCellState>()
  for (const s of states) stateMap.set(`${s.lane}::${s.phase}`, s)

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}
    >
      <div />
      {phases.map((p) => (
        <div
          key={p}
          className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center pb-1"
        >
          {PHASE_LABELS[p]}
        </div>
      ))}
      {lanes.map((lane) => (
        <Fragment key={lane}>
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider self-center text-right pr-1">
            {LANE_LABELS[lane]}
          </div>
          {phases.map((phase) => {
            const cell = stateMap.get(`${lane}::${phase}`)
            return cell ? (
              <PhaseGateCell
                key={phase}
                status={cell.status}
                targetDate={cell.target_date}
                detail={cell.detail}
              />
            ) : (
              <div key={phase} />
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
