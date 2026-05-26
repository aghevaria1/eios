'use client'

import type { Component } from '@/lib/factory/kpi'
import type { PartnerType } from './partner-type-toggle'

// Partner Slot Diagram — highlights which layer the partner OWNS in the
// AI factory cake. Simplified 5-layer band diagram (not the full
// AIFactoryCake — too much detail; this is a focused responsibility
// diagram, not a cake render).
//
// OEM mode      · L1 facility/chassis highlighted (Dell — Lenovo/Supermicro/
//                 HPE equivalent in text)
// ISV mode      · L3 orchestration highlighted (orchestration ISVs) OR L3-
//                 storage highlighted (storage ISVs like VAST)
// Neocloud mode · "Wraps the stack" treatment — no single owned layer; the
//                 neocloud envelops the stack with its tooling adopted into
//                 NVIDIA reference architectures (per the CoreWeave SUNK
//                 customer_channel_note)

interface Props {
  partnerType: PartnerType
  oem: Component       // Dell XE9680 (only seeded OEM component)
  activeIsv: Component // currently selected ISV
}

export function PartnerSlotDiagram({
  partnerType,
  oem,
  activeIsv,
}: Props) {
  if (partnerType === 'neocloud') {
    return <NeocloudWrapsStackDiagram />
  }
  return (
    <FiveLayerDiagram
      partnerType={partnerType}
      oem={oem}
      activeIsv={activeIsv}
    />
  )
}

// ─── OEM + ISV: standard 5-layer band diagram with one layer owned ────
function FiveLayerDiagram({
  partnerType,
  oem,
  activeIsv,
}: {
  partnerType: 'oem' | 'isv'
  oem: Component
  activeIsv: Component
}) {
  const layers = buildLayers(partnerType, oem, activeIsv)
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          RESPONSIBILITY BOUNDARY  ·  which layer the partner owns
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Cake-reuse slot diagram. The{' '}
          <span className="font-mono text-[#76B900]">highlighted band</span>{' '}
          is the partner-owned layer; others are{' '}
          <span className="font-mono text-gray-300">
            NVIDIA + adjacent partner
          </span>
          {' '}roles.
        </div>
      </header>
      <div className="divide-y divide-gray-800">
        {layers.map((l) => (
          <LayerBand key={l.id} layer={l} />
        ))}
      </div>
    </section>
  )
}

interface LayerEntry {
  id: string
  label: string
  owner: string
  description: string
  owned: boolean
}

function buildLayers(
  partnerType: 'oem' | 'isv',
  oem: Component,
  activeIsv: Component,
): LayerEntry[] {
  return [
    {
      id: 'L5',
      label: 'L5 · Ecosystem',
      owner: 'NVIDIA',
      description:
        'NVAIE + CUDA-rooted ecosystem (TensorRT-LLM, FlashAttention, NCCL, NeMo, NIM)',
      owned: false,
    },
    {
      id: 'L4',
      label: 'L4 · Software',
      owner: 'NVIDIA',
      description:
        'NIM / Nemotron / Dynamo / NeMo Guardrails — NVIDIA-proprietary microservices',
      owned: false,
    },
    {
      id: 'L3',
      label: 'L3 · ISV / Orchestration',
      owner: partnerType === 'isv' ? activeIsv.name : 'ISV (vendor-agnostic)',
      description:
        partnerType === 'isv'
          ? `${activeIsv.name} — ${activeIsv.category ?? 'platform'}; orchestration vendor-agnostic by design`
          : 'Red Hat OpenShift AI / VMware Private AI / Nutanix Enterprise AI / VAST Data — vendor-agnostic, present in all stacks',
      owned: partnerType === 'isv',
    },
    {
      id: 'L2',
      label: 'L2 · GPU + Fabric',
      owner: 'NVIDIA',
      description:
        'NVIDIA silicon (B200 / GB200 / Rubin) + Spectrum-X / Quantum-X800 / NVLink',
      owned: false,
    },
    {
      id: 'L1',
      label: 'L1 · Facility / Chassis',
      owner:
        partnerType === 'oem'
          ? `${oem.name} (Lenovo / Supermicro / HPE equivalent in segment-typical builds)`
          : 'OEM chassis + DC patterns',
      description:
        partnerType === 'oem'
          ? `${oem.name} is the canonical seeded OEM chassis. Lenovo / Supermicro / HPE are common equivalents per segment-grounding text but not seeded as Component entries here.`
          : 'Dell PowerEdge XE9680 chassis + DC / colo / hyperscale facility patterns',
      owned: partnerType === 'oem',
    },
  ]
}

function LayerBand({ layer }: { layer: LayerEntry }) {
  const owned = layer.owned
  return (
    <div
      className={`px-5 py-3 ${
        owned
          ? 'bg-[#76B900]/10 border-l-2 border-l-[#76B900]'
          : 'bg-gray-900/40 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div
          className={`text-sm font-semibold ${
            owned ? 'text-[#9FD848]' : 'text-gray-200'
          }`}
        >
          {layer.label}
        </div>
        <div
          className={`text-[10px] font-mono uppercase tracking-widest ${
            owned ? 'text-[#76B900]' : 'text-gray-500'
          }`}
        >
          {owned ? 'PARTNER OWNS' : 'NVIDIA + adjacent'} · {layer.owner}
        </div>
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-gray-400">
        {layer.description}
      </div>
    </div>
  )
}

// ─── Neocloud mode: "wraps the stack" treatment ──────────────────────
function NeocloudWrapsStackDiagram() {
  return (
    <section className="overflow-hidden rounded-md border border-amber-500/30 bg-gray-900/30">
      <header className="border-b border-amber-500/30 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-amber-300">
          RESPONSIBILITY BOUNDARY  ·  neocloud wraps the stack
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Neocloud-as-channel is{' '}
          <span className="italic">structurally different</span> from OEM /
          ISV — there&apos;s no single owned layer. The neocloud envelops
          the integrated NVIDIA stack with its own deployment infrastructure
          + tenant tooling, which can then be adopted INTO NVIDIA reference
          architectures (cf. CoreWeave SUNK / Mission Control, Jan 2026).
        </div>
      </header>

      <div className="relative px-5 py-6">
        {/* Outer envelope band representing "wraps" */}
        <div className="rounded-md border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
            NEOCLOUD ENVELOPE
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">
            Multi-DC GPU-rental fleet + deployment infrastructure + tenant
            orchestration tooling (e.g. CoreWeave SUNK + Mission Control).
            Wraps the integrated NVIDIA stack delivered as a rentable resource.
          </p>

          {/* Inner stack — the integrated NVIDIA stack the neocloud delivers */}
          <div className="mt-3 divide-y divide-gray-800 rounded border border-gray-800 bg-gray-950/40">
            {[
              { id: 'L5', label: 'L5 · NVAIE / CUDA ecosystem' },
              { id: 'L4', label: 'L4 · NIM / Nemotron / Dynamo' },
              { id: 'L3', label: 'L3 · Orchestration (vendor-agnostic ISVs)' },
              { id: 'L2', label: 'L2 · NVIDIA GPU + Spectrum-X / NVLink' },
              { id: 'L1', label: 'L1 · Dell XE9680 + multi-DC facility' },
            ].map((band) => (
              <div
                key={band.id}
                className="flex items-baseline justify-between gap-2 px-3 py-2"
              >
                <div className="text-[11px] text-gray-300">{band.label}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                  NVIDIA stack
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-[10px] italic leading-relaxed text-amber-100/80">
          Reverse-flow signal: neocloud tooling adopted INTO NVIDIA reference
          architectures (Jan 2026 — CoreWeave SUNK / Mission Control). The
          channel motion goes both ways — neocloud delivers NVIDIA + NVIDIA
          adopts neocloud-tooling. That&apos;s the customer-AND-channel
          duality made concrete.
        </div>
      </div>
    </section>
  )
}
