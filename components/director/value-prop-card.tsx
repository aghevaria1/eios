import type { ValueProposition } from '@/lib/director/types'

export function ValuePropCard({ valueProposition }: { valueProposition: ValueProposition }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Value Proposition</h2>
      <p className="text-sm text-gray-100 mb-4 italic leading-relaxed">{valueProposition.statement}</p>
      <div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Competitive position</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2 pr-3 w-[200px]">
                Competitor
              </th>
              <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2">
                Cornelis advantage
              </th>
            </tr>
          </thead>
          <tbody>
            {valueProposition.competitive_position.map((c, i) => (
              <tr key={i} className="border-b border-gray-800 last:border-b-0">
                <td className="text-blue-400 font-bold align-top py-2 pr-3">{c.vs}</td>
                <td className="text-gray-200 align-top py-2 leading-relaxed">{c.angle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
