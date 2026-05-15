import type {
  CommitmentRegisterEntry,
  CommitmentStatus,
} from '@/lib/director/types'

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

export function CommitmentRegisterCard({
  entries,
}: {
  entries: CommitmentRegisterEntry[]
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#4A7C98] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#4A7C98] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          Commitment Register
        </h2>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2 pr-3">
              Customer
            </th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2 pr-3">
              Commitment
            </th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2 pr-3 w-[100px]">
              Date
            </th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2 w-[100px]">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i} className="border-b border-gray-800 last:border-b-0">
              <td className="text-blue-400 font-bold align-top py-2 pr-3 leading-relaxed">
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
