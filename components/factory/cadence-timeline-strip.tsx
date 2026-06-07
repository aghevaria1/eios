'use client'

// Cadence Timeline Strip — NVIDIA vs AMD GPU generation cadence.
//
// 2 vendor rows × 3 time columns. Firmness layered by column: NOW (firm /
// shipping), 2H 2026 (firm / announced), 2027 (announced cadence, slips
// likely — dashed border + amber "less firm" badge).
//
// PRESENTATIONAL — NOT engine-bound KPI data. The timeline rows are
// announcement-narrative (vendor roadmap disclosures, analyst coverage),
// not measured KPI values that ripple through the engine's dependency
// graph. Carrying this as inline component data (not stack.json) keeps
// the engine surface clean — announcement cadence is a presentation
// layer, not a KPI catalog entry.
//
// HONESTY FRAMING (mandatory):
//   · Title: "ANNOUNCED TIMELINE — vendor targets, subject to slips"
//   · 2027 column visually softer (dashed + amber badge "less firm")
//   · Each 2027 cell carries an inline softness note (Rubin Ultra thermal
//     rumors, MI500 previewed-no-benchmarks)
//   · No date presented as guaranteed availability
//
// THE INSIGHT (cadence footer):
//   Both vendors on an explicit annual cadence, shipping competing parts
//   within ~a quarter of each other generation after generation. AMD
//   positions each gen directly against the NVIDIA equivalent (MI455X vs
//   Rubin, MI500 vs Rubin Ultra). NVIDIA bumped Rubin bandwidth specs in
//   response. The lockstep + continuous pressure IS the sales message:
//   the competition is structural and continuous, here's what lands when.

type Firmness = 'shipping' | 'announced-firm' | 'announced-soft'

interface TimelineCell {
  productName: string
  dateLabel: string
  specHint?: string
  softnessNote?: string  // only populated for announced-soft cells
}

interface TimelineColumn {
  id: string
  label: string
  sublabel: string
  firmness: Firmness
  nvidia: TimelineCell
  amd: TimelineCell
}

const COLUMNS: TimelineColumn[] = [
  {
    id: 'now',
    label: 'SHIPPING NOW',
    sublabel: 'firm — shipping today',
    firmness: 'shipping',
    nvidia: {
      productName: 'B200 / GB200 (+ GB300 Ultra)',
      dateLabel: 'current generation',
      specHint: 'HBM3e, FP4 dense ~9 PFLOPS (B200)',
    },
    amd: {
      productName: 'MI355X',
      dateLabel: 'current generation',
      specHint: 'HBM3e 288 GB, FP4 9.2 PFLOPS',
    },
  },
  {
    id: '2h-2026',
    label: '2H 2026',
    sublabel: 'firm — announced',
    firmness: 'announced-firm',
    nvidia: {
      productName: 'Vera Rubin VR200',
      dateLabel: '2H 2026',
      specHint: 'HBM4 288 GB, ~22 TB/s, NVLink 6',
    },
    amd: {
      productName: 'MI455X',
      dateLabel: 'Q3 2026 (Helios rack)',
      specHint: 'HBM4 432 GB, 19.6 TB/s, CDNA 5, TSMC 2nm',
    },
  },
  {
    id: '2027',
    label: '2027',
    sublabel: 'announced cadence — slips likely',
    firmness: 'announced-soft',
    nvidia: {
      productName: 'Rubin Ultra',
      dateLabel: '2H 2027 (announced)',
      specHint: 'roadmap target — full Rubin Ultra config',
      softnessNote:
        'rumored design/thermal concerns (~2300 W TDP, possible 2-die scale-back) — softer than nearer-term targets',
    },
    amd: {
      productName: 'MI500',
      dateLabel: '2H 2027 (announced)',
      specHint: 'CDNA 6, TSMC 2nm, HBM4E',
      softnessNote:
        'previewed at vendor events, no benchmarks, no shipping detail — announced cadence only',
    },
  },
]

export function CadenceTimelineStrip() {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          ANNOUNCED TIMELINE  ·  vendor targets, subject to slips
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          NVIDIA + AMD generation cadence, both vendors. Columns layer by
          firmness — SHIPPING NOW and 2H 2026 are firm announced targets;
          2027 is announced cadence with slips likely (Rubin Ultra carries
          rumored thermal/design concerns; MI500 is previewed without
          benchmarks). No date presented as guaranteed availability.
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-3 md:divide-x md:divide-y-0">
        {COLUMNS.map((col) => (
          <ColumnView key={col.id} col={col} />
        ))}
      </div>

      <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-4">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          THE CADENCE INSIGHT
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-300">
          Both vendors are on an{' '}
          <span className="font-mono text-[#9FD848]">explicit annual cadence</span>
          , shipping competing parts within ~a quarter of each other,
          generation after generation. AMD positions each gen directly
          against the NVIDIA equivalent (MI455X vs Rubin, MI500 vs Rubin
          Ultra). NVIDIA bumped Rubin bandwidth specs in response (the 13 →
          22 TB/s jump at CES 2026, surfaced in the scorecard above). The
          lockstep + continuous pressure IS the sales message: the
          competition is structural and continuous, here&apos;s what lands
          when.
        </p>
      </div>
    </section>
  )
}

function ColumnView({ col }: { col: TimelineColumn }) {
  const styles = columnStyles(col.firmness)
  return (
    <div className={`flex flex-col ${styles.column}`}>
      <div className={`border-b border-gray-800/60 px-4 py-3 ${styles.header}`}>
        <div className={`text-[10px] font-mono font-semibold tracking-widest ${styles.headerLabel}`}>
          {col.label}
        </div>
        <div className={`mt-0.5 text-[10px] font-mono ${styles.headerSublabel}`}>
          {col.sublabel}
        </div>
        {col.firmness === 'announced-soft' && (
          <span className="mt-2 inline-block whitespace-nowrap rounded border border-dashed border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest text-amber-200">
            LESS FIRM — SLIPS LIKELY
          </span>
        )}
      </div>
      <CellRow vendor="NVIDIA" vendorColor="text-[#9FD848]" cell={col.nvidia} />
      <CellRow vendor="AMD" vendorColor="text-sky-300" cell={col.amd} />
    </div>
  )
}

function CellRow({
  vendor,
  vendorColor,
  cell,
}: {
  vendor: string
  vendorColor: string
  cell: TimelineCell
}) {
  return (
    <div className="border-t border-gray-800/60 px-4 py-3 first:border-t-0">
      <div className={`text-[10px] font-mono font-semibold tracking-widest ${vendorColor}`}>
        {vendor}
      </div>
      <div className="mt-1 text-sm font-semibold leading-tight text-gray-100">
        {cell.productName}
      </div>
      <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-500">
        {cell.dateLabel}
      </div>
      {cell.specHint && (
        <div className="mt-1 text-[11px] leading-relaxed text-gray-400">
          {cell.specHint}
        </div>
      )}
      {cell.softnessNote && (
        <div className="mt-2 rounded border border-dashed border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[10px] italic leading-relaxed text-amber-100/80">
          {cell.softnessNote}
        </div>
      )}
    </div>
  )
}

function columnStyles(firmness: Firmness): {
  column: string
  header: string
  headerLabel: string
  headerSublabel: string
} {
  if (firmness === 'announced-soft') {
    return {
      column: 'bg-amber-500/5',
      header: 'border-l-2 border-l-amber-500/40',
      headerLabel: 'text-amber-200',
      headerSublabel: 'text-amber-100/60',
    }
  }
  if (firmness === 'announced-firm') {
    return {
      column: '',
      header: '',
      headerLabel: 'text-gray-200',
      headerSublabel: 'text-gray-500',
    }
  }
  // shipping
  return {
    column: '',
    header: '',
    headerLabel: 'text-[#9FD848]',
    headerSublabel: 'text-gray-500',
  }
}
