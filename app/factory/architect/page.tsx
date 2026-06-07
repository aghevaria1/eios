import {
  buildConfig,
  loadKnowledge,
  lookupKpiValue,
  KPI_DEFINITIONS,
  type KpiDefinition,
  type KpiValue,
} from '@/lib/factory/kpi'
import type { L2Tile } from '@/components/factory/ai-factory-cake'
import {
  SegmentSwitcher,
  type SegmentView,
} from '@/components/factory/segment-switcher'

const SEGMENT_ORDER = [
  'frontier-ai-labs',
  'hyperscalers',
  'neocloud',
  'fortune-500',
  'sovereign-ai',
  'industry-verticals',
]
const DEFAULT_SEGMENT_ID = 'fortune-500'

const TCO_CAPEX_ID = 'ops_tco_capex_directional'
const TCO_OPEX_ID = 'ops_tco_opex_directional'

// Per-segment slider configuration for CalculatedBuildMetrics. Ranges +
// defaults bracket realistic deployment scale per segment; default seeds
// a value that already shows interesting calculated numbers.
const SLIDER_CONFIG: Record<
  string,
  { min: number; max: number; default: number }
> = {
  'frontier-ai-labs':   { min: 1000, max: 100000, default: 10000 },
  hyperscalers:         { min: 1000, max: 250000, default: 50000 },
  // Neocloud: large multi-tenant rental fleets, comparable to hyperscaler
  // scale upper bound (CoreWeave-class ~250K-GPU fleet across many DCs).
  // Default in the mid-range — between frontier and hyperscaler scale —
  // since per-DC slices are smaller than the multi-DC aggregate.
  neocloud:             { min: 5000, max: 250000, default: 75000 },
  'fortune-500':        { min: 8,    max: 5000,   default: 256   },
  'sovereign-ai':       { min: 100,  max: 50000,  default: 5000  },
  'industry-verticals': { min: 8,    max: 2000,   default: 128   },
}

// Lead-RA → physical-unit metadata. NVL72 = 72 GPUs/rack (rack-scale system);
// HGX = 8 GPUs/baseboard (node-level); RTX_PRO = 1 GPU/unit (workstation/edge).
const RA_UNIT_META: Record<
  string,
  { gpusPerUnit: number; unitLabel: string }
> = {
  NVL72: { gpusPerUnit: 72, unitLabel: 'NVL72 racks' },
  HGX: { gpusPerUnit: 8, unitLabel: 'HGX 8-GPU nodes' },
  RTX_PRO: { gpusPerUnit: 1, unitLabel: 'RTX PRO units' },
}

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

    // ─── Calculated-Build-Metrics inputs ─────────────────────────────
    // Lead-RA GPU's per-unit specs (FLOPS, HBM, TDP, price band) feed the
    // calculated panel. count × per-unit-spec is the Category-1 math.
    const leadRa = knowledge.architectures.find((a) => a.id === leadRaId)
    if (!leadRa) {
      throw new Error(`architect: lead RA '${leadRaId}' not in architectures`)
    }
    const leadGpu = knowledge.components.get(leadRa.default_components.gpu)
    if (!leadGpu) {
      throw new Error(
        `architect: lead-RA GPU '${leadRa.default_components.gpu}' for segment '${segmentId}' not in components`,
      )
    }
    const resolveLeadGpuKpi = (kpiId: string) => {
      const kpi: KpiDefinition | undefined = KPI_DEFINITIONS.find(
        (k) => k.id === kpiId,
      )
      if (!kpi)
        throw new Error(`architect: lead-GPU KPI '${kpiId}' not in KPI_DEFINITIONS`)
      const value: KpiValue | undefined = leadGpu.kpi_values?.[kpiId]
      if (!value)
        throw new Error(
          `architect: lead-GPU '${leadGpu.id}' missing kpi_values['${kpiId}'] (required for CalculatedBuildMetrics)`,
        )
      return { kpi, value }
    }
    const calcInputs = {
      fp4DensePerGpu: resolveLeadGpuKpi('compute_flops_fp4_per_gpu_dense'),
      fp8DensePerGpu: resolveLeadGpuKpi('compute_flops_fp8_per_gpu_dense'),
      hbmPerGpu: resolveLeadGpuKpi('compute_memory_capacity_per_gpu'),
      tdpPerGpu: resolveLeadGpuKpi('compute_tdp_per_gpu'),
      pricePerGpu: resolveLeadGpuKpi('compute_per_gpu_price_band'),
      leadGpuName: leadGpu.name,
    }
    const slider = SLIDER_CONFIG[segmentId] ?? {
      min: 8,
      max: 5000,
      default: 256,
    }
    const unitMeta = RA_UNIT_META[leadRaId] ?? {
      gpusPerUnit: 1,
      unitLabel: 'units',
    }

    return {
      segment,
      raBlendDisplay,
      blendNote: blend.note,
      l2Tiles,
      chosenFabric,
      chosenIsvs,
      softwareWrapper,
      oem,
      l1Profile: segment.l1_profile,
      northStar,
      supporting,
      tcoCapex,
      tcoOpex,
      calc: {
        ...calcInputs,
        sliderMin: slider.min,
        sliderMax: slider.max,
        sliderDefault: slider.default,
        gpusPerUnit: unitMeta.gpusPerUnit,
        unitLabel: unitMeta.unitLabel,
      },
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
