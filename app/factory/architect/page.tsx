import { buildConfig, loadKnowledge } from '@/lib/factory/kpi'
import { AIFactoryCake } from '@/components/factory/ai-factory-cake'

const SEGMENT_ID = 'fortune-500'
const ARCHITECTURE_ID = 'HGX'

export default function ArchitectPage() {
  const config = buildConfig(SEGMENT_ID, ARCHITECTURE_ID)
  const knowledge = loadKnowledge()

  const segment = knowledge.segments.find((s) => s.id === config.segment)
  const architecture = knowledge.architectures.find(
    (a) => a.id === config.architecture,
  )
  if (!segment || !architecture) {
    throw new Error(
      `architect: missing segment/architecture for ${SEGMENT_ID}/${ARCHITECTURE_ID}`,
    )
  }

  const lookup = (id: string, slot: string) => {
    const c = knowledge.components.get(id)
    if (!c) throw new Error(`architect: component '${id}' (${slot}) not in knowledge`)
    return c
  }
  const chosenGpu = lookup(config.gpu, 'gpu')
  const chosenFabric = lookup(config.fabric, 'fabric')
  const chosenIsv = lookup(config.isv, 'isv')
  const softwareWrapper = lookup(config.software, 'software')
  const oem = lookup(config.oem, 'oem')

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          AI FACTORY · SOLUTION ARCHITECT
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">
          {segment.name}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {architecture.name} reference architecture
          {segment.subtitle ? <> · {segment.subtitle}</> : null}
        </p>
      </header>

      <AIFactoryCake
        layers={knowledge.layers}
        segment={segment}
        architecture={architecture}
        chosenGpu={chosenGpu}
        chosenFabric={chosenFabric}
        chosenIsv={chosenIsv}
        softwareWrapper={softwareWrapper}
        oem={oem}
      />

      <p className="mt-6 text-[10px] font-mono leading-relaxed text-gray-500">
        Curated reference data — components shown are the engine-resolved
        defaults for{' '}
        <span className="text-gray-300">
          {segment.id} · {architecture.id}
        </span>
        . Highlighted slots (GPU, FABRIC, ISV) are the swappable choices the
        Solution Architect agent composes; layers L4/L5 are NVIDIA ecosystem
        descriptors at this phase. KPI bars + rationale arrive in Phase 2c.
      </p>
    </div>
  )
}
