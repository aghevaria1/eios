import {
  buildConfig,
  loadKnowledge,
  lookupKpiValue,
  KPI_DEFINITIONS,
  type KpiDefinition,
} from '@/lib/factory/kpi'
import { AIFactoryCake } from '@/components/factory/ai-factory-cake'
import {
  DeliveredKpisPanel,
  type KpiResult,
} from '@/components/factory/delivered-kpis-panel'
import { TcoBars } from '@/components/factory/tco-bars'

const SEGMENT_ID = 'fortune-500'
const ARCHITECTURE_ID = 'HGX'

const TCO_CAPEX_ID = 'ops_tco_capex_directional'
const TCO_OPEX_ID = 'ops_tco_opex_directional'

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

  const lookupComponent = (id: string, slot: string) => {
    const c = knowledge.components.get(id)
    if (!c)
      throw new Error(
        `architect: component '${id}' (${slot}) not in knowledge`,
      )
    return c
  }
  const chosenGpu = lookupComponent(config.gpu, 'gpu')
  const chosenFabric = lookupComponent(config.fabric, 'fabric')
  const chosenIsv = lookupComponent(config.isv, 'isv')
  const softwareWrapper = lookupComponent(config.software, 'software')
  const oem = lookupComponent(config.oem, 'oem')

  const resolveKpi = (id: string): KpiResult => {
    const kpi: KpiDefinition | undefined = KPI_DEFINITIONS.find(
      (k) => k.id === id,
    )
    if (!kpi) throw new Error(`architect: KPI '${id}' not in KPI_DEFINITIONS`)
    return { kpi, value: lookupKpiValue(kpi, config) }
  }

  const northStar = segment.north_star_kpis.map(resolveKpi)
  const supporting = segment.supporting_kpis.map(resolveKpi)
  const tcoCapex = resolveKpi(TCO_CAPEX_ID)
  const tcoOpex = resolveKpi(TCO_OPEX_ID)

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
        descriptors at this phase.
      </p>

      <div className="mt-10 space-y-6">
        <DeliveredKpisPanel northStar={northStar} supporting={supporting} />
        <TcoBars capex={tcoCapex} opex={tcoOpex} />
      </div>
    </div>
  )
}
