'use client'

import type {
  Component,
  KpiDefinition,
  KpiValue,
  Segment,
} from '@/lib/factory/kpi'
import { ProvenancePill } from '../provenance-pill'
import {
  BriefHeader,
  BriefSection,
  BriefFooter,
} from './brief-overlay'
import type { PartnerType } from '../partner-type-toggle'

// Partner Brief — snapshot of /factory/partner.
//
// CAPTURES current state:
//   · partner type (OEM / ISV / Neocloud-as-channel)
//   · active segment (segment-locked to Neocloud for Neocloud mode)
//   · selected ISV sub-target (ISV mode only)
//
// HONESTY DISCIPLINE:
//   · ProvenancePill carries through — unseeded KPIs render with "NOT
//     SEEDED" dashed badge + the explained-gap framing from the view
//   · Compliance proxy: ops_compliance_audit_time labeled as the practical
//     compliance proxy; dead ops_compliance_path definition flagged
//   · Neocloud's wraps-the-stack treatment renders verbatim seeded
//     customer_channel_note (CoreWeave SUNK / Mission Control, Jan 2026)
//     — no paraphrasing, no new claims
//   · No fabricated partner-specific volumes / deal terms

interface Props {
  partnerType: PartnerType
  activeSegment: Segment
  oem: Component
  activeIsv: Component
  kpiByIdSegmentSeeded: Record<string, Record<string, KpiValue>>
  kpiDefById: Record<string, KpiDefinition>
}

// KPI sets per partner type — mirrors partner-kpi-scorecard.tsx structure
// so the brief renders the SAME set of partner-relevant KPIs the view shows.

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

export function PartnerBrief({
  partnerType,
  activeSegment,
  oem,
  activeIsv,
  kpiByIdSegmentSeeded,
  kpiDefById,
}: Props) {
  const entries = entriesForPartnerType(partnerType)
  const hasComplianceProxy = entries.some((e) => e.isComplianceProxy)
  const isNeocloud = partnerType === 'neocloud'
  const partnerLabel = partnerTypeLabel(partnerType)

  return (
    <>
      <BriefHeader
        title={`Partner Brief · ${partnerLabel} · ${activeSegment.name}`}
        subtitle={isvSubtitle(partnerType, activeIsv)}
        sourceLabel="snapshot of /factory/partner"
      />

      {/* Your slot — responsibility boundary */}
      <BriefSection label="YOUR SLOT · responsibility boundary">
        {isNeocloud ? (
          <NeocloudSlotDiagram />
        ) : (
          <FiveLayerSlot
            partnerType={partnerType}
            oem={oem}
            activeIsv={activeIsv}
          />
        )}
      </BriefSection>

      {/* KPIs you own — preserved gap framing */}
      <BriefSection label="KPIs YOU OWN · seeded values from this segment">
        <p className="mb-2 text-[10px] italic leading-relaxed text-gray-400 print:text-gray-600">
          Gap framing: this segment seeds the KPIs that matter for ITS
          north-star; partner KPIs not relevant to this segment aren&apos;t
          seeded. Gaps below = deliberate scoping, not missing data.
        </p>
        <table className="w-full table-fixed text-[11px]">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-400">
              <th className="w-[36%] py-1.5 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">
                KPI
              </th>
              <th className="w-[16%] py-1.5 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">
                PROVENANCE
              </th>
              <th className="w-[48%] py-1.5 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">
                VALUE
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <KpiRow
                key={e.kpiId + (e.labelOverride ?? '')}
                entry={e}
                segmentId={activeSegment.id}
                kpiDefById={kpiDefById}
                kpiByIdSegmentSeeded={kpiByIdSegmentSeeded}
              />
            ))}
          </tbody>
        </table>
        {hasComplianceProxy && (
          <p className="mt-2 text-[10px] italic leading-relaxed text-amber-200/80 print:text-amber-800">
            <span className="font-mono uppercase tracking-widest text-amber-300 print:text-amber-700">
              compliance proxy ·{' '}
            </span>
            <span className="font-mono">ops_compliance_path</span> is defined
            in the catalog but never seeded on any segment (dead definition,
            to clean up later). The scorecard uses{' '}
            <span className="font-mono">ops_compliance_audit_time</span> as the
            practical compliance proxy — label substitution explicit above.
          </p>
        )}
      </BriefSection>

      {/* Co-sell motion — partner-PM mental model */}
      <BriefSection label="CO-SELL MOTION · partner-PM mental model">
        {partnerType === 'oem' && <OemMentalModel segment={activeSegment} oem={oem} />}
        {partnerType === 'isv' && (
          <IsvMentalModel segment={activeSegment} isv={activeIsv} />
        )}
        {isNeocloud && <NeocloudMentalModel segment={activeSegment} />}
      </BriefSection>

      <BriefFooter
        note={
          isNeocloud
            ? "Neocloud-as-channel is structurally segment-locked to Neocloud — the motion exists in this segment by definition. The CoreWeave SUNK / Mission Control citation above is the seeded customer_channel_note verbatim (no paraphrasing, no new claims). Snapshot of /factory/partner."
            : 'Operational KPIs are partner-deal-dependent (most directional). The lens shows where the partner slots + what they own, not authored sales claims. Snapshot of /factory/partner.'
        }
      />
    </>
  )
}

// ─── Slot diagrams ──────────────────────────────────────────────────

function FiveLayerSlot({
  partnerType,
  oem,
  activeIsv,
}: {
  partnerType: 'oem' | 'isv'
  oem: Component
  activeIsv: Component
}) {
  const layers = [
    { id: 'L5', label: 'L5 · Ecosystem', owned: false, owner: 'NVIDIA · NVAIE / CUDA' },
    { id: 'L4', label: 'L4 · Software', owned: false, owner: 'NVIDIA · NIM / Nemotron / Dynamo' },
    {
      id: 'L3',
      label: 'L3 · ISV / Orchestration',
      owned: partnerType === 'isv',
      owner:
        partnerType === 'isv'
          ? `${activeIsv.name}${activeIsv.category ? ` (${activeIsv.category})` : ''}`
          : 'Red Hat / VMware / Nutanix / VAST — vendor-agnostic',
    },
    { id: 'L2', label: 'L2 · GPU + Fabric', owned: false, owner: 'NVIDIA silicon + fabric' },
    {
      id: 'L1',
      label: 'L1 · Facility / Chassis',
      owned: partnerType === 'oem',
      owner:
        partnerType === 'oem'
          ? `${oem.name} (Lenovo / Supermicro / HPE equivalent in segment-typical builds)`
          : 'OEM chassis + DC patterns',
    },
  ]
  return (
    <div className="divide-y divide-gray-800 rounded border border-gray-700 print:divide-gray-300 print:border-gray-400">
      {layers.map((l) => (
        <div
          key={l.id}
          className={`flex items-baseline justify-between gap-2 px-3 py-2 ${
            l.owned
              ? 'bg-[#76B900]/10 border-l-2 border-l-[#76B900] print:bg-lime-50 print:border-l-[#5a8c00]'
              : ''
          }`}
        >
          <div
            className={`text-[11px] font-semibold ${
              l.owned
                ? 'text-[#9FD848] print:text-[#5a8c00]'
                : 'text-gray-200 print:text-black'
            }`}
          >
            {l.label}
          </div>
          <div className="text-right text-[10px] font-mono">
            <div
              className={
                l.owned
                  ? 'uppercase tracking-widest text-[#76B900] print:text-[#5a8c00]'
                  : 'uppercase tracking-widest text-gray-500 print:text-gray-600'
              }
            >
              {l.owned ? 'PARTNER OWNS' : 'NVIDIA + adjacent'}
            </div>
            <div className="mt-0.5 text-gray-400 print:text-gray-700">
              {l.owner}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NeocloudSlotDiagram() {
  return (
    <div className="rounded border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-3 print:border-amber-700 print:bg-amber-50">
      <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 print:text-amber-800">
        NEOCLOUD ENVELOPE · wraps the stack
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-300 print:text-black">
        Multi-DC GPU-rental fleet + deployment infrastructure + tenant
        orchestration tooling (e.g. CoreWeave SUNK + Mission Control). Wraps
        the integrated NVIDIA stack delivered as a rentable resource. No
        single owned layer — the channel motion is delivery + access + tooling
        integration into NVIDIA reference architectures.
      </p>
      <div className="mt-2 divide-y divide-gray-800 rounded border border-gray-700 bg-gray-950/40 print:divide-gray-300 print:border-gray-400 print:bg-white">
        {[
          'L5 · NVAIE / CUDA ecosystem',
          'L4 · NIM / Nemotron / Dynamo',
          'L3 · Orchestration (vendor-agnostic ISVs)',
          'L2 · NVIDIA GPU + Spectrum-X / NVLink',
          'L1 · Dell XE9680 + multi-DC facility',
        ].map((label) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 px-2.5 py-1.5"
          >
            <div className="text-[10px] text-gray-300 print:text-black">
              {label}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500 print:text-gray-600">
              NVIDIA stack (delivered)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── KPI row (preserves the view's gap framing) ─────────────────────

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
    <tr className="border-b border-gray-800 align-top print:border-gray-300">
      <td className="py-1.5 pr-2">
        <div className="font-semibold text-gray-100 print:text-black">
          {label}
        </div>
        <div className="mt-0.5 font-mono text-[9px] tracking-widest text-gray-500 print:text-gray-600">
          {entry.kpiId}
        </div>
      </td>
      <td className="py-1.5 pr-2">
        {seeded ? (
          <ProvenancePill provenance={seeded.provenance} />
        ) : (
          <span className="inline-flex items-center whitespace-nowrap rounded border border-dashed border-gray-700 bg-gray-900/40 px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest text-gray-500 print:border-gray-400 print:bg-gray-100 print:text-gray-600">
            NOT SEEDED
          </span>
        )}
      </td>
      <td className="py-1.5">
        {seeded ? (
          <div>
            <div className="text-[11px] leading-relaxed text-gray-200 print:text-black">
              {formatKpiValue(seeded)}
            </div>
            {seeded.provenance.notes && (
              <div className="mt-0.5 text-[9px] italic leading-relaxed text-gray-500 print:text-gray-600">
                {seeded.provenance.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] italic leading-relaxed text-gray-500 print:text-gray-600">
            (not seeded — partner KPI not relevant to this segment&apos;s
            north-star)
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Mental-model narratives ────────────────────────────────────────

function OemMentalModel({
  segment,
  oem,
}: {
  segment: Segment
  oem: Component
}) {
  return (
    <div className="space-y-2 text-[11px] leading-relaxed text-gray-200 print:text-black">
      <Bullet
        label="WHERE THE OEM OWNS"
        body={`L1 facility / chassis. ${oem.name} canonical seeded chassis; Lenovo / Supermicro / HPE equivalent per segment-grounding text.`}
      />
      <Bullet
        label="JOINT CO-SELL"
        body="NVIDIA + OEM joint-validation on reference designs; OEM ships pre-integrated, shortens deployment-cycle; OEM service-footprint carries post-sale. NVIDIA leads silicon + integrated stack; OEM leads chassis + service."
      />
      <Bullet
        label={`SEGMENT SLANT · ${segment.name}`}
        body={segmentOemSlant(segment)}
      />
    </div>
  )
}

function IsvMentalModel({
  segment,
  isv,
}: {
  segment: Segment
  isv: Component
}) {
  return (
    <div className="space-y-2 text-[11px] leading-relaxed text-gray-200 print:text-black">
      <Bullet
        label="WHERE THE ISV OWNS"
        body={`L3 ISV / orchestration. ${isv.name}${isv.category ? ` (${isv.category})` : ''} — vendor-agnostic by design.`}
      />
      <Bullet
        label="JOINT CO-SELL"
        body="NVIDIA + ISV joint-validation on NVAIE-integrated deployments; ISV carries operational + compliance + skills; NVIDIA leads silicon + ecosystem depth. ISV leads portability + compliance + skills-fit; NVIDIA leads performance + libraries."
      />
      <Bullet
        label={`SEGMENT SLANT · ${segment.name}`}
        body={segmentIsvSlant(segment)}
      />
    </div>
  )
}

function NeocloudMentalModel({ segment }: { segment: Segment }) {
  return (
    <div className="space-y-2 text-[11px] leading-relaxed text-gray-200 print:text-black">
      <Bullet
        label="THE WRAPS-THE-STACK MOTION"
        body="Neoclouds don't own a single layer — they wrap the integrated NVIDIA stack with multi-DC GPU-rental fleet + tenant tooling delivered as a rentable resource. Customer-AND-channel duality: massive NVIDIA buyer AND a go-to-market channel."
      />
      <Bullet
        label="JOINT CO-SELL · THE REVERSE FLOW"
        body="NVIDIA delivers integrated stack to neoclouds at allocation + roadmap level; neoclouds bring tenants. AND: reverse flow — neocloud-built tooling adopted INTO NVIDIA reference architectures."
      />
      {segment.customer_channel_note && (
        <div className="rounded border border-amber-500/40 bg-amber-500/8 p-2 print:border-amber-700 print:bg-amber-50">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-300 print:text-amber-800">
              CITED · the reverse-flow proof point
            </div>
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-mono font-semibold tracking-widest text-emerald-300 print:border-emerald-700 print:bg-emerald-50 print:text-emerald-800">
              CITED
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-200 print:text-black">
            {segment.customer_channel_note}
          </p>
        </div>
      )}
    </div>
  )
}

function Bullet({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/30 p-2 print:border-gray-300 print:bg-white">
      <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-gray-400 print:text-gray-700">
        {label}
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-300 print:text-black">
        {body}
      </p>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

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

function isvSubtitle(t: PartnerType, isv: Component): string | undefined {
  if (t === 'isv') return `ISV sub-target: ${isv.name}`
  if (t === 'oem')
    return 'OEM scoped to Dell XE9680 — Lenovo / Supermicro / HPE equivalent in text'
  return 'segment-locked to Neocloud · channel motion exists in this segment by definition'
}

function segmentOemSlant(s: Segment): string {
  switch (s.id) {
    case 'frontier-ai-labs':
      return 'frontier labs pre-commit capacity; OEM motion is allocation + tightly-coupled cluster delivery.'
    case 'hyperscalers':
      return 'multi-quarter committed-volume contracts; OEM motion is reference-design partnership at scale (with ODM mix).'
    case 'neocloud':
      return 'NVIDIA-integrated rack purchases (SuperPOD-class); OEM motion is rapid-deploy multi-DC fleet build-out.'
    case 'fortune-500':
      return 'production-ROI + compliance topology; OEM motion is regional service-footprint + Lenovo-equivalent flexibility, deployment-cycle is the differentiator.'
    case 'sovereign-ai':
      return 'in-country DC + local-OEM partnerships; OEM motion is jurisdiction-resident service + procurement-cycle navigation.'
    case 'industry-verticals':
      return 'edge + core mix (HGX + RTX PRO); OEM motion is vertical-certified chassis + domain-specific service.'
    default:
      return 'segment-specific OEM motion.'
  }
}

function segmentIsvSlant(s: Segment): string {
  switch (s.id) {
    case 'frontier-ai-labs':
      return 'frontier-lab teams build their own orchestration mostly; ISV motion is platform integration at smaller scale.'
    case 'hyperscalers':
      return 'hyperscaler-native orchestration dominates; ISV motion is partner-co-sell builds (Red Hat where compliance-oriented).'
    case 'neocloud':
      return 'neocloud-native tooling (e.g. CoreWeave SUNK); ISV motion is reduced — neoclouds self-build operations layer.'
    case 'fortune-500':
      return 'core ISV battleground — Red Hat / Nutanix / VMware all credible; ISV motion is enterprise-platform fit + compliance + skills for regulated buyers.'
    case 'sovereign-ai':
      return 'sovereign-cloud ISV is the air-gap + residency + portability axis; ISV motion is sovereignty-vetted platform.'
    case 'industry-verticals':
      return 'vertical-specific ISVs dominate (NVIDIA Clara / Omniverse / DRIVE / BioNeMo on top of Red Hat); ISV motion is domain-certified stack.'
    default:
      return 'segment-specific ISV motion.'
  }
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
