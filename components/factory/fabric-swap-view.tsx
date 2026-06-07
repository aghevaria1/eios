'use client'

import { useState } from 'react'
import type { Component, SwapReport } from '@/lib/factory/kpi'
import { SwapReportCard } from './swap-report-card'
import {
  LayerFightMap,
  type CompetitorColor,
  type LayerVerdict,
} from './layer-fight-map'

export interface SwapTarget {
  component: Component
  report: SwapReport
}

interface Props {
  baseline: Component
  targets: SwapTarget[]
  defaultTargetId: string
}

export function FabricSwapView({ baseline, targets, defaultTargetId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultTargetId)
  const active =
    targets.find((t) => t.component.id === selectedId) ?? targets[0]
  const fightMap = buildFightMap(baseline, active.component)

  return (
    <div className="space-y-6">
      <TargetTabs
        targets={targets}
        selectedId={active.component.id}
        onSelect={setSelectedId}
      />
      {fightMap && (
        <LayerFightMap
          competitorName={fightMap.competitorName}
          competitorColor={fightMap.competitorColor}
          verdicts={fightMap.verdicts}
          narrative={fightMap.narrative}
        />
      )}
      <SwapReportCard
        baseline={baseline}
        target={active.component}
        report={active.report}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Fabric fight-map composition — three distinct competitive identities.
//
// All three fabric competitors share the SHAPE: 1 CONTESTED-SPLIT band
// (L2-fabric) + 4 AGNOSTIC bands (L2-gpu / L3 / L4 / L5) + 1 N/A band
// (L1). The AGNOSTIC shape encodes "we don't field offerings here but
// our open fabric frees these layers from NVIDIA lock-in" — a structural
// property of open Ethernet (Broadcom, Arista) and Cornelis's open
// multi-protocol approach.
//
// What DIFFERS across the three is the L2-fabric verdict's AXIS:
//
//   Cornelis  — PERFORMANCE + OPENNESS play.  Cornelis leads on vendor-
//               MPI-benchmarked HPC claims (35% latency, 2× msg-rate vs
//               InfiniBand NDR) + multi-protocol (Omni-Path + RoCEv2 +
//               future UEC). NVIDIA leads on integrated-scale collective
//               via SHARP+NCCL. MANDATORY CAVEATS: claims benchmarked
//               vs prior-gen NDR (not current Quantum-X800/XDR), and are
//               vendor MPI-microbenchmarks (not independent).
//
//   Broadcom  — SCALE + ECONOMICS + ENTRENCHMENT play.  Broadcom leads on
//               Scale-Up Ethernet (1024 nodes vs NVLink 72 ~14×), merchant-
//               silicon economics, and market position ($73B AI backlog;
//               Google/Meta/OpenAI wins). NVIDIA leads on integration +
//               in-network compute (SHARP). Real axis = DISAGGREGATED
//               merchant silicon vs INTEGRATED AI factory, not spec-for-
//               spec.
//
//   Arista    — OPERATIONAL-SYSTEMS + SOFTWARE-STICKINESS play.  Arista
//               BUILDS ON Broadcom silicon (7060X = Tomahawk 5; 7800R =
//               Jericho) — NOT a chip competitor. Arista leads on EOS
//               software stickiness, operational maturity (AI Analyzer,
//               MACsec), and proven hyperscaler-scale (~48% revenue from
//               cloud/AI; Meta + Microsoft anchors). NVIDIA leads on
//               integration + SHARP + GPU co-optimization.
//
// CROSS-COMPETITOR SYNTHESIS:
//   AMD       = REPLACE (substitute full stack — 3 contested layers)
//   Cornelis  = PERFORMANCE+OPENNESS (separate HPC identity, explicit pitch)
//   Broadcom  = SILICON / SCALE / ECONOMICS (layer-1 of layered Ethernet)
//   Arista    = SYSTEMS / EOS / HYPERSCALE-PROVEN (layer-2, builds on Broadcom)
//
// MACRO PRESSURE (named in Broadcom + Arista narratives):
//   Ethernet has now surpassed InfiniBand in AI back-end adoption
//   (Dell'Oro 2026) — reversal from InfiniBand's former ~80%. That's the
//   structural pressure on NVIDIA's fabric moat.
//
// NVIDIA Quantum-X800 = NVIDIA's own alternative fabric, not a competitor.
// Fight-map suppressed for that target — the swap-report alone is the
// relevant comparison.
// ────────────────────────────────────────────────────────────────────────

interface FightMapData {
  competitorName: string
  competitorColor: CompetitorColor
  verdicts: LayerVerdict[]
  narrative: string
}

function buildFightMap(
  baseline: Component,
  target: Component,
): FightMapData | null {
  switch (target.id) {
    case 'broadcom_jericho_tomahawk':
      return {
        competitorName: target.name,
        competitorColor: 'amber',
        verdicts: buildBroadcomVerdicts(baseline, target),
        narrative: BROADCOM_NARRATIVE,
      }
    case 'cornelis_cn6000':
      return {
        competitorName: target.name,
        competitorColor: 'purple',
        verdicts: buildCornelisVerdicts(baseline, target),
        narrative: CORNELIS_NARRATIVE,
      }
    case 'arista_ethernet':
      return {
        competitorName: target.name,
        competitorColor: 'cyan',
        verdicts: buildAristaVerdicts(baseline, target),
        narrative: ARISTA_NARRATIVE,
      }
    default:
      return null
  }
}

// ─── Shared AGNOSTIC bands (L2-gpu, L3, L4, L5) ──────────────────────
// All 3 open-fabric competitors share the same structural openness above
// L2-fabric. The freedom + optimizationTradeoff content is largely
// shared; the competitor positioning string varies (Cornelis explicit
// pitch vs Broadcom/Arista implicit via disaggregation philosophy).
type OpennessPitch = 'explicit' | 'implicit-merchant-silicon' | 'implicit-open-ethernet-eos'

function pitchPrefix(pitch: OpennessPitch): string {
  switch (pitch) {
    case 'explicit':
      return 'Explicit GPU-agnostic + multi-protocol pitch — '
    case 'implicit-merchant-silicon':
      return 'Implicit via merchant-silicon disaggregation — '
    case 'implicit-open-ethernet-eos':
      return 'Implicit via open-Ethernet + EOS philosophy — '
  }
}

function buildOpenStackBands(pitch: OpennessPitch): LayerVerdict[] {
  const prefix = pitchPrefix(pitch)
  return [
    {
      layerId: 'L5',
      layerName: 'Ecosystem (libs · platform depth)',
      state: {
        kind: 'agnostic',
        freedom: [
          `${prefix}no ecosystem lock-in`,
          'CUDA OR ROCm OR mixed — customer chooses',
          'Free to use any open-source ML library/runtime',
          'No NVIDIA platform-depth gravity (CUDA-first defaults, NeMo, NIM, NVAIE wrapper)',
        ],
        optimizationTradeoff: [
          '~20 years of compounding CUDA ecosystem (cuDNN, cuBLAS, TensorRT, Triton, NeMo, NIM)',
          'CUDA-exclusive libraries (TensorRT-LLM, FlashAttention 3) deliver real performance — FA3 absence costs ~30-40% training throughput on 7B+ models per Spheron 2026',
          'NCCL collective communication — no ROCm equivalent',
          'CUDA-first defaults in new ML research / tooling',
        ],
      },
      shortLabel: 'AGNOSTIC / OPEN — any ecosystem, no NVIDIA gravity',
      evidence:
        'Fabric vendor — no ecosystem play. The competitor ships a switch + NOS, not an ML library stack. Their openness frees ecosystem choice from NVIDIA pull, but NVIDIA\'s 20-year CUDA depth is real performance you give up when going open.',
    },
    {
      layerId: 'L4',
      layerName: 'Software (frameworks · microservices)',
      state: {
        kind: 'agnostic',
        freedom: [
          `${prefix}no framework / runtime lock-in`,
          'Any framework: PyTorch / vLLM / SGLang / FlashInfer / llama.cpp',
          'Any runtime: NVIDIA OR AMD OR mixed compute',
          'No CUDA / NVAIE-tuned-stack lock-in',
        ],
        optimizationTradeoff: [
          'NVIDIA NIM (microservices) + Nemotron (foundation models) + Dynamo (orchestration) + NeMo Guardrails — NVIDIA-proprietary, no open equivalent',
          'TensorRT-LLM optimized inference (CUDA-only)',
          'NVIDIA-tuned mainstream inference performance (compute-bound workloads favor H100/B200 on CUDA)',
          'NCCL + collective acceleration tightly integrated with CUDA',
        ],
      },
      shortLabel: 'AGNOSTIC / OPEN — any framework, no CUDA/NVAIE lock-in',
      evidence:
        'Fabric vendor — no ML software stack. Frameworks run unchanged on the host regardless of fabric. The competitor\'s openness frees framework/runtime choice; NVIDIA\'s integrated CUDA-optimized stack delivers real performance lost when going open.',
    },
    {
      layerId: 'L3',
      layerName: 'ISV / orchestration',
      state: {
        kind: 'agnostic',
        freedom: [
          `${prefix}no orchestration lock-in`,
          'Red Hat OpenShift AI / VMware Private AI Foundation / Nutanix Enterprise AI / VAST Data — all vendor-agnostic',
          'No NVAIE-tuned orchestration patterns; ops can stay vendor-neutral',
          'Cross-vendor portability of operational tooling preserved',
        ],
        optimizationTradeoff: [
          'NVIDIA NIM / Dynamo integration with NVAIE-tuned orchestration delivers tighter end-to-end control',
          'NVIDIA-specific operational integrations (e.g. GPU Operator on Kubernetes, fleet-management tooling) are mature',
          'Pre-tuned NVIDIA reference designs from Dell / HPE / Supermicro for the integrated stack',
        ],
      },
      shortLabel: 'AGNOSTIC / OPEN — orchestration vendor-neutral',
      evidence:
        'Fabric vendor — no ISV / orchestration offering. Red Hat / VMware / Nutanix / VAST sit above the fabric and are vendor-agnostic anyway. The openness extends to keeping orchestration patterns vendor-neutral (not NVAIE-tuned); NVIDIA\'s integrated orchestration delivers real operational tooling depth that the open path forgoes.',
    },
    {
      layerId: 'L2-gpu',
      layerName: 'GPU (compute silicon)',
      state: {
        kind: 'agnostic',
        freedom: [
          `${prefix}no GPU vendor lock-in`,
          'NVIDIA H100/B200 OR AMD MI300X/MI355X OR mixed-vendor',
          'No NVLink-domain-only constraint on GPU choice',
          'Customer free to follow GPU price/perf/availability without re-architecting the network',
        ],
        optimizationTradeoff: [
          'NVIDIA H100/B200 tightly co-optimized with NVLink + Spectrum-X + SHARP + NCCL',
          'NVLink scale-up domain (72 GPUs) delivers tighter integration than Ethernet at small/mid scale',
          'GPU-driver / fabric-firmware integration is hard to replicate when mixing vendors',
          'NVIDIA reference-platform certifications cover the integrated stack end-to-end',
        ],
      },
      shortLabel: 'AGNOSTIC / OPEN — any GPU vendor',
      evidence:
        'Fabric vendor — does not make GPUs. Open Ethernet lets any GPU sit behind it. The openness frees GPU choice; NVIDIA\'s integrated NVLink + Spectrum-X + SHARP + NCCL stack delivers real co-optimization that mixed-vendor deployments give up.',
    },
  ]
}

// ─── L1 N/A — shared across all fabric competitors ─────────────────
function l1NotApplicable(): LayerVerdict {
  return {
    layerId: 'L1',
    layerName: 'Facility (land · power · shell)',
    state: { kind: 'n/a' },
    shortLabel: 'not contested',
    evidence:
      'Fabric vendor — point-solution, no datacenter offering and no opinion about facilities. Same Dell / colo / hyperscale patterns either way; not the competitor\'s play.',
  }
}

// ─── Cornelis CN6000 — PERFORMANCE + OPENNESS play ───────────────────
function buildCornelisVerdicts(
  baseline: Component,
  target: Component,
): LayerVerdict[] {
  const openStack = buildOpenStackBands('explicit')
  const l2Fabric: LayerVerdict = {
    layerId: 'L2-fabric',
    layerName: 'Networking (the fabric sub-slot)',
    state: {
      kind: 'contested',
      winner: 'split',
      strength: 'moderate',
      nuance: 'vendor-benchmarked vs prior-gen NVIDIA · scale-conditional',
      competitorAxis: [
        '35% lower latency vs InfiniBand NDR (CLAIMED — vendor MPI Benchmarks on EPYC 9334)',
        '2× message rate vs InfiniBand NDR (CLAIMED — same vendor MPI methodology)',
        '6× faster collective comms vs RoCE (CLAIMED — NOT vs SHARP-accelerated collectives)',
        '~30% application-perf improvement from network swap (CLAIMED)',
        'CN6000: 1.6B msg/sec MPI-style, 800G per port (pre-production)',
        'Multi-protocol on one platform: Omni-Path + RoCEv2 + future UEC',
      ],
      nvidiaAxis: [
        'SHARP v4 in-network compute + NCCL = large-scale integrated collective performance',
        'Quantum-X800 (XDR, 800G) — current shipping generation',
        'Deployed maturity at hyperscale today',
        'GPU co-optimization tightly integrated end-to-end',
        'Reference designs (Dell / HPE / Supermicro) cover integrated NVIDIA fabric + compute',
      ],
    },
    shortLabel: 'CONTESTED · SPLIT — Cornelis on HPC perf (claimed) · NVIDIA on integrated-scale',
    evidence:
      'Each side leads its own axis — NOT a single winner. Cornelis leads on vendor-MPI-benchmarked HPC performance claims + multi-protocol flexibility. NVIDIA leads on integrated large-scale collective performance + deployed maturity. The CRITICAL framing: Cornelis claims are benchmarked vs InfiniBand NDR (prior generation, 400G), NOT yet vs current Quantum-X800 / XDR + SHARP v4. And they\'re vendor MPI-microbenchmarks (Cornelis\'s own setup, not independent — 6× collective is vs RoCE, NOT vs SHARP).',
    pointers: [
      '⚠ CAVEAT 1 (mandatory framing): all benchmark claims are vs InfiniBand NDR (400G, prior-generation). NVIDIA\'s current fabric is Quantum-X800 (XDR, 800G) + SHARP v4 — the 35% / 2× / 6× figures are NOT benchmarked against current NVIDIA best. Comparing them to NDR is a partial-generation mismatch.',
      '⚠ CAVEAT 2 (mandatory framing): figures are Cornelis\'s own MPI-microbenchmarks, not independent. The 6× collective is vs RoCE, NOT vs SHARP-accelerated collectives — apples-to-oranges if read as "Cornelis 6× NVIDIA."',
      '800 G throughput parity (CITED both sides) — Cornelis pre-production',
      'Multi-protocol: Omni-Path + RoCEv2 + future UEC on one platform — open-interconnect flexibility',
    ],
    sourceRef: `Vendor: Cornelis launch materials, Network World, HPCwire, businesswire (2026). See ${target.id}.kpi_values + ${baseline.id}.kpi_values for seeded provenance. The two caveats are mandatory framing — without them, crediting Cornelis's claimed lead would overclaim.`,
  }
  return assembleFabricVerdicts(openStack, l2Fabric)
}

// ─── Broadcom Tomahawk Ultra — SCALE + ECONOMICS + ENTRENCHMENT ──────
function buildBroadcomVerdicts(
  baseline: Component,
  target: Component,
): LayerVerdict[] {
  const openStack = buildOpenStackBands('implicit-merchant-silicon')
  const l2Fabric: LayerVerdict = {
    layerId: 'L2-fabric',
    layerName: 'Networking (the fabric sub-slot)',
    state: {
      kind: 'contested',
      winner: 'split',
      strength: 'moderate',
      nuance: 'disaggregated merchant silicon vs integrated AI factory',
      competitorAxis: [
        'Scale-Up Ethernet: 1024 nodes vs NVLink 72 (~14× scale-up domain advantage — CITED, Broadcom-published)',
        'Merchant-silicon economics: Tomahawk/Jericho dominate merchant Ethernet at high bandwidth, low cost (CITED)',
        'Market entrenchment: $73B AI backlog, 106% YoY AI revenue (CITED, analyst/financial)',
        'Hyperscaler design wins: Google, Meta, OpenAI (CITED)',
        'Tomahawk 6 = 102.4 Tbps (first generation shipping, CITED)',
        '250 ns per-hop latency CITED — rare specific published figure',
      ],
      nvidiaAxis: [
        'Integration + full-stack control (silicon + fabric + software + ecosystem from one vendor)',
        'SHARP in-network compute — collective acceleration in-fabric',
        'GPU co-optimization: NVLink + Spectrum-X + SHARP + NCCL tuned end-to-end',
        'NVLink-72 domain delivers tighter integration over smaller scale than Broadcom\'s 1024 over Ethernet',
        'Deployed reference designs end-to-end (Dell / HPE / Supermicro)',
      ],
    },
    shortLabel: 'CONTESTED · SPLIT — Broadcom on scale/cost/entrenchment · NVIDIA on integration',
    evidence:
      'Each side leads its own axis — NOT a single winner. Broadcom leads on scale-up domain (1024-node Scale-Up Ethernet vs NVLink\'s 72 — ~14×), merchant-silicon economics, and market entrenchment ($73B AI backlog with Google/Meta/OpenAI wins). NVIDIA leads on integration + in-network compute via SHARP + full-stack control. The real axis is DISAGGREGATED merchant silicon vs INTEGRATED AI factory — different business models with partial overlap, NOT spec-for-spec.',
    pointers: [
      'Framing axis: Broadcom sells COMPONENTS (merchant silicon, customer assembles the stack); NVIDIA sells the INTEGRATED AI factory (full-stack control)',
      '800 G throughput parity (CITED both sides) — not a Broadcom-specific differentiator',
      '77 BPPS packet rate CITED — packet rate, NOT comparable to Cornelis MPI msg/sec methodology',
      'Layered Ethernet ecosystem: Broadcom is the SILICON LAYER; Arista (systems / EOS) builds on top; hyperscalers deploy. Macro: Ethernet has now surpassed InfiniBand in AI back-end adoption (Dell\'Oro 2026) — structural pressure on NVIDIA\'s fabric moat.',
    ],
    sourceRef: `Vendor + analyst: SDxCentral, SiliconANGLE, theCUBE, Motley Fool, Dell'Oro (2026). See ${target.id}.kpi_values + ${baseline.id}.kpi_values for seeded provenance.`,
  }
  return assembleFabricVerdicts(openStack, l2Fabric)
}

// ─── Arista 7800R4 / 7700R4 — OPERATIONAL + EOS + HYPERSCALE-PROVEN ──
function buildAristaVerdicts(
  baseline: Component,
  target: Component,
): LayerVerdict[] {
  const openStack = buildOpenStackBands('implicit-open-ethernet-eos')
  const l2Fabric: LayerVerdict = {
    layerId: 'L2-fabric',
    layerName: 'Networking (the fabric sub-slot)',
    state: {
      kind: 'contested',
      winner: 'split',
      strength: 'moderate',
      nuance: 'chassis built on Broadcom silicon · operational + software play',
      competitorAxis: [
        'EOS software stickiness — network engineers trained on it; operational reluctance to rip-and-replace (CITED)',
        'Hyperscaler trust: ~48% revenue from cloud/AI; Meta + Microsoft anchors (CITED)',
        'Etherlink scale: 100,000s of XPUs supported; 7700R DES = 30,000+ accelerators/domain (CITED)',
        'AI Analyzer telemetry + MACsec encryption-everywhere on EOS (CITED features)',
        '800 G throughput parity (CITED) + 10.8 BPPS per-line-card (CITED, packet rate)',
        'Pitch: "GPUs sit idle if the network underperforms — EOS + operational excellence ensure job completion at scale"',
      ],
      nvidiaAxis: [
        'Integration + full-stack control (silicon + fabric + software + ecosystem from one vendor)',
        'SHARP in-network compute — collective acceleration in-fabric',
        'GPU co-optimization: tighter end-to-end control with NVLink + Spectrum-X + NCCL',
        'Mature deployed collective acceleration at hyperscale',
        'Reference designs end-to-end (Dell / HPE / Supermicro)',
      ],
    },
    shortLabel: 'CONTESTED · SPLIT — Arista on operational/EOS · NVIDIA on integration',
    evidence:
      'Each side leads its own axis — NOT a single winner. Arista BUILDS ON Broadcom silicon (7060X = Tomahawk 5; 7800R = Jericho) — does NOT compete on the chip. Arista leads on EOS software stickiness, operational maturity (AI Analyzer telemetry, MACsec), and proven hyperscaler-scale deployment. NVIDIA leads on integration + in-network compute via SHARP + GPU co-optimization. The axis is OPERATIONAL-SYSTEMS / SOFTWARE-STICKINESS / PROVEN-AT-HYPERSCALE — different from spec-vs-spec.',
    pointers: [
      '⚠ STACK NOTE: Arista chassis BUILD ON Broadcom merchant silicon (7060X = Tomahawk 5; 7800R = Jericho) — silicon-customer, not silicon-competitor.',
      'Per-hop latency: NO published figure (HONEST ABSENCE — unlike Broadcom\'s cited 250 ns). Latency-sensitive workloads need vendor engagement.',
      '800 G throughput parity (CITED) — matches NVIDIA SN5600 and Broadcom Tomahawk Ultra; not an Arista port-level differentiator',
      'Layered Ethernet ecosystem: Arista is the SYSTEMS / SOFTWARE LAYER — builds on Broadcom silicon, deployed by hyperscalers. Macro: Ethernet has now surpassed InfiniBand in AI back-end adoption (Dell\'Oro 2026) — structural pressure on NVIDIA\'s fabric moat.',
    ],
    sourceRef: `Vendor + analyst: SDxCentral, SiliconANGLE, theCUBE, Motley Fool, Network World, businesswire (2026). See ${target.id}.kpi_values + ${baseline.id}.kpi_values for seeded provenance.`,
  }
  return assembleFabricVerdicts(openStack, l2Fabric)
}

// Order: L5 → L4 → L3 → L2-gpu → L2-fabric → L1.
// openStack returns [L5, L4, L3, L2-gpu] in that order.
function assembleFabricVerdicts(
  openStack: LayerVerdict[],
  l2Fabric: LayerVerdict,
): LayerVerdict[] {
  return [...openStack, l2Fabric, l1NotApplicable()]
}

// ─── Narratives (per competitor) ─────────────────────────────────────
// Each names the competitor's specific winning axis, NVIDIA's
// integration edge, and the cross-competitor identity (REPLACE vs
// PERFORMANCE+OPENNESS vs SCALE/ECONOMICS vs OPERATIONAL/EOS).
// Broadcom + Arista name the layered-Ethernet-ecosystem positioning +
// the Dell'Oro macro (Ethernet surpassed InfiniBand in AI back-end).

const CORNELIS_NARRATIVE =
  'Cornelis CN6000 is a PERFORMANCE + OPENNESS fight (HPC-tuned + multi-protocol). At L2-fabric the verdict is SPLIT BY AXIS — Cornelis leads on vendor-MPI-benchmarked latency / msg-rate / collective claims vs InfiniBand NDR (mandatory caveats: benchmarked vs prior-gen, not current Quantum-X800 / XDR + SHARP v4; vendor-microbenchmark scope), NVIDIA leads on integrated large-scale collective performance via SHARP + NCCL and deployed maturity. Above the fabric Cornelis is AGNOSTIC at L2-gpu / L3 / L4 / L5 — explicit GPU-agnostic + multi-protocol pitch frees those layers from NVIDIA lock-in, with the real optimization tradeoff that NVIDIA\'s integrated CUDA / NCCL / SHARP stack is real performance. L1 N/A (no facility play). Cornelis is a SEPARATE identity from the merchant-Ethernet ecosystem (Broadcom + Arista) — purpose-built HPC fabric. Customer-dependent — depends what you optimize for.'

const BROADCOM_NARRATIVE =
  'Broadcom Tomahawk Ultra is a SCALE + ECONOMICS + ENTRENCHMENT fight — NOT spec-vs-spec. At L2-fabric the verdict is SPLIT BY AXIS — Broadcom leads on Scale-Up Ethernet (1024-node domain vs NVLink\'s 72 — ~14×), merchant-silicon economics, and $73B AI backlog with Google / Meta / OpenAI wins; NVIDIA leads on integration + in-network compute via SHARP + full-stack control. Above the fabric Broadcom is AGNOSTIC at L2-gpu / L3 / L4 / L5 — implicit via merchant-silicon disaggregation philosophy, which frees those layers from NVIDIA lock-in with the real optimization tradeoff that NVIDIA\'s integrated stack delivers real co-optimization. L1 N/A. Broadcom is the SILICON LAYER of a layered Ethernet ecosystem — Arista (systems / EOS) and hyperscalers (deployment) build on top. Macro pressure: Ethernet has now surpassed InfiniBand in AI back-end adoption (Dell\'Oro 2026) — reversal from InfiniBand\'s former ~80%. That\'s the structural pressure on NVIDIA\'s fabric moat. Customer-dependent — different business models, not a single winner.'

const ARISTA_NARRATIVE =
  'Arista 7800R4 / 7700R4 Etherlink is an OPERATIONAL-SYSTEMS + SOFTWARE-STICKINESS fight — NOT a chip race (Arista BUILDS ON Broadcom silicon: 7060X = Tomahawk 5; 7800R = Jericho). At L2-fabric the verdict is SPLIT BY AXIS — Arista leads on EOS software stickiness, operational maturity (AI Analyzer telemetry, MACsec), and proven hyperscaler-scale deployment (~48% revenue from cloud/AI; Meta + Microsoft anchors); NVIDIA leads on integration + in-network compute via SHARP + GPU co-optimization. Above the fabric Arista is AGNOSTIC at L2-gpu / L3 / L4 / L5 — implicit via open-Ethernet + EOS philosophy, freeing those layers from NVIDIA lock-in with the real optimization tradeoff. L1 N/A. Arista is the SYSTEMS / SOFTWARE LAYER of a layered Ethernet ecosystem — builds on Broadcom silicon, deployed by hyperscalers. Macro pressure: Ethernet has now surpassed InfiniBand in AI back-end adoption (Dell\'Oro 2026) — structural pressure on NVIDIA\'s fabric moat. Customer-dependent — different axes, not a single winner.'

function TargetTabs({
  targets,
  selectedId,
  onSelect,
}: {
  targets: SwapTarget[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          SWAP TARGET
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Each tab is a fabric-slot swap target. Switching recomposes the
          report instantly from the pre-resolved engine output — no fetch,
          no LLM.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-4 md:divide-x md:divide-y-0">
        {targets.map((t) => {
          const selected = t.component.id === selectedId
          const vendor = t.component.vendor ?? 'unknown'
          const generation = t.component.generation
          return (
            <button
              key={t.component.id}
              type="button"
              onClick={() => onSelect(t.component.id)}
              className={[
                'text-left px-4 py-3 transition-colors',
                selected ? 'bg-[#76B900]/10' : 'hover:bg-gray-900/60',
                selected
                  ? 'border-l-2 border-l-[#76B900] md:border-l-0 md:border-b-2 md:border-b-[#76B900]'
                  : 'border-l-2 border-l-transparent md:border-l-0 md:border-b-2 md:border-b-transparent',
              ].join(' ')}
            >
              <div
                className={`text-sm font-semibold leading-tight ${
                  selected ? 'text-[#76B900]' : 'text-gray-300'
                }`}
              >
                {t.component.name}
              </div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest">
                <span
                  className={selected ? 'text-[#76B900]/70' : 'text-gray-500'}
                >
                  {vendor}
                </span>
                {generation && (
                  <span
                    className={selected ? 'text-[#76B900]/50' : 'text-gray-600'}
                  >
                    {' · '}
                    {generation}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
