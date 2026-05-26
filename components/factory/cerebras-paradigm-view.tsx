'use client'

import type { Component } from '@/lib/factory/kpi'
import {
  LayerFightMap,
  type LayerVerdict,
} from './layer-fight-map'
import { ParadigmContrast, type VerdictFacet } from './paradigm-contrast'

interface Props {
  cerebras: Component
}

export function CerebrasParadigmView({ cerebras }: Props) {
  const verdicts = buildParadigmVerdicts()
  return (
    <div className="space-y-6">
      <ThesisLine />
      <LayerFightMap
        competitorName={cerebras.name}
        competitorColor="purple" /* unused for PARADIGM bands — every band uses indigo */
        verdicts={verdicts}
        narrative={CEREBRAS_NARRATIVE}
      />
      <ParadigmContrast
        competitorName={cerebras.name}
        nvidia={NVIDIA_ARCH}
        competitor={CEREBRAS_ARCH}
        facets={VERDICT_FACETS}
        sourceRef={`See ${cerebras.id}.paradigm_wafer_architecture / paradigm_inference_claims / paradigm_market_position for seeded values + provenance pills. Inference claims carry mandatory verify-needed + workload-specific caveat; market position carries mandatory scale-check (NVIDIA ~90% share + ~423× revenue ratio).`}
      />
    </div>
  )
}

// ─── Thesis line (parallel to AMD's DiagonalFramingLine) ──────────────
function ThesisLine() {
  return (
    <section className="rounded-md border border-indigo-500/30 bg-gray-900/40 p-5">
      <div className="text-[10px] font-mono tracking-widest text-indigo-300">
        THESIS  ·  alternative paradigm — not a stack swap
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-200">
        Cerebras WSE-3 does <span className="font-mono text-indigo-300">not decompose</span>{' '}
        into NVIDIA&apos;s L1-L5 layers. It&apos;s a single 900,000-core wafer
        with 4 trillion transistors, ~21 PB/s on-chip bandwidth, and NO
        inter-chip communication latency. Adopting it is a re-architecture,
        not a slot-swap — so the fight-map cake renders entirely PARADIGM
        (the connecting indigo edge running through every band is the
        doesn&apos;t-decompose insight). The Paradigm Contrast panel below
        carries the cross-layer story: where each architecture wins, and
        the 3-facet verdict that keeps respect calibrated.
      </p>
    </section>
  )
}

// ─── All 6 PARADIGM bands ─────────────────────────────────────────────
// Every band uses the PARADIGM state with a brief layer-specific subsume
// note. The cake renders as 6 indigo bands stacked, the connecting
// left-edge running vertically through the whole stack — visualizing
// "monolithic architecture, not separate layers" at a glance.
//
// Per-band content is intentionally terse. The substance lives in the
// ParadigmContrast panel below, which is cross-layer by design.
function buildParadigmVerdicts(): LayerVerdict[] {
  return [
    {
      layerId: 'L5',
      layerName: 'Ecosystem',
      state: { kind: 'paradigm' },
      shortLabel: '(wafer-native CSL stack — not CUDA-equivalent; doesn’t decompose)',
      evidence:
        'No CUDA-equivalent broad ecosystem. Cerebras ships its own software toolchain for the wafer; the L5 ecosystem comparison doesn’t map.',
    },
    {
      layerId: 'L4',
      layerName: 'Software',
      state: { kind: 'paradigm' },
      shortLabel: '(wafer-native runtime — no PyTorch/CUDA layer to compare)',
      evidence:
        'Wafer-native runtime + model-compilation flow. Frameworks like PyTorch are reached through Cerebras-specific tooling, not as a parallel layer to swap.',
    },
    {
      layerId: 'L3',
      layerName: 'ISV / orchestration',
      state: { kind: 'paradigm' },
      shortLabel: '(CS-3 appliance — vendor-specific operational model)',
      evidence:
        'CS-3 appliance is operated as a Cerebras product, not as a workload behind general ISV / orchestration tooling. The L3 comparison doesn’t map.',
    },
    {
      layerId: 'L2-gpu',
      layerName: 'GPU (compute silicon)',
      state: { kind: 'paradigm' },
      shortLabel: '(wafer subsumes — 900,000 cores on one die, no GPU concept)',
      evidence:
        'The wafer IS the compute. There is no "GPU" to compare per-card: 900,000 cores + 4T transistors + 44 GB on-chip SRAM live on a single die.',
    },
    {
      layerId: 'L2-fabric',
      layerName: 'Networking',
      state: { kind: 'paradigm' },
      shortLabel: '(wafer subsumes — no inter-chip fabric, THE thesis)',
      evidence:
        'No inter-chip fabric exists. The multi-GPU-cluster bottleneck NVIDIA addresses with NVLink + SHARP is structurally eliminated by the monolithic wafer — that is the Cerebras architectural thesis.',
    },
    {
      layerId: 'L1',
      layerName: 'Facility',
      state: { kind: 'paradigm' },
      shortLabel: '(CS-3 appliance ~23 kW — different chassis / power profile)',
      evidence:
        'The CS-3 appliance is the physical unit (~23 kW). It deploys in a datacenter, but the chassis + power profile + thermal envelope are appliance-specific, not parallel to NVIDIA HGX-class chassis.',
    },
  ]
}

// ─── Pattern narrative under the cake ────────────────────────────────
const CEREBRAS_NARRATIVE =
  'Cerebras WSE-3 is the ALTERNATIVE PARADIGM tab — distinct from AMD (REPLACE the stack) and from fabric competitors (point-solution + open above). The cake reads doesn\'t-decompose: every band is PARADIGM, the connecting indigo edge runs vertically through the whole stack, signaling one continuous monolithic-wafer architecture instead of separate layers. Adopting Cerebras is a re-architecture, not a slot-swap. The PARADIGM CONTRAST panel below carries the cross-layer story — what each architecture is, where each wins, and the 3-facet verdict (SERIOUS-BUT-NARROW + NICHE-SHARP + MARKET-ARC) that all three must hold simultaneously to keep the read calibrated.'

// ─── Architecture contrast columns (NVIDIA distributed-GPU vs Cerebras
// monolithic-wafer). Both sides named, with the strengths each delivers.
// Cerebras side also surfaces narrow-by-design limits (no CUDA-equivalent
// ecosystem, inference-specific) — these are deliberate tradeoffs of the
// purpose-built appliance, not "Cerebras is weak."
const NVIDIA_ARCH = {
  header: 'NVIDIA',
  subheader: 'Distributed-GPU cluster',
  items: [
    'CUDA / NVAIE ecosystem (~20-year compounding depth: cuDNN, cuBLAS, TensorRT, Triton, NeMo, NIM)',
    'Full training + inference range — broad workload coverage (HPC, viz, ML training, inference)',
    'NVLink-72 scale-up domain + Spectrum-X / Quantum-X800 fabric + SHARP in-network compute',
    'Mature, deployed at hyperscale across geographies; reference designs end-to-end (Dell / HPE / Supermicro)',
    'Flexibility: any framework, any workload, any model architecture',
  ],
}

const CEREBRAS_ARCH = {
  header: 'CEREBRAS',
  subheader: 'Monolithic wafer-scale',
  items: [
    '900,000 cores · 4T transistors · 125 PF peak (single die)',
    '44 GB on-chip SRAM · ~21 PB/s on-chip bandwidth (~2,625× B200)',
    'NO inter-chip communication latency — the multi-GPU-cluster bottleneck, eliminated by the architecture',
    'CS-3 appliance ~23 kW — single physical unit',
    'Inference-specific (Llama-class reasoning sweet spot) — narrow-by-design',
    'NO CUDA-equivalent ecosystem — purpose-built appliance toolchain, not broad-platform software',
  ],
}

// ─── 3-facet verdict — all three must hold simultaneously ────────────
const VERDICT_FACETS: VerdictFacet[] = [
  {
    label: 'SERIOUS-BUT-NARROW',
    body: 'Real now — IPO May 2026, OpenAI 750 MW / $10-20B multi-year, AWS Bedrock CS-3 access (Mar 2026), G42 customer-concentration moderating 85% → 24%. Dramatic inference speed on supported workloads (vendor-claimed 21× / 18×, mandatory workload caveat: Llama-class reasoning, specific token configs — NOT a general speedup). But narrow workload-fit + no CUDA-equivalent ecosystem + paradigm-different — not a stack swap. Respect the validation; size the scope honestly.',
  },
  {
    label: 'NICHE-SHARP',
    body: 'Precision strike on inference-speed-on-supported-workloads. NVIDIA wins everywhere else: breadth (full training + inference range), ecosystem (CUDA / NVAIE, ~20 years of compounding depth), flexibility (any framework, any workload, any model). For NVIDIA, the cleanest moat story is: locate the win in breadth + ecosystem + flexibility, concede the inference niche where Cerebras genuinely leads, don\'t fight Cerebras on its own architectural axis.',
  },
  {
    label: 'MARKET-ARC',
    body: 'Public + validated (IPO, OpenAI 750 MW, AWS Bedrock) BUT sized honestly via the scale-check: NVIDIA ~90% AI accelerator share, ~423× Cerebras revenue ratio. Cerebras is a fast-growing sliver of a fast-growing market, NOT imminent NVIDIA displacement. The OpenAI deal temporarily restricts Cerebras sales to Anthropic (sourced market-dynamics, not editorialized). IPO valuation + raise figures vary across sources — note the spread, do not assert one number. Respect the trajectory; do not inflate the threat.',
  },
]
