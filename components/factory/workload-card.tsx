import type { Workload } from '@/lib/factory/types'

export function WorkloadCard({ workload }: { workload: Workload }) {
  const rows: Array<[string, string | string[]]> = [
    ['Primary mix', workload.primary_mix],
    ['Typical scale', workload.typical_scale],
    ['Critical characteristics', workload.critical_characteristics],
    ['Latency budget', workload.latency_budget],
    ['Bottleneck profile', workload.bottleneck_profile],
    ['Buying criteria', workload.buying_criteria],
  ]
  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#4A7C98] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#4A7C98] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Workload Profile</h2>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-gray-800 last:border-b-0">
              <th
                scope="row"
                className="text-gray-500 font-bold uppercase text-[10px] tracking-wider align-top py-2 pr-3 w-[180px]"
              >
                {label}
              </th>
              <td className="text-gray-200 align-top py-2 leading-relaxed">
                {Array.isArray(value) ? (
                  <ul className="list-disc list-outside ml-4 space-y-1">
                    {value.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
