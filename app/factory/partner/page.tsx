import {
  loadKnowledge,
  KPI_DEFINITIONS,
  type Component,
  type KpiDefinition,
  type KpiValue,
  type Segment,
} from '@/lib/factory/kpi'
import { PartnerLensView, type PartnerView } from '@/components/factory/partner-lens-view'

// Segment order matches the segment switcher on /factory/architect — keep
// the audience consistent across routes.
const SEGMENT_ORDER = [
  'frontier-ai-labs',
  'hyperscalers',
  'neocloud',
  'fortune-500',
  'sovereign-ai',
  'industry-verticals',
]
const DEFAULT_SEGMENT_ID = 'fortune-500'

// Partner-component identifiers — only Dell is seeded as the concrete OEM
// (Lenovo/Supermicro/HPE referenced as "equivalent" in segment grounding
// text). All 4 ISVs are seeded. No neocloud component exists; neocloud-as-
// channel reads from segment-level data directly.
const OEM_COMPONENT_ID = 'dell_xe9680'
const ISV_COMPONENT_IDS = [
  'red_hat_openshift_ai',
  'vmware_private_ai_foundation',
  'nutanix_enterprise_ai',
  'vast_data',
]

export default function PartnerPage() {
  const knowledge = loadKnowledge()

  const segments: Segment[] = SEGMENT_ORDER.map((id) => {
    const s = knowledge.segments.find((x) => x.id === id)
    if (!s) throw new Error(`partner: segment '${id}' not in knowledge`)
    return s
  })

  const oem = knowledge.components.get(OEM_COMPONENT_ID)
  if (!oem) throw new Error(`partner: OEM '${OEM_COMPONENT_ID}' not in knowledge`)

  const isvs: Component[] = ISV_COMPONENT_IDS.map((id) => {
    const c = knowledge.components.get(id)
    if (!c) throw new Error(`partner: ISV '${id}' not in knowledge`)
    return c
  })

  // Pre-resolve KPI values per segment via the standard segment-first →
  // component-fallback resolver. The partner-type-relevant KPI sets pull
  // from this map; missing KPI values surface as honest "(not seeded for
  // this segment)" rows in the scorecard.
  const view: PartnerView = {
    segments,
    oem,
    isvs,
    kpiByIdSegmentSeeded: buildKpiSeedingMap(segments),
    kpiDefById: buildKpiDefMap(),
  }

  return <PartnerLensView view={view} defaultSegmentId={DEFAULT_SEGMENT_ID} />
}

// Build a fast-lookup map: kpi_id → segment_id → KpiValue (only present
// where segment.delivered_kpis has a value). Lets the client scorecard
// answer "does this segment carry this KPI?" without re-traversing
// segment data per render.
function buildKpiSeedingMap(
  segments: Segment[],
): Record<string, Record<string, KpiValue>> {
  const map: Record<string, Record<string, KpiValue>> = {}
  segments.forEach((s) => {
    if (!s.delivered_kpis) return
    Object.entries(s.delivered_kpis).forEach(([kpiId, value]) => {
      if (!map[kpiId]) map[kpiId] = {}
      map[kpiId][s.id] = value as KpiValue
    })
  })
  return map
}

function buildKpiDefMap(): Record<string, KpiDefinition> {
  const map: Record<string, KpiDefinition> = {}
  KPI_DEFINITIONS.forEach((d) => {
    map[d.id] = d
  })
  return map
}

