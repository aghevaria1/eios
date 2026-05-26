// Paradigm Contrast — cross-layer explainer for PARADIGM-state competitors.
//
// Unlike AGNOSTIC and CONTESTED-SPLIT (both per-band, rendered inside the
// layer-fight-map band body), PARADIGM contrast is CROSS-LAYER: it's about
// the whole machine, not per-layer. Cerebras's wafer-scale architecture
// doesn't decompose into NVIDIA's L1-L5 layers, so the contrast belongs
// in its own panel below the all-PARADIGM cake — not duplicated per band.
//
// Structure:
//   1. Side-by-side architecture contrast (NVIDIA distributed-GPU
//      vs Cerebras monolithic-wafer) — what each is, named.
//   2. Three-facet verdict, ALL THREE MUST HOLD:
//      · SERIOUS-BUT-NARROW   — calibrated respect
//      · NICHE-SHARP          — locate NVIDIA's moat correctly
//      · MARKET-ARC           — scale honestly sized
//
// HONESTY DISCIPLINE:
//   The "all three must hold" header is the calibration guardrail.
//   Cherry-picking SERIOUS alone would inflate the threat ("Cerebras
//   is taking over"); cherry-picking NICHE alone would dismiss real
//   validation ("Cerebras is just an experiment"). The honest read is
//   the intersection: respect + correct moat-location + honest sizing.

interface ColumnSide {
  header: string
  subheader: string
  items: string[]
}

export interface VerdictFacet {
  label: string                 // e.g. "SERIOUS-BUT-NARROW"
  body: string                  // 2-3 sentence paragraph
}

interface Props {
  competitorName: string        // e.g. "Cerebras WSE-3"
  nvidia: ColumnSide
  competitor: ColumnSide
  facets: VerdictFacet[]        // expected 3; "all must hold" is the framing
  sourceRef?: string
}

export function ParadigmContrast({
  competitorName,
  nvidia,
  competitor,
  facets,
  sourceRef,
}: Props) {
  return (
    <section className="overflow-hidden rounded-md border border-indigo-500/30 bg-gray-900/30">
      <header className="border-b border-indigo-500/30 bg-indigo-500/5 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-indigo-300">
          PARADIGM CONTRAST  ·  {competitorName} vs NVIDIA distributed-GPU
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          The paradigm doesn&apos;t decompose into NVIDIA&apos;s L1-L5 layers,
          so the contrast lives here — cross-layer, whole-machine.
          What each architecture is; where each wins; the 3-facet verdict
          (calibrated respect, not dismissive, not alarmist).
        </div>
      </header>

      {/* Side-by-side architecture contrast */}
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <ArchColumn side={nvidia} accent="nvidia" />
        <ArchColumn side={competitor} accent="paradigm" />
      </div>

      {/* 3-facet verdict — all three must hold */}
      <div className="border-t border-indigo-500/30 px-5 py-4">
        <div className="text-[10px] font-mono tracking-widest text-indigo-300">
          VERDICT  ·  3 facets — all three must hold
        </div>
        <div className="mt-1 text-[10px] leading-relaxed text-gray-500">
          The honest read is the intersection. Cherry-picking one facet
          inflates the threat (serious alone) or dismisses real validation
          (niche alone). Calibration is the discipline.
        </div>
        <div className="mt-3 space-y-3">
          {facets.map((f) => (
            <FacetRow key={f.label} facet={f} />
          ))}
        </div>
      </div>

      {sourceRef && (
        <div className="border-t border-indigo-500/30 bg-gray-950/40 px-5 py-3 text-[10px] italic leading-relaxed text-gray-500">
          {sourceRef}
        </div>
      )}
    </section>
  )
}

function ArchColumn({
  side,
  accent,
}: {
  side: ColumnSide
  accent: 'nvidia' | 'paradigm'
}) {
  const headerClass =
    accent === 'nvidia' ? 'text-[#9FD848]' : 'text-indigo-300'
  return (
    <div className="rounded border border-gray-800/60 bg-gray-950/30 p-4">
      <div className={`text-[10px] font-mono font-semibold tracking-widest ${headerClass}`}>
        {side.header}
      </div>
      <div className="mt-1 text-xs font-semibold text-gray-100">
        {side.subheader}
      </div>
      <ul className="mt-2.5 space-y-1 text-[11px] leading-relaxed text-gray-300">
        {side.items.map((item, i) => (
          <li key={i}>
            <span className="text-gray-600">·</span> {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FacetRow({ facet }: { facet: VerdictFacet }) {
  return (
    <div className="rounded border border-gray-800/60 bg-gray-950/30 p-3">
      <div className="flex items-baseline gap-2">
        <span className="text-indigo-300">▸</span>
        <div className="text-[11px] font-mono font-semibold tracking-widest text-indigo-200">
          {facet.label}
        </div>
      </div>
      <p className="mt-1 pl-4 text-xs leading-relaxed text-gray-300">
        {facet.body}
      </p>
    </div>
  )
}
