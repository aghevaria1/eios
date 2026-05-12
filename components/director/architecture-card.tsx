import type { ReferenceArchitecture } from '@/lib/director/types'

export function ArchitectureCard({ architecture }: { architecture: ReferenceArchitecture }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Reference Architecture</h2>
      <div className="space-y-2 mb-3">
        {architecture.products.map((product, i) => (
          <div key={i} className="grid grid-cols-[180px_1fr] gap-3 items-start text-xs">
            <span className="text-blue-400 font-bold break-words">{product}</span>
            <span className="text-gray-300">{architecture.descriptions[i]}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 pt-3 mt-3">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Protocol reasoning</div>
        <p className="text-xs text-gray-200 leading-relaxed">{architecture.protocol_reasoning}</p>
      </div>
    </div>
  )
}
