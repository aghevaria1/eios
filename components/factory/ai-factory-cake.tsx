import type {
  Architecture,
  Component,
  Layer,
  Segment,
} from '@/lib/factory/kpi'

interface AIFactoryCakeProps {
  layers: Layer[]
  segment: Segment
  architecture: Architecture
  chosenGpu: Component
  chosenFabric: Component
  chosenIsv: Component
  softwareWrapper: Component
  oem: Component
}

export function AIFactoryCake({
  layers,
  chosenGpu,
  chosenFabric,
  chosenIsv,
  softwareWrapper,
  oem,
}: AIFactoryCakeProps) {
  const layerById = new Map(layers.map((l) => [l.id, l]))
  const L1 = layerById.get('L1')
  const L2 = layerById.get('L2')
  const L3 = layerById.get('L3')
  const L4 = layerById.get('L4')
  const L5 = layerById.get('L5')
  if (!L1 || !L2 || !L3 || !L4 || !L5) {
    throw new Error('AIFactoryCake: missing one of L1-L5 in layers prop')
  }

  return (
    <div className="grid grid-cols-[120px_1fr_64px] gap-px bg-gray-800 border border-gray-800 rounded-md overflow-hidden">
      {/* Row 1 — L5 Applications */}
      <LayerLabel id="L5" tag="APPLICATIONS" row={1} />
      <LayerContent row={1}>
        <LayerTitle>{L5.name}</LayerTitle>
        <LayerDescription>{L5.description}</LayerDescription>
      </LayerContent>

      {/* Row 2 — L4 Models / Microservices */}
      <LayerLabel id="L4" tag="MODELS" row={2} />
      <LayerContent row={2}>
        <LayerTitle>{L4.name}</LayerTitle>
        <LayerDescription>{L4.description}</LayerDescription>
      </LayerContent>

      {/* Row 3 — L3 ISV Platform (Red Hat OpenShift AI selected) */}
      <LayerLabel id="L3" tag="ISV" row={3} />
      <LayerContent row={3}>
        <LayerTitle>{L3.name}</LayerTitle>
        <LayerDescription>{L3.description}</LayerDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <SelectedChip slot="ISV">{chosenIsv.name}</SelectedChip>
        </div>
      </LayerContent>

      {/* NVAIE wrapper rail — spans rows 1-3 in col 3 */}
      <NvaieRail name={softwareWrapper.name} />

      {/* Row 4 — L2 Chips (Blackwell B200 + Spectrum-X selected) */}
      <LayerLabel id="L2" tag="CHIPS" row={4} />
      <LayerContent row={4} colSpan={2}>
        <LayerTitle>{L2.name}</LayerTitle>
        <LayerDescription>{L2.description}</LayerDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <SelectedChip slot="GPU">{chosenGpu.name}</SelectedChip>
          <SelectedChip slot="FABRIC">{chosenFabric.name}</SelectedChip>
        </div>
      </LayerContent>

      {/* Row 5 — Dell PowerEdge XE9680 chassis divider (between L2 and L1) */}
      <OemDivider name={oem.name} row={5} />

      {/* Row 6 — L1 Land / Power / Shell */}
      <LayerLabel id="L1" tag="FOUNDATION" row={6} />
      <LayerContent row={6} colSpan={2}>
        <LayerTitle>{L1.name}</LayerTitle>
        <LayerDescription>{L1.description}</LayerDescription>
      </LayerContent>
    </div>
  )
}

function LayerLabel({
  id,
  tag,
  row,
}: {
  id: string
  tag: string
  row: number
}) {
  return (
    <div
      className="bg-gray-950 px-4 py-5 flex flex-col justify-center"
      style={{ gridRow: row, gridColumn: 1 }}
    >
      <div className="text-sm font-mono font-semibold tracking-widest text-gray-300">
        {id}
      </div>
      <div className="mt-1 text-[10px] font-mono tracking-widest text-gray-500">
        {tag}
      </div>
    </div>
  )
}

function LayerContent({
  row,
  colSpan = 1,
  children,
}: {
  row: number
  colSpan?: number
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-gray-900 px-5 py-4"
      style={{ gridRow: row, gridColumn: `2 / span ${colSpan}` }}
    >
      {children}
    </div>
  )
}

function LayerTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-gray-100 tracking-wide">
      {children}
    </div>
  )
}

function LayerDescription({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-xs text-gray-400 leading-relaxed">{children}</div>
  )
}

function SelectedChip({
  slot,
  children,
}: {
  slot: string
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded border border-[#76B900] bg-[#76B900]/5 px-3 py-1.5 text-xs font-mono">
      <span className="text-[10px] tracking-widest text-[#76B900]/70">
        {slot}
      </span>
      <span className="font-medium text-[#76B900]">{children}</span>
    </span>
  )
}

function NvaieRail({ name }: { name: string }) {
  return (
    <div
      className="bg-gray-900 border-l-2 border-[#76B900] flex items-center justify-center py-3"
      style={{ gridColumn: 3, gridRow: '1 / span 3' }}
    >
      <div
        className="text-[10px] font-mono tracking-[0.25em] text-[#76B900] whitespace-nowrap"
        style={{ writingMode: 'vertical-rl' }}
      >
        {name.toUpperCase()}
      </div>
    </div>
  )
}

function OemDivider({ name, row }: { name: string; row: number }) {
  return (
    <div
      className="bg-gray-900 border-y border-gray-700 px-5 py-2"
      style={{ gridRow: row, gridColumn: '1 / span 3' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono tracking-widest text-gray-500">
          CHASSIS
        </span>
        <span className="text-xs font-medium text-gray-200">{name}</span>
        <span className="ml-auto text-[10px] font-mono tracking-wider text-gray-500">
          physical system housing
        </span>
      </div>
    </div>
  )
}
