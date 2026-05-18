import { loadPhaseGate } from '@/lib/director/load-target'
import { PhaseGateGrid } from '@/components/director/phase-gate-grid'
import { PhaseGateBriefShell } from '@/components/director/phase-gate-brief-shell'
import { PhaseGateExportButton } from '@/components/director/phasegate-export-button'

export default function PhaseGatePage() {
  const data = loadPhaseGate()
  const fallback =
    data.exec_decisions_needed.find((d) =>
      d.title.toLowerCase().includes('validation'),
    ) ?? null
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Phase-Gate Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">Program: {data.program} SuperNIC</p>
          <p className="text-[11px] text-gray-500 italic mt-2">
            {data.methodology_framework_note}
          </p>
        </div>
        <PhaseGateExportButton />
      </div>
      <PhaseGateBriefShell fallbackDecision={fallback}>
        <PhaseGateGrid lanes={data.lanes} phases={data.phases} states={data.states} />
      </PhaseGateBriefShell>
    </div>
  )
}
