import type { RoadmapFile } from '@/lib/factory/types'

const PHASE_BAR: Record<string, string> = {
  concept: 'bg-gray-800 border border-dashed border-gray-600 text-gray-300',
  development: 'bg-[#4A7C98] text-white',
  sampling: 'bg-amber-600 text-amber-50',
  production: 'bg-[#6FA37A] text-white',
  sustaining: 'bg-gray-600 text-gray-100',
  eol_phasing: 'bg-[#A85D5D] text-white',
}

const PHASE_SWATCH: Record<string, string> = {
  concept: 'bg-gray-800 border border-dashed border-gray-600',
  development: 'bg-[#4A7C98]',
  sampling: 'bg-amber-600',
  production: 'bg-[#6FA37A]',
  sustaining: 'bg-gray-600',
  eol_phasing: 'bg-[#A85D5D]',
}

const PHASE_LABEL: Record<string, string> = {
  concept: 'Concept',
  development: 'Development',
  sampling: 'Sampling',
  production: 'Production',
  sustaining: 'Sustaining',
  eol_phasing: 'EOL Phasing',
}

const GEN_LABEL: Record<string, string> = {
  cn5000: 'CN5000',
  cn6000: 'CN6000',
  cn7000: 'CN7000',
}

function assignRows(phases: Array<{ start: string; end: string }>): number[] {
  const rowEnds: number[] = []
  const rowFor: number[] = []
  for (const p of phases) {
    const ps = parseInt(p.start, 10)
    let row = rowEnds.findIndex((endY) => endY < ps)
    if (row === -1) {
      rowEnds.push(parseInt(p.end, 10))
      row = rowEnds.length - 1
    } else {
      rowEnds[row] = parseInt(p.end, 10)
    }
    rowFor.push(row)
  }
  return rowFor
}

export function TimelineCard({ data }: { data: RoadmapFile }) {
  const startYear = data.timeline_start_year
  const endYear = data.timeline_end_year
  const years: number[] = []
  for (let y = startYear; y <= endYear; y++) years.push(y)
  const yearCount = years.length

  const generationRows = data.generation_phases.map((g) => assignRows(g.phases))
  const maxRows = Math.max(...generationRows.map((a) => Math.max(...a, 0) + 1), 1)

  const colFor = (year: number) => year - startYear + 2
  const endColFor = (year: number) => year - startYear + 3

  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#C9A352] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#C9A352] shrink-0" />
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          Multi-Generation Timeline
        </h2>
      </div>

      <div
        className="grid mb-2 gap-1"
        style={{ gridTemplateColumns: `120px repeat(${yearCount}, 1fr)` }}
      >
        <div />
        {years.map((y) => (
          <div
            key={y}
            className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center pb-1 border-b border-gray-800"
          >
            {y}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {data.generation_phases.map((gen, gi) => {
          const rowAssign = generationRows[gi]
          return (
            <div
              key={gen.generation}
              className="grid gap-1"
              style={{
                gridTemplateColumns: `120px repeat(${yearCount}, 1fr)`,
                gridTemplateRows: `repeat(${maxRows}, 20px)`,
              }}
            >
              <div
                className="text-[12px] text-gray-200 font-bold uppercase tracking-wider self-center"
                style={{ gridRow: `1 / ${maxRows + 1}`, gridColumn: '1 / 2' }}
              >
                {GEN_LABEL[gen.generation] ?? gen.generation}
              </div>
              {gen.phases.map((phase, pi) => {
                const row = rowAssign[pi]
                const startCol = colFor(parseInt(phase.start, 10))
                const endCol = endColFor(parseInt(phase.end, 10))
                const cls = PHASE_BAR[phase.phase] ?? 'bg-gray-700 text-white/80'
                return (
                  <div
                    key={pi}
                    className={`rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center px-1 ${cls}`}
                    style={{
                      gridColumn: `${startCol} / ${endCol}`,
                      gridRow: `${row + 1} / ${row + 2}`,
                    }}
                  >
                    <span className="truncate">{PHASE_LABEL[phase.phase] ?? phase.phase}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="mt-5 pt-3 border-t border-gray-800">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
          Phase legend
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(PHASE_LABEL).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${PHASE_SWATCH[key]}`} />
              <span className="text-[11px] text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
