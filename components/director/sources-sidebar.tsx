import type { SourceRef } from '@/lib/director/types'

export function SourcesSidebar({
  sources,
  inferences,
  openQuestions,
}: {
  sources: SourceRef[]
  inferences: string[]
  openQuestions: string[]
}) {
  return (
    <div className="sticky top-4 space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Sources</h3>
        <ol className="text-[11px] text-gray-300 space-y-2 list-decimal list-inside">
          {sources.map((s) => (
            <li key={s.id}>
              <span className="text-gray-500">[{s.section}]</span> {s.description}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-gray-900 border border-amber-900/40 rounded-lg p-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Inferences flagged</h3>
        <ul className="text-[11px] text-gray-300 space-y-2 list-disc list-inside leading-relaxed">
          {inferences.map((inf, i) => (
            <li key={i}>{inf}</li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-900 border border-blue-900/40 rounded-lg p-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Open questions for the team</h3>
        <ul className="text-[11px] text-gray-300 space-y-2 list-disc list-inside leading-relaxed">
          {openQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
