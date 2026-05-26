'use client'

import type { Component, Segment } from '@/lib/factory/kpi'
import type { PartnerType } from './partner-type-toggle'

// Co-Sell Motion Panel — brief partner-PM mental-model narrative per
// (partner-type × segment) pairing. Names the slot + the joint motion +
// where NVIDIA leads vs the partner leads.
//
// HONESTY DISCIPLINE:
//   · NOT authored sales claims
//   · NOT partner-vs-partner ranking
//   · NOT fabricated co-sell metrics
//   · For neocloud-as-channel: surfaces the seeded customer_channel_note
//     verbatim (the cited Jan 2026 CoreWeave SUNK / Mission Control
//     reference-architecture-integration fact) — no new claims layered on

interface Props {
  partnerType: PartnerType
  activeSegment: Segment
  oem: Component
  activeIsv: Component
}

export function CoSellMotionPanel({
  partnerType,
  activeSegment,
  oem,
  activeIsv,
}: Props) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          PARTNER-PM MENTAL MODEL  ·  the co-sell motion
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          How this partner type co-sells with NVIDIA in this segment. The
          partner-PM brain, named — not a sales pitch, not a ranking.
        </div>
      </header>
      <div className="p-5">
        {partnerType === 'oem' && <OemNarrative segment={activeSegment} oem={oem} />}
        {partnerType === 'isv' && <IsvNarrative segment={activeSegment} isv={activeIsv} />}
        {partnerType === 'neocloud' && <NeocloudNarrative segment={activeSegment} />}
      </div>
    </section>
  )
}

function OemNarrative({ segment, oem }: { segment: Segment; oem: Component }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-300">
      <Bullet
        label="WHERE THE OEM OWNS"
        body={
          <>
            L1 facility / chassis. {oem.name} is the canonical seeded chassis;
            Lenovo / Supermicro / HPE are common equivalents per the
            segment-grounding text (not seeded as Components here).
          </>
        }
      />
      <Bullet
        label="JOINT CO-SELL MOTION"
        body={
          <>
            NVIDIA + OEM joint-validation on{' '}
            <span className="font-mono text-[#76B900]">reference designs</span>{' '}
            (NVIDIA HGX-class, NVL72 rack-scale); OEM ships pre-integrated,
            shortens deployment-cycle; OEM service-footprint carries
            post-sale relationship. NVIDIA leads silicon + integrated stack;
            OEM leads chassis + service + (with ISV) deployment cycle.
          </>
        }
      />
      <Bullet
        label="WHAT VARIES BY SEGMENT"
        body={
          <>
            For{' '}
            <span className="font-mono text-[#76B900]">{segment.name}</span>:{' '}
            {segmentOemSlant(segment)}
          </>
        }
      />
    </div>
  )
}

function IsvNarrative({
  segment,
  isv,
}: {
  segment: Segment
  isv: Component
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-300">
      <Bullet
        label="WHERE THE ISV OWNS"
        body={
          <>
            L3 ISV / orchestration. {isv.name}
            {isv.category && (
              <span className="text-gray-500"> ({isv.category})</span>
            )}{' '}
            — vendor-agnostic by design (runs on NVIDIA or competitor silicon
            equally). The orchestration / platform layer is structurally
            flat across vendors; ISV value is in operational maturity +
            ecosystem fit, not silicon optimization.
          </>
        }
      />
      <Bullet
        label="JOINT CO-SELL MOTION"
        body={
          <>
            NVIDIA + ISV joint-validation on{' '}
            <span className="font-mono text-[#76B900]">NVAIE-integrated</span>{' '}
            deployments; ISV carries the operational + compliance + skills
            story; NVIDIA leads silicon + ecosystem depth (CUDA / TensorRT-LLM
            / FA3); together they deliver the deployment-cycle. ISV leads
            portability + compliance + skills-fit; NVIDIA leads performance +
            ecosystem libraries.
          </>
        }
      />
      <Bullet
        label="WHAT VARIES BY SEGMENT"
        body={
          <>
            For{' '}
            <span className="font-mono text-[#76B900]">{segment.name}</span>:{' '}
            {segmentIsvSlant(segment)}
          </>
        }
      />
    </div>
  )
}

function NeocloudNarrative({ segment }: { segment: Segment }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-300">
      <Bullet
        label="THE WRAPS-THE-STACK MOTION"
        body={
          <>
            Neoclouds don&apos;t own a single layer — they wrap the
            integrated NVIDIA stack with their own multi-DC GPU-rental fleet
            + tenant tooling, delivered as a rentable resource. The motion
            is{' '}
            <span className="italic">delivery + access</span>, not
            layer-specific build-out. Customer-AND-channel duality: massive
            NVIDIA buyer AND a go-to-market channel.
          </>
        }
      />
      <Bullet
        label="JOINT CO-SELL — THE REVERSE FLOW"
        body={
          <>
            NVIDIA delivers integrated stack to neoclouds at allocation +
            roadmap level; neoclouds bring tenants. BUT also reverse flow:
            neocloud-built tooling adopted INTO NVIDIA reference architectures.
          </>
        }
      />
      {segment.customer_channel_note && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="text-[10px] font-mono font-semibold tracking-widest text-amber-300">
            CITED · the reverse-flow proof point
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-200">
            {segment.customer_channel_note}
          </p>
        </div>
      )}
      <Bullet
        label="WHY SEGMENT-LOCKED"
        body={
          <>
            The neocloud-as-channel motion exists in the{' '}
            <span className="font-mono text-[#76B900]">Neocloud</span> segment
            by definition. Rendering across other segments would fabricate
            cross-segment relevance that doesn&apos;t exist (a sovereign or
            Fortune 500 customer doesn&apos;t engage a neocloud-as-channel
            motion — they engage NVIDIA + OEM + ISV directly).
          </>
        }
      />
    </div>
  )
}

function Bullet({
  label,
  body,
}: {
  label: string
  body: React.ReactNode
}) {
  return (
    <div className="rounded border border-gray-800/60 bg-gray-950/30 p-3">
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-300">{body}</p>
    </div>
  )
}

// ─── Segment-specific narrative shading ───────────────────────────────
// Brief one-line slant per segment — NOT a sales pitch, just naming the
// segment-specific texture of the co-sell motion. Sourced from seeded
// segment grounding (archetype + buying_behavior) — no new claims.

function segmentOemSlant(s: Segment): string {
  switch (s.id) {
    case 'frontier-ai-labs':
      return 'frontier labs pre-commit capacity; OEM motion is allocation + tightly-coupled cluster delivery, not standard order-to-rack.'
    case 'hyperscalers':
      return 'multi-quarter committed-volume contracts; OEM motion is reference-design partnership at scale (with ODM mix layered alongside).'
    case 'neocloud':
      return 'NVIDIA-integrated rack purchases (SuperPOD-class); OEM motion is rapid-deploy multi-DC fleet build-out.'
    case 'fortune-500':
      return 'production-ROI focus + compliance-oriented topology; OEM motion is regional service-footprint + Lenovo-equivalent flexibility, deployment-cycle is the differentiator.'
    case 'sovereign-ai':
      return 'in-country DC + local-OEM partnerships where global vendor permitted; OEM motion is jurisdiction-resident service + procurement-cycle navigation.'
    case 'industry-verticals':
      return 'edge + core mix (HGX + RTX PRO); OEM motion is vertical-certified chassis + domain-specific service.'
    default:
      return 'segment-specific OEM motion.'
  }
}

function segmentIsvSlant(s: Segment): string {
  switch (s.id) {
    case 'frontier-ai-labs':
      return 'frontier-lab teams build their own orchestration mostly; ISV motion is platform integration (Red Hat / VMware) at smaller scale than the lab\'s own stack.'
    case 'hyperscalers':
      return 'hyperscaler-native orchestration dominates; ISV motion is partner-co-sell builds (Red Hat where compliance-oriented), narrow vs the hyperscaler\'s own platforms.'
    case 'neocloud':
      return 'neocloud-native tooling (e.g. CoreWeave SUNK); ISV motion is reduced — neoclouds self-build operations layer.'
    case 'fortune-500':
      return 'core ISV battleground — Red Hat / Nutanix / VMware all credible; ISV motion is enterprise-platform fit + compliance-path + skills-fit for regulated buyers.'
    case 'sovereign-ai':
      return 'sovereign-cloud ISV is the air-gap + data-residency + portability axis; ISV motion is sovereignty-vetted platform + jurisdiction-resident operator skills.'
    case 'industry-verticals':
      return 'vertical-specific ISVs dominate (NVIDIA Clara / Omniverse / DRIVE / BioNeMo on top of Red Hat); ISV motion is domain-certified stack + safety-certification cadence.'
    default:
      return 'segment-specific ISV motion.'
  }
}
