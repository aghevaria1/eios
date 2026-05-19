import type { CommitmentRegisterEntry } from '@/lib/director/types'
import { CommitmentRegisterTbody } from './commitment-register-tbody'

export function CommitmentRegisterCard({
  entries,
}: {
  entries: CommitmentRegisterEntry[]
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#4A7C98] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[#4A7C98] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          Commitment Register
        </h2>
      </div>
      <p className="text-[11px] text-gray-500 italic leading-relaxed mb-3">
        All entries illustrative — actual commitments held by program management. Framework demonstrates how a Director PM would track customer commitments, not confirmed customer deals.
      </p>
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
        <CommitmentRegisterTbody entries={entries} />
      </table>
    </div>
  )
}
