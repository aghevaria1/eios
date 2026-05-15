import type { EOLPhase, RoadmapFile } from '@/lib/director/types'

export function EolMethodologyCard({
  data,
}: {
  data: RoadmapFile['eol_framework']
}) {
  const targetUpper = data.target_product.toUpperCase()
  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#8A6FA3] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#8A6FA3] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          EOL Methodology Framework
        </h2>
        <span className="text-[10px] text-gray-500 ml-auto">
          Target: <span className="text-gray-300 font-bold">{targetUpper}</span>
        </span>
      </div>

      {data.methodology_only && (
        <div className="mb-4 px-3 py-2 bg-amber-900/30 border border-amber-800/40 rounded text-[11px] text-amber-200 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-300 mr-1">
            Methodology only:
          </span>
          Framework shown is the proposed EOL governance model. Actual {targetUpper} EOL trigger
          evaluation would be informed by internal program data, customer commitments, and supply
          chain telemetry.
        </div>
      )}

      <div className="space-y-3">
        {data.phases.map((phase) => (
          <EolPhaseBlock key={phase.phase_number} phase={phase} />
        ))}
      </div>
    </div>
  )
}

function EolPhaseBlock({ phase }: { phase: EOLPhase }) {
  return (
    <div className="border border-gray-800 rounded bg-gray-900/60 p-3">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6FA3]">
          Phase {phase.phase_number}
        </span>
        <h3 className="text-sm font-bold text-gray-100">{phase.name}</h3>
      </div>
      <dl className="grid grid-cols-[160px_1fr] gap-x-3 gap-y-2 text-xs">
        <dt className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pt-0.5">
          Trigger criteria
        </dt>
        <dd className="text-gray-200 leading-relaxed">{phase.trigger_criteria}</dd>
        <dt className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pt-0.5">
          Decision dependencies
        </dt>
        <dd className="text-gray-300 leading-relaxed">{phase.decision_dependencies}</dd>
      </dl>
    </div>
  )
}
