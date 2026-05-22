import {
  buildConfig,
  loadKnowledge,
  lookupKpiValue,
  KPI_DEFINITIONS,
  type KpiDefinition,
} from '@/lib/factory/kpi'
import type { L2Tile } from '@/components/factory/ai-factory-cake'
import {
  SegmentSwitcher,
  type SegmentView,
} from '@/components/factory/segment-switcher'

const SEGMENT_ORDER = [
  'frontier-ai-labs',
  'hyperscalers',
  'fortune-500',
  'sovereign-ai',
  'industry-verticals',
]
const DEFAULT_SEGMENT_ID = 'fortune-500'

const TCO_CAPEX_ID = 'ops_tco_capex_directional'
const TCO_OPEX_ID = 'ops_tco_opex_directional'

export default function ArchitectPage() {
  const knowledge = loadKnowledge()

  const views: SegmentView[] = SEGMENT_ORDER.map((segmentId) => {
    const segment = knowledge.segments.find((s) => s.id === segmentId)
    if (!segment) throw new Error(`architect: segment '${segmentId}' not in knowledge`)

    const blend = segment.architecture_blend
    if (!blend || blend.ras.length === 0) {
      throw new Error(
        `architect: segment '${segmentId}' has no architecture_blend.ras`,
      )
    }

    // L2 tiles — one per RA in blend, GPU resolved via each RA's default_components.
    const l2Tiles: L2Tile[] = blend.ras.map((r) => {
      const ra = knowledge.architectures.find((a) => a.id === r.id)
      if (!ra)
        throw new Error(
          `architect: RA '${r.id}' in segment '${segmentId}' blend not in architectures`,
        )
      const gpu = knowledge.components.get(ra.default_components.gpu)
      if (!gpu)
        throw new Error(
          `architect: GPU '${ra.default_components.gpu}' for RA '${r.id}' not in components`,
        )
      return { ra, gpu, role: r.role }
    })

    // Non-GPU components — taken from the lead RA's defaults (all RAs in current
    // data share the same fabric / oem / isv / software wrapper, so the lead is
    // a faithful single-source).
    const leadRaId = blend.ras[0].id
    const config = buildConfig(segmentId, leadRaId)
    const lookupComponent = (id: string, slot: string) => {
      const c = knowledge.components.get(id)
      if (!c)
        throw new Error(
          `architect: component '${id}' (${slot}) not in knowledge`,
        )
      return c
    }
    const chosenFabric = lookupComponent(config.fabric, 'fabric')
    const softwareWrapper = lookupComponent(config.software, 'software')
    const oem = lookupComponent(config.oem, 'oem')

    // L3 ISV blend — full ordered list from segment.isv_blend. Falls back to
    // config.isv (= architecture default, resolved by buildConfig) when a
    // segment has no blend, so the cake always has at least one tile at L3.
    const chosenIsvs =
      segment.isv_blend && segment.isv_blend.length > 0
        ? segment.isv_blend.map((id) => lookupComponent(id, 'isv'))
        : [lookupComponent(config.isv, 'isv')]

    // KPI resolution — segment-scoped delivered_kpis win (per the engine's
    // segment-first resolver from phase 2c).
    const resolveKpi = (id: string) => {
      const kpi: KpiDefinition | undefined = KPI_DEFINITIONS.find(
        (k) => k.id === id,
      )
      if (!kpi)
        throw new Error(
          `architect: KPI '${id}' not in KPI_DEFINITIONS`,
        )
      return { kpi, value: lookupKpiValue(kpi, config) }
    }
    const northStar = segment.north_star_kpis.map(resolveKpi)
    const supporting = segment.supporting_kpis.map(resolveKpi)
    const tcoCapex = resolveKpi(TCO_CAPEX_ID)
    const tcoOpex = resolveKpi(TCO_OPEX_ID)

    const raBlendDisplay = blend.ras.map((r) => r.id).join(' + ')

    return {
      segment,
      raBlendDisplay,
      blendNote: blend.note,
      l2Tiles,
      chosenFabric,
      chosenIsvs,
      softwareWrapper,
      oem,
      northStar,
      supporting,
      tcoCapex,
      tcoOpex,
    }
  })

  return (
    <SegmentSwitcher
      views={views}
      layers={knowledge.layers}
      defaultSegmentId={DEFAULT_SEGMENT_ID}
    />
  )
}
