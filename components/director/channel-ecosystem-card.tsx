import type { ChannelEcosystem } from '@/lib/director/types'

export function ChannelEcosystemCard({ channel }: { channel: ChannelEcosystem }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Channel & Partner Ecosystem</h2>

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
        <div className="flex flex-wrap gap-1.5">
          {channel.hpc_isvs.map((isv, i) => (
            <span key={i} className="text-[11px] bg-gray-800 text-gray-200 px-2 py-0.5 rounded">{isv}</span>
          ))}
        </div>
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
        <p className="text-xs text-gray-200 leading-relaxed">{channel.day1_isv_priority}</p>
      </div>
    </div>
  )
}
