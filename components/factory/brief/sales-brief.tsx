'use client'

import type { Component, SwapReport } from '@/lib/factory/kpi'
import {
  BriefHeader,
  BriefSection,
  BriefFooter,
} from './brief-overlay'

// Sales Brief — snapshot of /factory/competitive.
//
// FULL SCOPE: all 5 competitive modes generate a real, honest brief.
// AMD (replacement) is the richest; the 4 others (Bird's Eye / Slot Swaps
// / Paradigm / Self-Supply) follow the same shape — concede-then-locate
// + moat/positioning + switching-or-equivalent cost + talk track.
//
// HONESTY DISCIPLINE (per mode):
//   · AMD: FP8 UNRESOLVED stays unresolved; memory-AMD-lead acknowledged;
//     concede-then-locate verbatim from view verdicts
//   · Bird's Eye: cells stay DIRECTIONAL synthesis judgment (not engine
//     computed); the cross-pressure pattern named honestly
//   · Slot Swaps: split-by-axis preserved (no NVIDIA-sweep);
//     AGNOSTIC-as-real-tradeoff (open ≠ better)
//   · Paradigm: niche-sharp framing — frontier inference SECONDARY, not
//     broad; 21× / 18× kept CLAIMED + workload-caveated
//   · Self-Supply: dual-role (customer AND competitor) honest; share
//     trajectory as RANGE; coexistence (NVLink Fusion, training-on-NVIDIA)
//     surfaced; partner-PM angle named
//
// TALK TRACK DISCIPLINE: "don't overclaim" rows pulled from the view's
// EXISTING concessions only — never invents new "don't say" boundaries.

interface Props {
  mode:
    | 'replacement'
    | 'slot'
    | 'paradigm'
    | 'self-supply'
    | 'breadth'
  // AMD mode props
  baselineGpu: Component
  targetGpu: Component
  roadmapRubin: Component
  roadmapMi455x: Component
  report: SwapReport
  // Cerebras (paradigm) mode
  cerebras: Component
  // Hyperscaler (self-supply) mode
  hyperscalerGoogle: Component
  hyperscalerAws: Component
  hyperscalerMeta: Component
  hyperscalerMicrosoft: Component
}

export function SalesBrief(props: Props) {
  switch (props.mode) {
    case 'replacement':
      return <AmdSalesBrief {...props} />
    case 'breadth':
      return <BreadthSalesBrief />
    case 'slot':
      return <SlotSwapsSalesBrief />
    case 'paradigm':
      return <ParadigmSalesBrief cerebras={props.cerebras} />
    case 'self-supply':
      return (
        <SelfSupplySalesBrief
          google={props.hyperscalerGoogle}
          aws={props.hyperscalerAws}
          meta={props.hyperscalerMeta}
          microsoft={props.hyperscalerMicrosoft}
        />
      )
  }
}

// ════════════════════════════════════════════════════════════════════
// MODE 1 — AMD FULL-STACK REPLACEMENT (the rich-content showcase)
// ════════════════════════════════════════════════════════════════════
function AmdSalesBrief({
  baselineGpu,
  targetGpu,
  roadmapRubin,
  roadmapMi455x,
}: Props) {
  return (
    <>
      <BriefHeader
        title={`Sales Brief · AMD MI355X · Full-Stack Replacement`}
        subtitle={`current gen: ${baselineGpu.name} vs ${targetGpu.name} · roadmap pair: ${roadmapRubin.name} vs ${roadmapMi455x.name}`}
        sourceLabel="snapshot of /factory/competitive · FULL-STACK REPLACEMENT mode"
      />

      <BriefSection label="THE HONEST VERDICT · concede-then-locate">
        <TwoCol
          left={{
            title: 'WHERE THEY WIN',
            tone: 'amd',
            items: [
              `Memory capacity — ${targetGpu.name} 288 GB HBM3e vs ${baselineGpu.name} 192 GB (+50%, AMD CLAIMED)`,
              'Memory-bound mainstream inference — MI300X often beats H100 ~40% lower latency on Llama-2-70B (Clarifai / Tensorwave 2026)',
              'Open-fabric / open-ecosystem posture — ROCm has official PyTorch / vLLM / SGLang / FlashInfer / llama.cpp support',
              'Hardware-dollar economics — AMD often competitive or cheaper on memory + price',
            ],
          }}
          right={{
            title: 'WHERE WE WIN',
            tone: 'nvidia',
            items: [
              'Software ecosystem — CUDA ~20-year depth + TensorRT-LLM + FlashAttention 3 (Spheron 2026: missing FA3 costs ~30-40% training throughput on 7B+ models)',
              'NVAIE-proprietary microservices — NIM / Nemotron / Dynamo / NeMo Guardrails, no AMD equivalent',
              'Integration — NVLink + Spectrum-X + SHARP + NCCL, tuned end-to-end',
              'Compute-bound workloads — H100 leads (vLLM ROCm 37-75% higher latency per aimultiple 2026)',
            ],
          }}
        />
      </BriefSection>

      <BriefSection label="THE MOAT THESIS · silicon resets, moat compounds">
        <p>
          Current-gen pattern <span className="italic">repeats</span> at the
          roadmap pair (Rubin VR200 vs MI455X — both ROADMAP, both CLAIMED,
          FP8 UNRESOLVED): AMD wins memory capacity, NVIDIA wins integration,
          compute axes range from PARITY to UNRESOLVED. The moat locus is{' '}
          <span className="font-mono text-[#9FD848] print:text-[#5a8c00]">
            stable across generations
          </span>{' '}
          — integration / ecosystem, not raw silicon.
        </p>
        <p className="mt-2">
          The 13→22 TB/s Rubin bandwidth bump (CES 2026 in response to MI455X)
          is real but tactical — a chosen-late spec, not an organic generation
          step. Silicon races and resets; the moat compounds.
        </p>
      </BriefSection>

      <BriefSection label="SWITCHING COST · EFFORT + ECOSYSTEM + RISK, not dollars">
        <p className="mb-2">
          AMD&apos;s hardware is often competitive or cheaper; the real cost is
          re-porting from CUDA and giving up the mature ecosystem.
        </p>
        <CostTable
          rows={[
            ['Engineering effort', 'CUDA → ROCm re-port + re-validation + team retraining', 'HIGH', 'high'],
            ['Ecosystem loss', 'CUDA-exclusive libs (TensorRT-LLM, FA3)', 'REAL · ~30-40% throughput loss (cited · Spheron 2026)', 'cited'],
            ['Risk / maturity', 'Betting on ROCm for your specific workload', 'MODERATE — workload-dependent', 'moderate'],
            ['Hardware dollars', 'AMD often competitive / cheaper on memory + price', 'NEUTRAL-TO-FAVORABLE — the inversion', 'favorable'],
          ]}
        />
      </BriefSection>

      <BriefSection label="TALK TRACK · the honesty boundaries the view enforces">
        <TalkTrackPair
          say={[
            '"Silicon is close at the current generation — AMD wins memory capacity, we win integration + ecosystem."',
            '"The moat is L3-L5: CUDA, NVAIE, TensorRT-LLM, FA3. Stable across generations — see the roadmap pair."',
          ]}
          dont={[
            "Don't claim ROCm is broken — it's closing on mainstream inference (workload-dependent, ~90-95% mainstream throughput per workload).",
            "Don't claim a clean Rubin-FP8 lead — FP8 stays UNRESOLVED at the roadmap pair (Rubin's ~3.5× Blackwell is a multiplier on a verify-needed base).",
          ]}
        />
      </BriefSection>

      <BriefFooter note="Verdicts mirror /factory/competitive · FULL-STACK REPLACEMENT mode — claimed where claimed (sky), unresolved where unresolved (rose), directional where directional (amber). The roadmap pair is ⚠ ROADMAP — both unreleased, every figure a vendor claim. Never represent a directional / verify-needed / claimed figure as a fact in front of a customer." />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════
// MODE 2 — BIRD'S EYE VIEW (Segment × Threat Matrix snapshot)
// ════════════════════════════════════════════════════════════════════
function BreadthSalesBrief() {
  return (
    <>
      <BriefHeader
        title="Sales Brief · Bird's Eye View"
        subtitle="6 segments × 4 competitive types — cross-pressure synthesis"
        sourceLabel="snapshot of /factory/competitive · BIRD'S EYE VIEW mode"
      />

      <BriefSection label="THE MATRIX · who threatens whom · 5-state cells (PRIMARY / SECONDARY / NICHE / N-A / CONDITIONAL)">
        <table className="w-full table-fixed text-[10px]">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-400">
              <th className="w-[24%] py-1 pr-2 text-left font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                SEGMENT
              </th>
              <th className="w-[19%] py-1 pr-2 text-left font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                Full-Stack
              </th>
              <th className="w-[19%] py-1 pr-2 text-left font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                Slot Swaps
              </th>
              <th className="w-[19%] py-1 pr-2 text-left font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                Paradigm
              </th>
              <th className="w-[19%] py-1 text-left font-mono uppercase tracking-widest text-gray-500 print:text-gray-700">
                Self-Supply
              </th>
            </tr>
          </thead>
          <tbody>
            <CellRow
              segment="Frontier AI Labs"
              cells={['SECONDARY', 'PRIMARY', 'SECONDARY', 'SECONDARY']}
            />
            <CellRow
              segment="Hyperscalers"
              cells={['SECONDARY', 'PRIMARY', 'NICHE', 'PRIMARY']}
            />
            <CellRow
              segment="Neocloud"
              cells={['NICHE', 'SECONDARY', 'NICHE', 'N/A']}
            />
            <CellRow
              segment="Fortune 500"
              cells={['NICHE', 'NICHE', 'N/A', 'N/A']}
            />
            <CellRow
              segment="Sovereign AI"
              cells={['SECONDARY', 'SECONDARY', 'NICHE', 'N/A']}
            />
            <CellRow
              segment="Industry Verticals"
              cells={['NICHE', 'N/A', 'N/A', 'N/A']}
            />
          </tbody>
        </table>
        <p className="mt-2 text-[10px] italic text-gray-500 print:text-gray-600">
          Every cell is DIRECTIONAL synthesis judgment on verified data — not
          engine-computed. N/A = honest absence (competitor doesn&apos;t
          threaten that segment), not a fabricated low score.
        </p>
      </BriefSection>

      <BriefSection label="THE CROSS-PRESSURE PATTERN · what the matrix shape reveals">
        <ul className="space-y-1.5 text-[11px]">
          <li>
            <span className="font-mono text-amber-300 print:text-amber-700">
              Hyperscalers face the broadest cross-pressure
            </span>{' '}
            — 2 PRIMARY threats (Slot Swaps + Self-Supply) on top of SECONDARY
            on Full-Stack. Every competitive type lands at scale here.
          </li>
          <li>
            <span className="font-mono text-amber-300 print:text-amber-700">
              Frontier AI Labs
            </span>{' '}
            faces 1 PRIMARY (Slot Swaps — large-scale training fabric-bound) +
            3 SECONDARY. Broad pressure but not concentrated.
          </li>
          <li>
            <span className="font-mono text-[#9FD848] print:text-[#5a8c00]">
              Neocloud is the least-contested segment
            </span>{' '}
            — zero PRIMARY threats, NVIDIA-committed by business model. But
            NOT zero pressure: SECONDARY on Slot Swaps because frontier-scale
            fabrics (e.g. CoreWeave 250K-class) make the choice live.
          </li>
          <li>
            <span className="font-mono text-[#9FD848] print:text-[#5a8c00]">
              Fortune 500 + Industry Verticals
            </span>{' '}
            are mostly NICHE / N/A — the ecosystem + integration moat
            structurally protects them.
          </li>
        </ul>
      </BriefSection>

      <BriefSection label="TALK TRACK · the honesty boundaries the view enforces">
        <TalkTrackPair
          say={[
            '"Different segments face different threat patterns — Hyperscalers get all four; Fortune 500 + Verticals are moat-protected; Neocloud is least-contested by business model."',
            '"For the contested segments, lead with the integration + ecosystem moat — the structural defense that holds across competitive types."',
          ]}
          dont={[
            "Don't claim hyperscalers will replace NVIDIA wholesale — Fortune 500 + Verticals still moat-protected. The matrix has 16 of 24 cells at NICHE or N/A.",
            "Don't quote any cell as a hard score — every cell is DIRECTIONAL synthesis judgment, calibrated against the per-competitor depth fight-maps.",
          ]}
        />
      </BriefSection>

      <BriefFooter note="Matrix verdicts mirror /factory/competitive · BIRD'S EYE VIEW mode — every cell DIRECTIONAL, N/A = honest absence. Consistent with each per-competitor depth fight-map (cells click through to the depth view in the live app)." />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════
// MODE 3 — SLOT SWAPS (Fabric: Cornelis / Broadcom / Arista)
// ════════════════════════════════════════════════════════════════════
function SlotSwapsSalesBrief() {
  return (
    <>
      <BriefHeader
        title="Sales Brief · Slot Swaps (Fabric)"
        subtitle="Cornelis · Broadcom · Arista — split-by-axis verdicts, AGNOSTIC-as-real-tradeoff above the fabric"
        sourceLabel="snapshot of /factory/competitive · SLOT SWAPS mode"
      />

      <BriefSection label="THE 3 FABRIC COMPETITORS · split-by-axis (no NVIDIA-sweep, no clean win either side)">
        <div className="space-y-2 text-[11px]">
          <CompetitorRow
            name="Cornelis CN6000"
            verdict="CONTESTED · TIE · CLOSE"
            nuance="HPC-tuned · scale-conditional"
            wins="vendor-MPI-benchmarked latency / msg-rate / collective claims vs InfiniBand NDR (CLAIMED · 35% latency, 2× msg-rate, 6× collective vs RoCE); multi-protocol (RoCEv2 + UEC)"
            nvidiaWins="integrated large-scale collective performance via SHARP + NCCL; deployed maturity"
            caveats="claims are vendor MPI-microbenchmarks vs PRIOR-gen InfiniBand NDR — not yet vs current Quantum-X800 XDR + SHARP v4"
          />
          <CompetitorRow
            name="Broadcom Tomahawk Ultra"
            verdict="CONTESTED · TIE · CLOSE"
            nuance="philosophy-dependent (disaggregation vs integration)"
            wins="cited per-hop latency 250 ns (rare vendor publication); 800 G throughput parity; 77 BPPS packet rate cited (methodology note: ≠ MPI msg/sec); merchant-silicon disaggregation pitch"
            nvidiaWins="integration + in-network compute via SHARP; tighter end-to-end stack"
            caveats=""
          />
          <CompetitorRow
            name="Arista 7800R4 / 7700R4"
            verdict="CONTESTED · TIE · CLOSE"
            nuance="platform-scale-dependent (chassis + EOS, not per-port)"
            wins="800 G throughput parity; 10.8 BPPS per-line-card cited; chassis-platform scale (3-tier DES architecture → 27,000 ports); EOS software operational maturity; disaggregation pitch"
            nvidiaWins="integration + in-network compute via SHARP; collective acceleration at scale"
            caveats="Arista does NOT publish per-hop latency (unlike Broadcom's cited 250 ns) — latency-sensitive workloads need vendor engagement"
          />
        </div>
      </BriefSection>

      <BriefSection label="THE POINT-SOLUTION SHAPE · 1 contested layer + 4 AGNOSTIC above + 1 N/A facility">
        <p>
          All three fabric competitors share the SAME shape: contested ONLY at
          L2-fabric (the networking sub-slot). Above the fabric — L2-gpu / L3 /
          L4 / L5 — they are{' '}
          <span className="font-mono text-teal-300 print:text-teal-700">
            AGNOSTIC
          </span>
          : open Ethernet structurally frees those layers from NVIDIA pull. L1
          facility is N/A (fabric vendors don&apos;t play there).
        </p>
        <p className="mt-2">
          <span className="font-mono text-amber-300 print:text-amber-700">
            AGNOSTIC = real tradeoff, NOT &quot;open = better.&quot;
          </span>{' '}
          The customer&apos;s openness frees their stack choice; NVIDIA&apos;s
          integration buys tighter SHARP / NCCL / CUDA optimization. Both real.
          The customer chooses the tradeoff.
        </p>
      </BriefSection>

      <BriefSection label="THE COSTS · effort/risk varies by competitor">
        <ul className="space-y-1 text-[11px]">
          <li>
            <span className="font-mono text-gray-500 print:text-gray-700">FABRIC SWAP COST · </span>
            Single-slot blast radius — engine&apos;s applySwap counts what
            changes (L2-fabric only); much smaller than full-stack swap.
          </li>
          <li>
            <span className="font-mono text-gray-500 print:text-gray-700">INTEGRATION COST · </span>
            Real but partial — open-fabric stack loses NVIDIA-tuned collective
            performance; the magnitude is workload-dependent.
          </li>
          <li>
            <span className="font-mono text-gray-500 print:text-gray-700">COEXISTENCE · </span>
            Common in practice — many deployments run NVIDIA + open-fabric
            side-by-side; not exclusive choice.
          </li>
        </ul>
      </BriefSection>

      <BriefSection label="TALK TRACK · the honesty boundaries the view enforces">
        <TalkTrackPair
          say={[
            '"Fabric is contested at L2 — three credible competitors (Cornelis HPC, Broadcom merchant-silicon, Arista operational/EOS). AGNOSTIC above means the customer gives up integration to gain openness — a real tradeoff."',
            '"Our integration + SHARP collective performance is the structural lead at large-scale. Fabric swap is single-slot — much smaller than full-stack risk."',
          ]}
          dont={[
            "Don't claim NVIDIA wins fabric — Cornelis has CLAIMED HPC-tuning, Broadcom has the cited 1024-vs-72 scale-up + 250 ns latency, Arista has EOS stickiness + chassis-platform scale. All three split-by-axis.",
            "Don't dismiss the openness as fake — AGNOSTIC is a real tradeoff. Open ≠ better, but lock-in IS a real choice the customer makes consciously.",
          ]}
        />
      </BriefSection>

      <BriefFooter note="Verdicts mirror /factory/competitive · SLOT SWAPS mode. All three fabric competitors split-by-axis; AGNOSTIC bands above the fabric stay AGNOSTIC (NOT N/A — openness is a real competitive property, with the real optimization tradeoff)." />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════
// MODE 4 — ALTERNATIVE PARADIGM (Cerebras)
// ════════════════════════════════════════════════════════════════════
function ParadigmSalesBrief({ cerebras }: { cerebras: Component }) {
  return (
    <>
      <BriefHeader
        title={`Sales Brief · ${cerebras.name}`}
        subtitle="paradigm-different · niche-sharp · 3-facet verdict (all must hold for calibrated read)"
        sourceLabel="snapshot of /factory/competitive · ALTERNATIVE PARADIGM mode"
      />

      <BriefSection label="THE PARADIGM SHIFT · doesn't decompose into NVIDIA's L1-L5 layers">
        <p>
          Cerebras WSE-3 is a{' '}
          <span className="font-mono text-indigo-300 print:text-indigo-700">
            monolithic wafer-scale machine
          </span>{' '}
          — 900,000 cores, 4T transistors, 44 GB on-chip SRAM, ~21 PB/s on-chip
          bandwidth (~2,625× B200), CS-3 appliance ~23 kW. The architectural
          thesis: NO inter-chip communication latency. Adopting it is a
          re-architecture, not a slot-swap.
        </p>
        <p className="mt-2">
          The fight-map cake renders all 6 bands PARADIGM with a connecting
          indigo edge — visually signaling{' '}
          <span className="italic">one continuous architecture, not separate layers</span>
          .
        </p>
      </BriefSection>

      <BriefSection label="THE 3-FACET VERDICT · all three must hold for calibrated read">
        <div className="space-y-2 text-[11px]">
          <FacetRow
            label="SERIOUS-BUT-NARROW"
            body="IPO May 2026, OpenAI 750 MW / $10-20B multi-year, AWS Bedrock (Mar 2026), G42 concentration 85% → 24%. Real, validated. BUT narrow workload-fit + no CUDA-equivalent ecosystem + paradigm-different — not a stack swap."
          />
          <FacetRow
            label="NICHE-SHARP"
            body="Precision strike on inference-speed-on-supported-workloads (Llama-class reasoning, specific token configs). NVIDIA wins everywhere else: breadth, full training + inference range, CUDA / NVAIE ecosystem, flexibility. Cleanest moat story: locate the win in breadth + ecosystem, concede the niche."
          />
          <FacetRow
            label="MARKET-ARC"
            body="Public + validated BUT sized honestly: NVIDIA ~90% AI accelerator share, ~423× Cerebras revenue ratio. Fast-growing sliver, NOT imminent displacement. OpenAI deal temporarily restricts Cerebras sales to Anthropic (sourced market-dynamics)."
          />
        </div>
        <p className="mt-2 text-[10px] italic text-gray-500 print:text-gray-600">
          Cherry-picking one facet inflates the threat (serious alone) or
          dismisses real validation (niche alone). The intersection is the
          honest read.
        </p>
      </BriefSection>

      <BriefSection label="CONCEDE-THEN-LOCATE">
        <TwoCol
          left={{
            title: 'WHERE THEY WIN',
            tone: 'cerebras',
            items: [
              'Inference speed on supported workloads — vendor-CLAIMED 21× faster than DGX B200 on Llama 3 70B reasoning (specific token config), ~32% lower TCO; Meta Llama API 18×; OpenAI 1,000+ tok/sec',
              'No inter-chip latency — the multi-GPU-cluster bottleneck, structurally eliminated by the monolithic wafer',
              'Frontier-lab inference traction — OpenAI 750 MW / $10-20B multi-year deal is real, validated',
            ],
          }}
          right={{
            title: 'WHERE WE WIN',
            tone: 'nvidia',
            items: [
              'Breadth — full training + inference range, broad workload coverage (HPC, viz, ML, robotics)',
              'Ecosystem — CUDA / NVAIE ~20 years of compounding depth (cuDNN, cuBLAS, TensorRT, Triton, NeMo, NIM); CUDA-first default for new ML research',
              'Flexibility — any framework, any workload, any model architecture',
              'Scale — NVIDIA ~90% accelerator share, ~423× Cerebras revenue (the structural scale check)',
            ],
          }}
        />
      </BriefSection>

      <BriefSection label="TALK TRACK · the honesty boundaries the view enforces">
        <TalkTrackPair
          say={[
            '"Cerebras is a niche-sharp threat for specific inference workloads (Llama-class reasoning) — frontier-lab inference SECONDARY, hyperscaler NICHE, the rest N/A. Training stays NVIDIA."',
            '"Locate NVIDIA\'s moat in breadth + ecosystem + flexibility — the layers Cerebras structurally cannot fill — and concede the niche."',
          ]}
          dont={[
            "Don't dismiss Cerebras as irrelevant — IPO, OpenAI 750 MW, AWS Bedrock are all real. The 'SERIOUS-BUT-NARROW' facet must hold.",
            "Don't quote 21× / 18× as facts — they're vendor-CLAIMED, workload-specific (Llama-class reasoning on specific token configs), not general speedups. The 'all three facets must hold' framing prevents cherry-picking.",
          ]}
        />
      </BriefSection>

      <BriefFooter note="Verdicts mirror /factory/competitive · ALTERNATIVE PARADIGM mode. All Cerebras inference claims CLAIMED (sky) + workload-caveated. Scale honestly sized: ~90% NVIDIA share, ~423× revenue ratio — fast-growing sliver, NOT imminent displacement." />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════
// MODE 5 — CUSTOMER SELF-SUPPLY (Hyperscaler silicon)
// ════════════════════════════════════════════════════════════════════
function SelfSupplySalesBrief({
  google,
  aws,
  meta,
  microsoft,
}: {
  google: Component
  aws: Component
  meta: Component
  microsoft: Component
}) {
  return (
    <>
      <BriefHeader
        title="Sales Brief · Customer Self-Supply (Hyperscaler Silicon)"
        subtitle="dual-role threat — customer AND competitor · 4 maturity-differentiated programs"
        sourceLabel="snapshot of /factory/competitive · CUSTOMER SELF-SUPPLY mode"
      />

      <BriefSection label="THE 4 PROGRAMS · differentiated by maturity (NOT a monolith)">
        <div className="space-y-2 text-[11px]">
          <MaturityRow
            label="MOST MATURE + MERCHANT"
            name={google.name}
            note="Generally Available; moving beyond Google Cloud (external / on-prem); Meta in talks for billions; Gemini 3 trained on TPU. Co-designed Broadcom + MediaTek."
          />
          <MaturityRow
            label="COMMERCIAL VOLUME + COEXISTENCE"
            name={aws.name}
            note="GA December 2025; anchored by Anthropic + OpenAI workloads. Trainium4 integrates NVLink Fusion (AWS-NVIDIA collaboration) — the most explicit COEXISTENCE signal across the 4."
          />
          <MaturityRow
            label="NARROW + INTERNAL"
            name={meta.name}
            note="100,000s deployed internally (FB/IG inference); NOT sold externally. Meta in talks for Google TPUs — limits of own program."
          />
          <MaturityRow
            label="LEAST MATURE"
            name={microsoft.name}
            note="Earliest of the four; OpenAI's Azure compute volume justifies the program. OpenAI continues to use NVIDIA + AWS Trainium in parallel — Maia adds capacity, NOT replacement."
          />
        </div>
      </BriefSection>

      <BriefSection label="THE 5-FACET STRATEGIC VERDICT · all must hold for calibrated read">
        <ul className="space-y-1.5 text-[11px]">
          <li>
            <span className="font-mono font-semibold text-amber-300 print:text-amber-700">THREAT + SHARE TRAJECTORY ·{' '}</span>
            Self-supply eats inference first (~2/3 of compute). ASIC shipments
            ~27.8% of 2026 AI accelerator market, +44.6% YoY. Share trajectory
            is a <span className="font-mono">RANGE</span>: ~90% now → ~75%
            (gradual / bullish-NVIDIA) ... ~20-30% inference 2028 (aggressive
            / aggressive-ASIC). RENDER AS A RANGE, never one number.
          </li>
          <li>
            <span className="font-mono font-semibold text-amber-300 print:text-amber-700">WHY NVIDIA HOLDS ·{' '}</span>
            Off-the-shelf availability; multi-cloud portability; CUDA / NVAIE
            ecosystem depth; the merchant / sovereign / enterprise long tail
            that can&apos;t build custom silicon; frontier training + workload
            flexibility.
          </li>
          <li>
            <span className="font-mono font-semibold text-emerald-300 print:text-emerald-700">COEXISTENCE — NOT ZERO-SUM ·{' '}</span>
            NVLink Fusion (AWS-NVIDIA Trainium4 collaboration); Meta uses
            NVIDIA for training + MTIA for inference; everyone buys NVIDIA for
            frontier training. &quot;Self-supply specific workloads + NVIDIA
            holds the rest.&quot;
          </li>
          <li>
            <span className="font-mono font-semibold text-cyan-300 print:text-cyan-700">STRUCTURAL ENABLERS ·{' '}</span>
            Most custom chips are Broadcom-architected (TPU, OpenAI) + all 4
            fab at TSMC (~92% advanced AI) — shared chokepoints that bound how
            fast self-supply can scale.
          </li>
          <li>
            <span className="font-mono font-semibold text-[#9FD848] print:text-[#5a8c00]">PARTNER-PM ANGLE ·{' '}</span>
            These hyperscalers are NVIDIA&apos;s biggest PARTNERS and biggest
            self-supply THREATS simultaneously. The co-sell + coexistence
            motion — where NVIDIA wins inside a TPU shop on frontier training
            / workload flexibility / multi-cloud portability — IS the
            partner-PM job.
          </li>
        </ul>
      </BriefSection>

      <BriefSection label="TALK TRACK · the honesty boundaries the view enforces">
        <TalkTrackPair
          say={[
            '"Hyperscalers face a PRIMARY self-supply threat (defining segment), but coexistence is real — NVLink Fusion partnership, Meta-trains-on-NVIDIA, frontier-on-NVIDIA. Not zero-sum."',
            '"Maturity matters — TPU is most mature + the only one with merchant ambitions; Trainium has commercial volume + explicit coexistence (NVLink Fusion); MTIA is internal; Maia is least mature."',
          ]}
          dont={[
            "Don't frame as zero-sum 'hyperscalers replacing NVIDIA' — share trajectory is a RANGE (~90% now → ~75% gradual ... ~20-30% inference 2028 aggressive). Sources frame the end-state differently; never assert one number.",
            "Don't claim NVIDIA wins everywhere — self-supply concentrates in hyperscaler segment by definition (PRIMARY) + Frontier SECONDARY (labs building their own). Hyperscalers are NICHE customers for AGNOSTIC layers above silicon.",
          ]}
        />
      </BriefSection>

      <BriefFooter note="Verdicts mirror /factory/competitive · CUSTOMER SELF-SUPPLY mode. Share trajectory rendered as RANGE never a point. Coexistence framed as real (NVLink Fusion, training-on-NVIDIA cited). Partner-PM angle named as the role-fit signal." />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════

interface ColSpec {
  title: string
  tone: 'amd' | 'nvidia' | 'cerebras'
  items: string[]
}

function TwoCol({ left, right }: { left: ColSpec; right: ColSpec }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <ColBox spec={left} />
      <ColBox spec={right} />
    </div>
  )
}

function ColBox({ spec }: { spec: ColSpec }) {
  const toneCls =
    spec.tone === 'nvidia'
      ? 'border-[#76B900]/40 bg-[#76B900]/8 print:border-[#5a8c00] print:bg-lime-50'
      : spec.tone === 'amd'
        ? 'border-sky-500/40 bg-sky-500/5 print:border-sky-700 print:bg-sky-50'
        : 'border-indigo-500/40 bg-indigo-500/8 print:border-indigo-700 print:bg-indigo-50'
  const titleCls =
    spec.tone === 'nvidia'
      ? 'text-[#9FD848] print:text-[#5a8c00]'
      : spec.tone === 'amd'
        ? 'text-sky-300 print:text-sky-800'
        : 'text-indigo-300 print:text-indigo-800'
  return (
    <div className={`rounded border p-3 ${toneCls}`}>
      <div className={`text-[10px] font-mono font-semibold uppercase tracking-widest ${titleCls}`}>
        {spec.title}
      </div>
      <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-gray-200 print:text-black">
        {spec.items.map((b, i) => (
          <li key={i}>
            <span className="text-gray-500 print:text-gray-600">·</span> {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CostTable({
  rows,
}: {
  rows: Array<[string, string, string, 'high' | 'cited' | 'moderate' | 'favorable']>
}) {
  return (
    <table className="w-full table-fixed text-[11px]">
      <thead>
        <tr className="border-b border-gray-700 print:border-gray-400">
          <th className="w-[24%] py-1 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">DIMENSION</th>
          <th className="w-[42%] py-1 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">WHAT IT IS</th>
          <th className="w-[34%] py-1 text-left font-mono text-[9px] uppercase tracking-widest text-gray-500 print:text-gray-700">MAGNITUDE</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-gray-800 align-top print:border-gray-300">
            <td className="py-1.5 pr-2 font-semibold text-gray-100 print:text-black">{r[0]}</td>
            <td className="py-1.5 pr-2 text-gray-300 print:text-gray-700">{r[1]}</td>
            <td className="py-1.5">
              <span className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest ${magTone(r[3])}`}>
                {r[2]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function magTone(tone: 'high' | 'cited' | 'moderate' | 'favorable'): string {
  if (tone === 'high' || tone === 'cited')
    return 'bg-amber-500/15 border-amber-500/60 text-amber-200 print:bg-amber-100 print:border-amber-700 print:text-amber-800'
  if (tone === 'moderate')
    return 'bg-amber-500/10 border-amber-500/40 text-amber-200/80 print:bg-amber-50 print:border-amber-700 print:text-amber-700'
  return 'bg-[#76B900]/10 border-[#76B900]/40 text-[#9FD848] print:bg-lime-50 print:border-[#5a8c00] print:text-[#5a8c00]'
}

function TalkTrackPair({
  say,
  dont,
}: {
  say: string[]
  dont: string[]
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded border border-[#76B900]/40 bg-[#76B900]/8 p-3 print:border-[#5a8c00] print:bg-lime-50">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#9FD848] print:text-[#5a8c00]">
          WHAT TO SAY
        </div>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-gray-200 print:text-black">
          {say.map((b, i) => (
            <li key={i}>
              <span className="text-gray-500 print:text-gray-600">✓ </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded border border-amber-500/40 bg-amber-500/5 p-3 print:border-amber-700 print:bg-amber-50">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-300 print:text-amber-800">
          WHAT NOT TO OVERCLAIM
        </div>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-gray-200 print:text-black">
          {dont.map((b, i) => (
            <li key={i}>
              <span className="text-gray-500 print:text-gray-600">✗ </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CellRow({
  segment,
  cells,
}: {
  segment: string
  cells: string[]
}) {
  return (
    <tr className="border-b border-gray-800 print:border-gray-300">
      <td className="py-1.5 pr-2 font-semibold text-gray-100 print:text-black">
        {segment}
      </td>
      {cells.map((c, i) => (
        <td key={i} className="py-1.5 pr-2">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest ${cellTone(c)}`}>
            {c}
          </span>
        </td>
      ))}
    </tr>
  )
}

function cellTone(c: string): string {
  if (c === 'PRIMARY')
    return 'bg-amber-500/25 border-amber-500/70 text-amber-100 print:bg-amber-200 print:border-amber-800 print:text-amber-900'
  if (c === 'SECONDARY')
    return 'bg-amber-500/15 border-amber-500/50 text-amber-200 print:bg-amber-100 print:border-amber-700 print:text-amber-800'
  if (c === 'NICHE')
    return 'bg-amber-500/8 border-amber-500/30 text-amber-200/80 print:bg-amber-50 print:border-amber-700 print:text-amber-700'
  if (c === 'N/A')
    return 'border-dashed border-gray-700 bg-gray-900/40 text-gray-500 print:border-gray-400 print:bg-gray-100 print:text-gray-600'
  return 'border-sky-500/40 bg-sky-500/10 text-sky-300 print:border-sky-700 print:bg-sky-50 print:text-sky-800'
}

function CompetitorRow({
  name,
  verdict,
  nuance,
  wins,
  nvidiaWins,
  caveats,
}: {
  name: string
  verdict: string
  nuance: string
  wins: string
  nvidiaWins: string
  caveats: string
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/40 p-2 print:border-gray-300 print:bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-gray-100 print:text-black">{name}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 print:text-amber-700">
          {verdict}
        </div>
      </div>
      {nuance && (
        <div className="mt-0.5 text-[10px] italic text-gray-500 print:text-gray-600">
          nuance: {nuance}
        </div>
      )}
      <div className="mt-1.5 text-[11px] leading-relaxed">
        <div>
          <span className="font-mono text-sky-300 print:text-sky-800">they win:{' '}</span>
          <span className="text-gray-300 print:text-gray-800">{wins}</span>
        </div>
        <div className="mt-1">
          <span className="font-mono text-[#9FD848] print:text-[#5a8c00]">we win:{' '}</span>
          <span className="text-gray-300 print:text-gray-800">{nvidiaWins}</span>
        </div>
      </div>
      {caveats && (
        <div className="mt-1.5 text-[10px] italic leading-relaxed text-amber-200/80 print:text-amber-800">
          ⚠ {caveats}
        </div>
      )}
    </div>
  )
}

function FacetRow({
  label,
  body,
}: {
  label: string
  body: string
}) {
  return (
    <div className="rounded border border-indigo-500/40 bg-indigo-500/5 p-2 print:border-indigo-700 print:bg-indigo-50">
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-indigo-300 print:text-indigo-800">
        ▸ {label}
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-300 print:text-black">
        {body}
      </p>
    </div>
  )
}

function MaturityRow({
  label,
  name,
  note,
}: {
  label: string
  name: string
  note: string
}) {
  return (
    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 print:border-amber-700 print:bg-amber-50">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-gray-100 print:text-black">{name}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 print:text-amber-700">
          {label}
        </div>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-300 print:text-black">
        {note}
      </p>
    </div>
  )
}
