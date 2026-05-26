'use client'

import { useState } from 'react'
import type {
  Component,
  KpiDefinition,
  KpiValue,
  Segment,
} from '@/lib/factory/kpi'
import { PartnerTypeToggle, type PartnerType } from './partner-type-toggle'
import { PartnerSlotDiagram } from './partner-slot-diagram'
import { PartnerKpiScorecard } from './partner-kpi-scorecard'
import { CoSellMotionPanel } from './co-sell-motion-panel'

// Partner Lens — the OEM / ISV / Neocloud-as-channel responsibility view.
//
// THREE partner types (NOT two — neocloud-as-channel is the third, grounded
// in the neocloud segment's customer-AND-channel duality + the cited Jan 2026
// CoreWeave SUNK / Mission Control reference-architecture-integration fact).
//
// PURPOSE: shows WHERE each partner type slots into the cake and WHAT
// operational KPIs they own per segment — about RESPONSIBILITY + FIT, not
// competitive verdicts. No partner-vs-partner ranking. No authored sales
// claims. The mental-model narrative is the partner-PM brain visualized,
// not a sales pitch.
//
// HONESTY DISCIPLINE:
//   · Tier-2 KPIs pull from segment.delivered_kpis via the segment-first
//     resolver (already-seeded provenance preserved)
//   · Unseeded KPI gaps render with explained framing — "this segment seeds
//     KPIs that matter for ITS north-star; partner KPIs not relevant to this
//     segment aren't seeded" — gaps as deliberate scoping, not missing data
//   · ops_compliance_audit_time labeled as the practical compliance proxy
//     (the ops_compliance_path catalog entry is defined but never seeded —
//     flagged as a dead definition to clean up later)
//   · Neocloud-as-channel is segment-LOCKED to the neocloud segment (does
//     NOT render across other segments — the motion only exists there by
//     definition, and N/A'ing it elsewhere would fabricate cross-segment
//     relevance that doesn't exist)
//   · OEM scoped to Dell (only seeded OEM component); "Lenovo / Supermicro
//     / HPE equivalent" framed in text — no fabricated per-OEM KPIs
//   · SI / distributor consciously OUT of scope (real motions, no seeded
//     data, not silently omitted)

export interface PartnerView {
  segments: Segment[]
  oem: Component
  isvs: Component[]
  // kpiByIdSegmentSeeded[kpiId][segmentId] = the seeded value, when present.
  // Drives both the scorecard's value resolution AND the gap detection.
  kpiByIdSegmentSeeded: Record<string, Record<string, KpiValue>>
  kpiDefById: Record<string, KpiDefinition>
}

interface Props {
  view: PartnerView
  defaultSegmentId: string
}

export function PartnerLensView({ view, defaultSegmentId }: Props) {
  const [partnerType, setPartnerType] = useState<PartnerType>('oem')
  const [selectedSegmentId, setSelectedSegmentId] = useState(defaultSegmentId)
  const [selectedIsvId, setSelectedIsvId] = useState(view.isvs[0].id)

  // Neocloud-as-channel is segment-locked to the neocloud segment.
  // Switching to neocloud mode auto-selects the neocloud segment; the
  // segment selector hides for this mode (the lock is explained in the
  // segment-context block instead of forcing N/A states across segments).
  const effectiveSegmentId =
    partnerType === 'neocloud' ? 'neocloud' : selectedSegmentId

  const activeSegment =
    view.segments.find((s) => s.id === effectiveSegmentId) ?? view.segments[0]

  const activeIsv = view.isvs.find((i) => i.id === selectedIsvId) ?? view.isvs[0]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Header />
      <PartnerTypeToggle
        partnerType={partnerType}
        onSelect={(t) => {
          setPartnerType(t)
          // Switching INTO neocloud mode forces segment to neocloud;
          // switching OUT keeps the user's prior segment choice intact.
          if (t === 'neocloud') {
            setSelectedSegmentId('neocloud')
          }
        }}
      />

      {/* OEM + ISV: segment selector + (ISV: sub-target selector) */}
      {partnerType !== 'neocloud' && (
        <div className="mt-6 space-y-3">
          <SegmentSelector
            segments={view.segments}
            selectedId={selectedSegmentId}
            onSelect={setSelectedSegmentId}
          />
          {partnerType === 'isv' && (
            <IsvSubTargetSelector
              isvs={view.isvs}
              selectedId={selectedIsvId}
              onSelect={setSelectedIsvId}
            />
          )}
        </div>
      )}

      {/* Neocloud: segment-lock explainer block (no selector) */}
      {partnerType === 'neocloud' && <NeocloudSegmentLockNote />}

      {/* Active context line */}
      <div className="mt-6 rounded-md border border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          ACTIVE CONTEXT
        </div>
        <div className="mt-1 text-sm text-gray-200">
          <span className="font-mono text-[#76B900]">
            {partnerTypeLabel(partnerType)}
          </span>
          <span className="text-gray-500"> · </span>
          <span className="font-mono text-[#76B900]">{activeSegment.name}</span>
          {partnerType === 'isv' && (
            <>
              <span className="text-gray-500"> · </span>
              <span className="font-mono text-[#76B900]">{activeIsv.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <PartnerSlotDiagram
          partnerType={partnerType}
          oem={view.oem}
          activeIsv={activeIsv}
        />
        <PartnerKpiScorecard
          partnerType={partnerType}
          activeSegment={activeSegment}
          kpiByIdSegmentSeeded={view.kpiByIdSegmentSeeded}
          kpiDefById={view.kpiDefById}
        />
        <CoSellMotionPanel
          partnerType={partnerType}
          activeSegment={activeSegment}
          oem={view.oem}
          activeIsv={activeIsv}
        />
      </div>

      <OutOfScopeFooter />
    </div>
  )
}

// ─── Header — names the lens purpose + scope ──────────────────────────
function Header() {
  return (
    <header className="mb-8">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        AI FACTORY · PARTNER LENS
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-gray-100">
        Partner Lens — responsibility + fit
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        Where each partner type slots into the AI factory cake, and what
        operational KPIs they own per segment. About{' '}
        <span className="font-mono text-[#76B900]">responsibility + fit</span>{' '}
        — not competitive verdicts, not partner-vs-partner ranking, not
        authored sales claims. The partner-PM mental model, visualized.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
        Three partner types in scope: OEM (system builders) · ISV (software /
        orchestration) · Neocloud-as-channel (GPU-rental clouds that are
        customer AND go-to-market). System integrators and distributors are
        real partner motions with no seeded data — consciously OUT of scope,
        not fabricated. See footer.
      </p>
    </header>
  )
}

// ─── Segment selector (OEM + ISV modes) ───────────────────────────────
function SegmentSelector({
  segments,
  selectedId,
  onSelect,
}: {
  segments: Segment[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          SEGMENT  ·  pick where this partner deploys
        </div>
      </div>
      <div className="grid grid-cols-2 divide-y divide-gray-800 md:grid-cols-3 md:divide-x lg:grid-cols-6 lg:divide-y-0">
        {segments.map((s) => {
          const selected = s.id === selectedId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`text-left px-3 py-2.5 transition-colors ${
                selected
                  ? 'bg-[#76B900]/10 border-l-2 border-l-[#76B900] md:border-l-0 md:border-b-2 md:border-b-[#76B900]'
                  : 'hover:bg-gray-900/60 border-l-2 border-l-transparent md:border-l-0 md:border-b-2 md:border-b-transparent'
              }`}
            >
              <div
                className={`text-xs font-semibold leading-tight ${
                  selected ? 'text-[#76B900]' : 'text-gray-300'
                }`}
              >
                {s.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── ISV sub-target selector (only in ISV mode) ───────────────────────
function IsvSubTargetSelector({
  isvs,
  selectedId,
  onSelect,
}: {
  isvs: Component[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          ISV  ·  pick which ISV
        </div>
      </div>
      <div className="grid grid-cols-2 divide-y divide-gray-800 md:grid-cols-4 md:divide-x md:divide-y-0">
        {isvs.map((i) => {
          const selected = i.id === selectedId
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onSelect(i.id)}
              className={`text-left px-3 py-2.5 transition-colors ${
                selected
                  ? 'bg-[#76B900]/10 border-l-2 border-l-[#76B900] md:border-l-0 md:border-b-2 md:border-b-[#76B900]'
                  : 'hover:bg-gray-900/60 border-l-2 border-l-transparent md:border-l-0 md:border-b-2 md:border-b-transparent'
              }`}
            >
              <div
                className={`text-xs font-semibold leading-tight ${
                  selected ? 'text-[#76B900]' : 'text-gray-300'
                }`}
              >
                {i.name}
              </div>
              {i.category && (
                <div
                  className={`mt-0.5 text-[9px] font-mono uppercase tracking-widest ${
                    selected ? 'text-[#76B900]/70' : 'text-gray-500'
                  }`}
                >
                  {i.category}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Neocloud segment-lock explainer (replaces segment selector in
//     neocloud mode — the channel motion only exists in the neocloud
//     segment by definition) ────────────────────────────────────────────
function NeocloudSegmentLockNote() {
  return (
    <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="text-[10px] font-mono tracking-widest text-amber-300">
        SEGMENT LOCKED  ·  Neocloud
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-300">
        Neocloud-as-channel is{' '}
        <span className="italic">structurally segment-locked</span> to the
        Neocloud segment — the partner-channel motion (customer AND go-to-
        market for NVIDIA) exists in this segment by definition. Rendering
        the lens across other segments would fabricate cross-segment
        relevance that doesn&apos;t exist. The motion is grounded in the
        seeded customer_channel_note (CoreWeave SUNK / Mission Control
        integrated into NVIDIA reference architectures, cited Jan 2026).
      </p>
    </div>
  )
}

// ─── Out-of-scope footer ──────────────────────────────────────────────
function OutOfScopeFooter() {
  return (
    <div className="mt-10 rounded-md border border-gray-800 bg-gray-950/40 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
      <span className="font-mono uppercase tracking-widest text-gray-600">
        out of scope ·{' '}
      </span>
      System integrators (Accenture, Deloitte, Tata, Wipro) and distributors
      (Arrow, TD SYNNEX, Ingram Micro) are real partner motions with no seeded
      data in this app — consciously left out rather than fabricated. Add them
      to a future build pass if/when the underlying KPI data is in place.
    </div>
  )
}

function partnerTypeLabel(t: PartnerType): string {
  if (t === 'oem') return 'OEM'
  if (t === 'isv') return 'ISV'
  return 'Neocloud-as-channel'
}
