import type { ChannelEcosystem } from '@/lib/director/types'

export function ChannelEcosystemCard({ channel }: { channel: ChannelEcosystem }) {
  const hasHpcIsvs = channel.hpc_isvs && channel.hpc_isvs.length > 0
  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#5FA3A3] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#5FA3A3] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Channel & Partner Ecosystem</h2>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">OEM / ODM partners</div>
        <div className="space-y-2">
          {channel.oem_odm.map((p, i) => (
            <div key={i} className="text-xs">
              <span className="text-blue-400 font-bold">{p.name}</span>
              <span className="text-gray-500"> — </span>
              <span className="text-gray-200">{p.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Required HPC ISV certifications</div>
        {hasHpcIsvs ? (
          <div className="flex flex-wrap gap-1.5">
            {channel.hpc_isvs!.map((isv, i) => (
              <span key={i} className="text-[11px] bg-gray-800 text-gray-200 px-2 py-0.5 rounded">{isv}</span>
            ))}
          </div>
        ) : channel.hpc_isvs_note ? (
          <p className="text-[11px] text-gray-400 italic">{channel.hpc_isvs_note}</p>
        ) : null}
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Required AI / ML ISV certifications</div>
        <div className="flex flex-wrap gap-1.5">
          {channel.ai_ml_isvs.map((isv, i) => (
            <span key={i} className="text-[11px] bg-gray-800 text-gray-200 px-2 py-0.5 rounded">{isv}</span>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Day-1 ISV priority</div>
        {Array.isArray(channel.day1_isv_priority) ? (
          <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-gray-200">
            {channel.day1_isv_priority.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-200 leading-relaxed">{channel.day1_isv_priority}</p>
        )}
      </div>
    </div>
  )
}
