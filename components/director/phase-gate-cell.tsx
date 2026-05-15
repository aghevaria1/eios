import type { PhaseGateStatus } from '@/lib/director/types'

type CellProps = {
  status: PhaseGateStatus
  targetDate: string | null
  detail: string | null
}

const STATUS_LABEL: Record<PhaseGateStatus, string> = {
  closed: '✓ Closed',
  in_progress: 'In Progress',
  at_risk: 'At Risk',
  future: 'Future',
}

const STATUS_CONTAINER: Record<PhaseGateStatus, string> = {
  closed: 'bg-gray-800/50 border border-gray-800 border-l border-l-gray-700',
  in_progress: 'bg-[#4A7C98]/15 border border-gray-800 border-l-[3px] border-l-[#4A7C98]',
  at_risk: 'bg-amber-900/30 border border-amber-800/40 border-l-[3px] border-l-amber-600',
  future: 'bg-gray-900 border border-dashed border-gray-700',
}

const STATUS_HEADER: Record<PhaseGateStatus, string> = {
  closed: 'text-gray-500',
  in_progress: 'text-[#7FB8D8]',
  at_risk: 'text-amber-300',
  future: 'text-gray-600',
}

const STATUS_DATE: Record<PhaseGateStatus, string> = {
  closed: 'text-gray-500',
  in_progress: 'text-blue-200',
  at_risk: 'text-amber-200',
  future: 'text-gray-500 italic',
}

const STATUS_DETAIL: Record<PhaseGateStatus, string> = {
  closed: 'text-gray-400',
  in_progress: 'text-blue-100',
  at_risk: 'text-amber-100',
  future: 'text-gray-500',
}

export function PhaseGateCell({ status, targetDate, detail }: CellProps) {
  return (
    <div className={`rounded p-2 min-h-[88px] flex flex-col ${STATUS_CONTAINER[status]}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_HEADER[status]}`}>
        {STATUS_LABEL[status]}
      </div>
      {targetDate && (
        <div className={`text-[11px] mt-0.5 ${STATUS_DATE[status]}`}>
          {targetDate}
        </div>
      )}
      {detail && (
        <div className={`text-[12px] mt-1 leading-snug line-clamp-3 ${STATUS_DETAIL[status]}`}>
          {detail}
        </div>
      )}
    </div>
  )
}
