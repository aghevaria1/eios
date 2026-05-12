import type { Workload } from '@/lib/director/types'

export function WorkloadCard({ workload }: { workload: Workload }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Workload Profile</h2>
      <dl className="space-y-3 text-xs">
        <Item label="Primary mix" value={workload.primary_mix} />
        <Item label="Typical scale" value={workload.typical_scale} />
        <Item label="Critical characteristics" value={workload.critical_characteristics} />
        <Item label="Latency budget" value={workload.latency_budget} />
        <Item label="Bottleneck profile" value={workload.bottleneck_profile} />
        <Item label="Buying criteria" value={workload.buying_criteria} />
      </dl>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">{label}</dt>
      <dd className="text-gray-200 mt-0.5 leading-relaxed">{value}</dd>
    </div>
  )
}
