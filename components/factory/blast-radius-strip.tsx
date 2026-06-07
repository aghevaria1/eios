// Reusable L1-L5 blast-radius strip — extracted from swap-report-card.tsx
// in phase 3c-2 step 1. The earlier inline version was fabric-only; this
// generalized version supports multi-layer highlighting (for AMD full-cake
// in step 2: L2 + L4 + L5 will all light up), arbitrary slot labels, and
// per-swap switching-cost framing text.
//
// Insight encoded: blast-radius (which layers light up + KPI delta count)
// is the visual encoding of SWITCHING COST. Small radius = contained
// (fabric swap, GPU swap) → low switching cost. Wide radius = deep
// (AMD full-cake when step 2 ships) → high switching cost.

const ALL_LAYERS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const

export interface BlastRadiusStripProps {
  // Ordered list of layers touched by this swap (e.g. ['L2'] for fabric or
  // GPU swap; ['L2', 'L4', 'L5'] for AMD full-cake in step 2).
  highlightedLayers: string[]
  // Slot descriptor for the header tag (e.g. 'Fabric', 'GPU', 'GPU + Software').
  slotLabel: string
  // Engine's counts from the SwapReport — surfaced as "blast radius".
  changedCount: number
  heldCount: number
  // Per-swap framing text — the switching-cost interpretation. Varies between
  // fabric ("single-layer swap, low switching cost — compute/software/OEM/ISV
  // stack untouched") and GPU swap ("broader than fabric — step 2 will extend
  // to software, raising switching cost further") and eventually the AMD
  // full-cake case ("multi-layer swap, high switching cost — replaces the
  // full stack: GPU + software + applications").
  framingText: string
}

export function BlastRadiusStrip({
  highlightedLayers,
  slotLabel,
  changedCount,
  heldCount,
  framingText,
}: BlastRadiusStripProps) {
  const layerTag = highlightedLayers.join(' + ')
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-[10px] font-mono tracking-widest text-gray-500">
            SWAPPING · {layerTag} · {slotLabel}
          </div>
          <div className="mt-1 text-xs leading-relaxed text-gray-400">
            Blast radius:{' '}
            <span className="font-mono text-emerald-300">
              {changedCount} KPI{changedCount === 1 ? '' : 's'} changed
            </span>
            <span className="text-gray-600"> · </span>
            <span className="font-mono text-gray-400">{heldCount} held</span>
            <span className="text-gray-600"> · </span>
            <span className="text-gray-500">{framingText}</span>
          </div>
        </div>
        <LayerStrip highlightedLayers={highlightedLayers} />
      </div>
    </section>
  )
}

function LayerStrip({ highlightedLayers }: { highlightedLayers: string[] }) {
  const swappedSet = new Set(highlightedLayers)
  return (
    <div className="flex items-center gap-1">
      {ALL_LAYERS.map((layer) => {
        const swapped = swappedSet.has(layer)
        return (
          <div
            key={layer}
            className={`flex h-9 w-9 items-center justify-center rounded border font-mono text-xs font-semibold ${
              swapped
                ? 'border-[#76B900] bg-[#76B900]/15 text-[#76B900]'
                : 'border-gray-800 bg-gray-900/40 text-gray-600'
            }`}
            title={
              swapped
                ? `${layer} — swap target`
                : `${layer} — insulated from this swap`
            }
          >
            {layer}
          </div>
        )
      })}
    </div>
  )
}
