'use client'

import type {
  KpiDefinition,
  KpiValue,
  Segment,
} from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'
import type { PartnerType } from './partner-type-toggle'

// Partner KPI Scorecard — operational KPIs owned by the active partner
// type in the active segment.
//
// EXPLAINED-GAP DISCIPLINE (refinement to plan #5):
//   · Each KPI relevant to the partner type is shown
//   · If the active segment seeds the value → render with ProvenancePill +
//     value + (cited notes if any)
//   · If NOT seeded → render an "(not seeded for this segment)" row with
//     framing in the panel header: "this segment seeds the KPIs that matter
//     for its north-star; partner KPIs not relevant to this segment
//     aren't seeded — gaps are deliberate scoping, not missing data"
//
// COMPLIANCE PROXY:
//   · ops_compliance_path is defined in the catalog but never seeded → dead
//     definition (flagged inline at the bottom of the panel)
//   · ops_compliance_audit_time is used as the practical compliance proxy
//   · The proxy row is labeled "Compliance (via audit-time proxy — see note
//     below)" so the label substitution is explicit, not silent

interface Props {
  partnerType: PartnerType
  activeSegment: Segment
  kpiByIdSegmentSeeded: Record<string, Record<string, KpiValue>>
  kpiDefById: Record<string, KpiDefinition>
}

// KPI sets per partner type, ordered by relevance. Each entry can override
// the displayed label (e.g. for the compliance proxy).
interface KpiEntry {
  kpiId: string
  labelOverride?: string
  isComplianceProxy?: boolean
}

const OEM_KPIS: KpiEntry[] = [
  { kpiId: 'ops_lead_time' },
  { kpiId: 'ops_service_footprint' },
  { kpiId: 'ops_deployment_cycle_time' },
  { kpiId: 'compute_hardware_density' },
  { kpiId: 'ops_pue' },
  { kpiId: 'ops_fleet_availability' },
  { kpiId: 'ops_tco_capex_directional' },
  { kpiId: 'ops_tco_opex_directional' },
]

const ISV_KPIS: KpiEntry[] = [
  { kpiId: 'ops_portability_index' },
  {
    kpiId: 'ops_compliance_audit_time',
    labelOverride: 'Compliance (via audit-time proxy)',
    isComplianceProxy: true,
  },
  { kpiId: 'ops_skills_fit' },
  { kpiId: 'ops_deployment_cycle_time' },
  { kpiId: 'ops_safety_certification' },
  { kpiId: 'ops_data_residency_pct' },
  { kpiId: 'ops_air_gap_capability' },
  { kpiId: 'ops_security_perimeter' },
]

const NEOCLOUD_KPIS: KpiEntry[] = [
  { kpiId: 'ops_fleet_utilization' },
  { kpiId: 'ops_time_to_capacity_online' },
  { kpiId: 'ops_lead_time', labelOverride: 'Allocation lead-time (priority)' },
  { kpiId: 'ops_service_footprint' },
  { kpiId: 'compute_hardware_density' },
  { kpiId: 'ops_tco_capex_directional' },
  { kpiId: 'ops_tco_opex_directional' },
]

export function PartnerKpiScorecard({
  partnerType,
  activeSegment,
  kpiByIdSegmentSeeded,
  kpiDefById,
}: Props) {
  const entries = entriesForPartnerType(partnerType)
  const hasComplianceProxy = entries.some((e) => e.isComplianceProxy)

  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          PARTNER KPI SCORECARD  ·  {partnerTypeLabel(partnerType)} · {activeSegment.name}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          Operational KPIs the partner type owns. Values pull from{' '}
          <span className="font-mono">{activeSegment.id}</span>
          .delivered_kpis via the segment-first resolver (no engine change).
        </p>
        <p className="mt-1 text-[11px] italic leading-relaxed text-gray-500">
          Gap framing: this segment seeds the KPIs that matter for ITS
          north-star; partner KPIs not relevant to this segment aren&apos;t
          seeded. Gaps below = deliberate scoping, not missing data.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950/50 text-left">
              <th className="w-[32%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                KPI
              </th>
              <th className="w-[16%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                PROVENANCE
              </th>
              <th className="w-[52%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                VALUE
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <KpiRow
                key={entry.kpiId + (entry.labelOverride ?? '')}
                entry={entry}
                segmentId={activeSegment.id}
                kpiDefById={kpiDefById}
                kpiByIdSegmentSeeded={kpiByIdSegmentSeeded}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasComplianceProxy && (
        <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-3 text-[10px] italic leading-relaxed text-gray-500">
          <span className="font-mono uppercase tracking-widest text-amber-300">
            compliance proxy note ·
          </span>{' '}
          <span className="font-mono text-gray-400">ops_compliance_path</span>{' '}
          is defined in the KPI catalog but never seeded on any segment —{' '}
          <span className="italic">dead definition, to clean up later</span>.
          The scorecard uses{' '}
          <span className="font-mono text-gray-400">
            ops_compliance_audit_time
          </span>{' '}
          as the practical compliance proxy (label substitution is explicit
          above, not silent).
        </div>
      )}
    </section>
  )
}

function KpiRow({
  entry,
  segmentId,
  kpiDefById,
  kpiByIdSegmentSeeded,
}: {
  entry: KpiEntry
  segmentId: string
  kpiDefById: Record<string, KpiDefinition>
  kpiByIdSegmentSeeded: Record<string, Record<string, KpiValue>>
}) {
  const def = kpiDefById[entry.kpiId]
  const seeded = kpiByIdSegmentSeeded[entry.kpiId]?.[segmentId]
  const label = entry.labelOverride ?? def?.name ?? entry.kpiId

  return (
    <tr className="border-t border-gray-800 align-top">
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="text-sm font-semibold text-gray-100">{label}</div>
        <div className="mt-0.5 font-mono text-[10px] tracking-widest text-gray-500">
          {entry.kpiId}
        </div>
      </td>
      <td className="bg-gray-900/60 px-4 py-3">
        {seeded ? (
          <ProvenancePill provenance={seeded.provenance} />
        ) : (
          <span className="inline-flex items-center whitespace-nowrap rounded border border-dashed border-gray-700 bg-gray-900/40 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest text-gray-500">
            NOT SEEDED
          </span>
        )}
      </td>
      <td className="bg-gray-900/60 px-4 py-3">
        {seeded ? (
          <SeededValueDisplay value={seeded} />
        ) : (
          <div className="text-[11px] italic leading-relaxed text-gray-500">
            (not seeded for this segment — partner KPI not relevant to this
            segment&apos;s north-star)
          </div>
        )}
      </td>
    </tr>
  )
}

function SeededValueDisplay({ value }: { value: KpiValue }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] leading-relaxed text-gray-200">
        {formatKpiValue(value)}
      </div>
      {value.provenance.notes && (
        <div className="text-[10px] italic leading-relaxed text-gray-500">
          {value.provenance.notes}
        </div>
      )}
    </div>
  )
}

function formatKpiValue(v: KpiValue): string {
  const parts: string[] = []
  if (v.range) {
    const { min, max, unit } = v.range
    parts.push(
      min === max
        ? `${min}${unit ? ' ' + unit : ''}`
        : `${min}–${max}${unit ? ' ' + unit : ''}`,
    )
  }
  if (v.band) parts.push(`[${v.band}]`)
  if (v.text) parts.push(v.text)
  return parts.join(' · ') || '(empty value)'
}

function entriesForPartnerType(t: PartnerType): KpiEntry[] {
  if (t === 'oem') return OEM_KPIS
  if (t === 'isv') return ISV_KPIS
  return NEOCLOUD_KPIS
}

function partnerTypeLabel(t: PartnerType): string {
  if (t === 'oem') return 'OEM'
  if (t === 'isv') return 'ISV'
  return 'Neocloud-as-channel'
}
