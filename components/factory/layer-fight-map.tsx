// Layer Fight Map — per-layer verdict visualization for the AMD full-stack
// replacement view. Renders the bird's-eye who-wins-what across L5 to L1,
// matching cake order (L5 top, L1 bottom). Each verdict carries one of five
// states with distinct pill treatment:
//
//   nvidia-wins        — emerald · NVIDIA leads this layer
//   amd-wins           — sky     · AMD leads this layer
//   parity-dominant    — gray    · hardware comparable; neither cleanly wins
//   workload-dependent — amber-bordered · neither cleanly wins; depends on
//                                          workload (memory-bound vs compute-bound,
//                                          inference vs training, etc.)
//   shared             — gray    · layer is non-differentiating; both vendors
//                                   compose with same components (ISV, facility)
//
// The fight-map is the qualitative per-layer summary; the L2 scorecard below
// is the quantitative deep-dive. They are complementary, not duplicative.

export type LayerVerdictKind =
  | 'nvidia-wins'
  | 'amd-wins'
  | 'parity-dominant'
  | 'workload-dependent'
  | 'shared'

export interface LayerVerdict {
  layerId: string // e.g. 'L5'
  layerName: string // e.g. 'Applications · NVAIE wrapper'
  verdict: LayerVerdictKind
  verdictLabel: string // e.g. 'NVIDIA WINS — software ecosystem moat'
  evidence: string // 1-2 sentence summary
  pointers?: string[] // optional bullet evidence points
  sourceRef?: string // e.g. 'see scorecard below for per-axis breakdown'
}

interface Props {
  verdicts: LayerVerdict[] // ordered L5 → L1 (caller controls order)
}

export function LayerFightMap({ verdicts }: Props) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          LAYER FIGHT MAP  ·  per-layer verdict
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          AMD full-stack vs NVIDIA, top to bottom (L5 → L1). The bird&apos;s-eye
          summary of who wins each layer and why — the L2 scorecard below is
          the quantitative deep-dive for the compute layer.
        </div>
      </header>
      <div className="divide-y divide-gray-800">
        {verdicts.map((v) => (
          <LayerVerdictRow key={v.layerId} verdict={v} />
        ))}
      </div>
    </section>
  )
}

function LayerVerdictRow({ verdict }: { verdict: LayerVerdict }) {
  const cls = verdictClasses(verdict.verdict)
  return (
    <div className="bg-gray-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-[10px] font-mono font-semibold tracking-widest text-gray-400">
            {verdict.layerId}  ·  {verdict.layerName}
          </div>
          <div className={`mt-1 text-sm font-semibold ${cls.label}`}>
            {verdict.verdictLabel}
          </div>
        </div>
        <VerdictPill verdict={verdict.verdict} />
      </div>
      <div className="mt-2 text-xs leading-relaxed text-gray-300">
        {verdict.evidence}
      </div>
      {verdict.pointers && verdict.pointers.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-gray-400">
          {verdict.pointers.map((p, i) => (
            <li key={i}>
              <span className="text-gray-600">·</span> {p}
            </li>
          ))}
        </ul>
      )}
      {verdict.sourceRef && (
        <div className="mt-2 border-t border-gray-800 pt-2 text-[10px] italic leading-relaxed text-gray-500">
          {verdict.sourceRef}
        </div>
      )}
    </div>
  )
}

function VerdictPill({ verdict }: { verdict: LayerVerdictKind }) {
  const { label, classes } = pillFor(verdict)
  return (
    <span
      className={`whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes}`}
    >
      {label}
    </span>
  )
}

function pillFor(verdict: LayerVerdictKind): {
  label: string
  classes: string
} {
  switch (verdict) {
    case 'nvidia-wins':
      return {
        label: 'NVIDIA WINS',
        classes: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
      }
    case 'amd-wins':
      return {
        label: 'AMD WINS',
        classes: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
      }
    case 'parity-dominant':
      return {
        label: 'PARITY-DOMINANT',
        classes: 'bg-gray-700/30 border-gray-600/50 text-gray-300',
      }
    case 'workload-dependent':
      return {
        label: 'WORKLOAD-DEPENDENT',
        classes: 'bg-amber-500/10 border-amber-500/50 text-amber-300',
      }
    case 'shared':
      return {
        label: 'SHARED',
        classes: 'bg-gray-700/20 border-gray-700/40 text-gray-400',
      }
  }
}

function verdictClasses(verdict: LayerVerdictKind): { label: string } {
  switch (verdict) {
    case 'nvidia-wins':
      return { label: 'text-emerald-200' }
    case 'amd-wins':
      return { label: 'text-sky-200' }
    case 'parity-dominant':
      return { label: 'text-gray-200' }
    case 'workload-dependent':
      return { label: 'text-amber-200' }
    case 'shared':
      return { label: 'text-gray-300' }
  }
}
