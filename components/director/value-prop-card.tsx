import type { ValueProposition } from '@/lib/director/types'

export function ValuePropCard({ valueProposition }: { valueProposition: ValueProposition }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Value Proposition</h2>
      <p className="text-sm text-gray-100 mb-4 italic leading-relaxed">{valueProposition.statement}</p>
      <div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Competitive position</div>
        <div className="space-y-3">
          {valueProposition.competitive_position.map((c, i) => (
            <div key={i} className="text-xs border-l-2 border-gray-700 pl-3">
              <div className="text-blue-400 font-bold mb-0.5">vs {c.vs}</div>
              <div className="text-gray-200 leading-relaxed">{c.angle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
