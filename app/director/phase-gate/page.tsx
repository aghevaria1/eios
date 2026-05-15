import { loadPhaseGate } from '@/lib/director/load-target'
import { PhaseGateGrid } from '@/components/director/phase-gate-grid'

export default function PhaseGatePage() {
  const data = loadPhaseGate()
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Phase-Gate Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Program: {data.program} SuperNIC</p>
        <p className="text-[11px] text-gray-500 italic mt-2">
          {data.methodology_framework_note}
        </p>
      </div>
      <PhaseGateGrid lanes={data.lanes} phases={data.phases} states={data.states} />
    </div>
  )
}
