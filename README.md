# EdgeInferenceOS — v3-nvidia · AI Factory Advisor

A target-driven multi-agent framework for systematically operating a hardware product line. This branch (`v3-nvidia`) hosts two demo contexts that coexist on the same codebase:

- **v3-nvidia · AI Factory Advisor** (active demo) — NVIDIA partner-PM context: segment-faithful AI factory composition, competitive analysis (fabric slot swaps + full-stack replacement), dependency-graph KPI engine with honest provenance.
- **v2-cornelis · Director PM Operating Framework** (preserved) — Cornelis Networks Director-PM context: 5 customer segments with TCO + competitive positioning, live phase-gate brief agent (RAG + MCP), roadmap commitment register with live comms agent, three stakeholder exports (PDF / Excel / PPT).

Authored by Ashit Ghevaria. Built in Claude Code.

> ⚠ **Day 1 Thinking Artifact** — Synthesized from publicly available materials — Ready for correction by the team. Authored as a structured proposal for how a Product Manager would approach the role in their first 90 days. Neither demo context represents any company's internal operating model, roadmap commitments, or customer relationships.

## Reading conventions

This README is the design document for **complete v3** — it describes the full architecture, including pieces that aren't yet built. Every feature carries a status tag so the gap between design and delivery is always legible:

- `[SHIPPED]` — feature is live and renderable in the browser today on the `v3-nvidia` branch
- `[PLANNED — phase N]` — feature is designed and described; not yet built. The architecture sections fully describe how planned features will work — that's honest design documentation — but planned ≠ deliverable. Status badges appear at section, subsection, and (where mixed) bullet level.

A final accuracy pass flips `[PLANNED]` → `[SHIPPED]` as pieces land.

## Status

**v3 demo spine partial; v3 design complete.** What ships today: the architect view (`/factory/architect`), the competitive view (`/factory/competitive`) with two modes (fabric slot swaps + AMD full-stack GPU replacement), the dependency-graph KPI engine, the 4-class provenance system. What's designed but not yet built: the software-layer extension of the AMD scorecard, the Vera Rubin × MI455X roadmap pair, the Cerebras paradigm contrast, the segment × competitor heat-map, the partner lens, the verify-needed triage treatment. v2-cornelis ships unchanged from its 2026-05-19 demo-spine completion. Pathname-conditional chrome separates v3 routes (AI Factory Advisor branding) from v2 routes (Director PM Operating Framework branding) with no leakage either direction.

## What it is

A target-driven multi-agent framework. Same shared module tree (`app/factory/`, `lib/factory/`, `agents/factory/`, `components/factory/`), specialized per demo context:

- **v2** retargets to any hardware product line by swapping the active target configuration in `data/targets/config.json` — same UI, same agents, different `target.json` + per-target JSON. **[SHIPPED]**
- **v3** specializes for NVIDIA AI Factory composition: adds a dependency-graph KPI engine (`lib/factory/kpi/`), per-segment delivered-KPI seeding, blended reference-architecture rendering (RA-blend at L2, ISV-blend at L3, facility profile at L1), and a competitive view with `applySwap`-driven scorecards. **[SHIPPED for architect + competitive views; PLANNED for heat-map, partner lens, paradigm view]**

Pathname-conditional rendering in `components/factory/top-nav.tsx` keeps the two demos visually separate. v3 routes get AI Factory Advisor brand + sub-text + nav (Architect / Competitive); v2 routes keep the original chrome (EdgeInferenceOS v2 / Director PM Operating Framework · Target: cornelis / Segments+Phase-Gate+Roadmap+About).

## v3-nvidia — AI Factory Advisor

### Architect view · `/factory/architect` — `[SHIPPED]`

Single-page view of one segment's complete AI factory composition. Segment selector at top toggles between 5 segments; all view models are pre-resolved server-side at static-render time, so segment switches are instant — no LLM call, no fetch, no loading state.

For each segment renders:

- **Header** — segment name + reference-architecture blend (e.g. "NVL72 + HGX + RTX_PRO") + verbatim matrix note ("Full-spectrum deployment for digital autonomy") + segment subtitle
- **5-layer architecture cake** (L5 → L1, top to bottom):
  - **L5 Applications** — Snowflake Cortex, custom agents, vertical applications (text descriptor from `stack.json`)
  - **L4 Models / Microservices** — NIM, Nemotron, Dynamo, NeMo Guardrails (text descriptor)
  - **L3 ISV Platform** — multi-tile blend per segment, each ISV labeled with its category (storage / orchestration). Sovereign shows Red Hat OpenShift AI (orchestration) + VAST Data (storage) — the both-categories case
  - **L2 Chips** — multi-tile RA blend per segment (e.g. Sovereign shows GB200 + B200 + RTX PRO 6000), each tile labeled with its RA + GPU name + role where matrix-specified (FT500 + Verticals only). Single shared fabric chip below the tiles
  - **L1 Land / Power / Shell** — per-segment facility profile (text + provenance pill) with optional trajectory note (Frontier + Hyperscaler get the Vera Rubin NVL144 ~600 kW/rack roadmap projection rendered with its own DIRECTIONAL pill, separated by a thin border from the current-cited profile)
  - **NVAIE wrapper rail** spans L3-L5 in NVIDIA-green
  - **Dell PowerEdge XE9680 chassis divider** between L2 and L1
- **Delivered KPIs panel** — segment's seeded north-star (prominent card, NVIDIA-green border) + 3-4 supporting KPIs (responsive grid). Every value pilled per provenance
- **TCO bars** — CapEx + OpEx directional bars side-by-side with factor lists. Bar fill encodes band (high/medium/low/tbd). Footer caption explicit: "Directional — relative magnitude, not computed totals. CapEx and OpEx are never summed by this module."

### Competitive view · `/factory/competitive` — `[SHIPPED for fabric + AMD GPU; PLANNED for software layer + heat-map + paradigm contrast]`

Top-level mode toggle teaches the switching-cost spectrum by structure: **SLOT SWAPS — Fabric** (low blast radius, one component) vs **FULL-STACK REPLACEMENT — AMD** (broader blast radius, whole platform). The further from NVIDIA, the more layers change.

#### Mode 1: Slot Swaps — Fabric — `[SHIPPED]`

Baseline NVIDIA Spectrum-X. Swap targets: Cornelis CN6000 (current-gen, announced Nov 2025) · Broadcom Tomahawk Ultra · Arista 7800R4 / 7700R4 Etherlink · NVIDIA Quantum-X800 InfiniBand.

Per-target swap report:
- **Blast-radius strip** — L1-L5 strip with L2 highlighted, "15 KPIs changed / 22 held · single-layer swap, low switching cost — compute / software / OEM / ISV stack untouched"
- **Target meta card** — name + generation tag + component-level metadata (performance_vs_prior, protocol) where seeded. CN6000 shows "2x performance of CN5000" CLAIMED + "multi-protocol — Omni-Path + RoCEv2 + UEC compliant" CITED
- **Within-NVIDIA two-track framing card** — fires only when target is Quantum-X800 (both vendors NVIDIA). Frames the swap as "NVIDIA is the only vendor offering both fabric protocols on first-party silicon — disaggregation challengers (Broadcom, Arista) are Ethernet-only." Competitive STRENGTH, not gap
- **CHANGED KPIs** — fabric-dependent rows with before/after pills + engine's verbatim `why` text in monospace ("Depends on fabric; swap touches 'fabric' (nvidia_spectrum_x → cornelis_cn6000)")
- **Strategic framing** — baseline vs target buying philosophies side-by-side ("integration / risk-mitigation" vs "extreme-performance-tuning")
- **HELD KPIs** — collapsible `<details>`, count always visible ("HELD · 22 KPIs insulated from this swap ▸")
- **UNVERIFIED flags** — surfaced from both sides of the swap

#### Mode 2: Full-Stack Replacement — AMD — `[SHIPPED for GPU layer; PLANNED for software layer extension]`

Current pairing: **B200 vs MI355X** (both shipping today, current generation). The MI355X-not-MI455X choice is deliberate — comparing shipping B200 to a 2026 roadmap MI455X would be a generational mismatch that reads as "AMD's spec sheet wins but they haven't shipped." The honest current pairing reframes the finding: hardware is near-parity TODAY, which makes the moat argument STRONGER, not weaker.

- **Diagonal framing line** (concede-then-locate thesis) — "At the current generation, the hardware race is close: B200 and MI355X are near-parity on FP4 compute (~9 vs ~9.2 PFLOPS), and MI355X actually leads on memory (288 vs 192 GB). The spec sheet was never the moat — and this generation proves it. NVIDIA's switching cost lives above the chip: CUDA maturity, TensorRT-LLM, and the software ecosystem, where ROCm is still closing the gap." Neutral gray styling — analytical frame, not sales pitch
- **Win/Loss Scorecard** — axis-by-axis with PARITY-aware winner logic (~5% tolerance):
  - Memory capacity (288 vs 192 GB → AMD, sky CLAIMED)
  - Memory bandwidth (8 vs 8 TB/s → PARITY, neutral)
  - FP4 dense (9.2 vs 9 PFLOPS → PARITY, neutral, dense/sparse caveat)
  - FP8 dense (5 vs 9 PFLOPS, both verify-needed → UNRESOLVED, rose, dense/sparse caveat)
  - Shipping availability (both current → PARITY "BOTH SHIPPING", neutral)
  
  Visual rhythm: 1 sky + 3 neutral + 1 rose. PARITY-dominant. That IS the thesis
- **Pill double-duty in current-vs-current**: pills encode evidence basis (emerald CITED = NVIDIA datasheet-confirmed; sky CLAIMED = AMD vendor-stated), NOT announced-vs-shipping (both ship today)
- **Blast-radius strip** — L2 highlighted, 17 KPIs changed / 22 held — broader than fabric swap
- **CHANGED / HELD / UNVERIFIED sections** — reused from the fabric swap card via export, with `slotLabel="gpu"`

**Software-layer extension — `[PLANNED — phase 3c-2 step 2]`** will extend the AMD scorecard from L2-only (GPU compute) to **L2 + L4 + L5** (GPU + Models/Microservices + Applications wrapper). The blast-radius strip will multi-highlight (L2 + L4 + L5 — the multi-layer case that exercises the BlastRadiusStrip component's already-built multi-layer prop). New scorecard rows will compare:
- ROCm (AMD) vs CUDA (NVIDIA) — ecosystem depth, library coverage, multi-year maturity, contributor count
- AMD's equivalent of TensorRT-LLM — which doesn't exist (TensorRT-LLM is NVIDIA-only by design, won't run on ROCm)
- AMD's equivalent of NIM / Nemotron / Dynamo / NeMo Guardrails
- OpEx implications: MLops headcount, re-certification cadence, multi-stack support burden

Expected finding: NVIDIA wins the software layer decisively. The PARITY-dominant L2 scorecard SETS UP this software argument; step 2 lands it. The diagonal framing line's forward reference ("which step 2 (ROCm vs CUDA) makes visible") is the explicit promise to be kept.

#### Mode 3 (planned): Roadmap Pair — `[PLANNED]`

**Vera Rubin (NVIDIA H2 2026) vs MI455X (AMD H2 2026)**. Same scorecard + blast-radius pattern as the current AMD shipping comparison, but **both sides will carry CLAIMED pills** (both pre-launch announcement-spec products). Pill double-duty changes meaning a third time: in this view, sky-vs-sky says "vendor claim vs vendor claim, neither verified yet — buyer-beware on both."

Required pre-work: web-verification of Vera Rubin specs (currently unseeded — the corpus has a Rubin trajectory note but no Vera Rubin component record). MI455X is already seeded as `generation: "roadmap"`.

The roadmap-pair view's honest framing: "Both vendors are positioning their 2026 generations. The hardware claims show AMD continuing the spec lead from MI355X; NVIDIA's claims show continued architectural integration (NVLink scale-up, Vera CPU + Rubin GPU coupling). Neither is yet measurable. The software-ecosystem argument applies unchanged across generations."

#### Mode 4 (planned): Cerebras Paradigm Contrast — `[PLANNED]`

**Cerebras enters as its OWN paradigm comparison — NOT a slot swap, NOT forced into the AMD full-cake template.** Wafer-scale (WSE-3 / CS-3) is architecturally distinct from distributed-GPU clusters — there's no inter-GPU fabric inside a wafer, no NVLink domain, no per-GPU memory hierarchy in the same sense. Forcing Cerebras through a layer-by-layer NVIDIA-cake swap would mis-render.

Planned visual: side-by-side "different approach" framing — NVIDIA distributed-GPU-cluster vs Cerebras monolithic-wafer. Surfaces where each architecturally wins:
- **Frontier AI Labs + high-volume inference** — Cerebras's wafer-scale memory bandwidth gives inference-speed and large-context-window advantages that distributed clusters struggle to match
- **Fortune 500 Enterprise** — Cerebras is weakest here (no CUDA / NVAIE-equivalent ecosystem, narrow ISV support)

This narrow-but-sharp profile is a **cleaner version of the AMD moat story**: challenger wins a specific hardware dimension, NVIDIA wins integration / ecosystem breadth.

Data discipline planned: WEB-VERIFY current Cerebras specs + market position before seeding. Cerebras is a fast-moving company with heavily vendor-claimed numbers; IPO / funding / customer state changes; specs mostly CLAIMED (sky pills) following the GB200 / CN6000 / MI455X discipline. Re-verify WSE-4 or next-gen roadmap if announced.

**Fallback if timeline tight**: a Cerebras column in the heat-map view instead of a dedicated paradigm-contrast build — captures segment relevance without the full paradigm-rendering work.

### Heat-map view · `/factory/competitive/heatmap` (or sub-mode) — `[PLANNED — phase 3c-3]`

**Segment × competitor matrix.** 5 segments (rows) × N competitors (cols). Each cell encodes one of: fit (segment is a good target for this competitor) / parity (close hardware-and-software story) / NVIDIA-wins (the competitor doesn't address this segment well) / unaddressed (the competitor doesn't compete here).

Planned cell semantics:
- Cell color encodes outcome at-a-glance (sage/green NVIDIA-wins, amber parity, rose competitor-wins, gray unaddressed)
- Cell hover / click shows the deciding 2-3 factors per cell, drawn from segment.delivered_kpis + competitor data
- Honesty discipline carries: cells where data is missing render explicitly as "(unseeded)" not "—"

The heat-map will surface the structural insight that fabric/GPU/software comparisons individually don't: which competitor is most threatening to which segment, and where NVIDIA's moat shows up unevenly across the segment portfolio.

### Partner lens · `/factory/partners` — `[PLANNED — phase 3d]`

The data layer already seeds **partner_intensity** (5-level gradient: low / low-medium / medium / medium-high / high) and **is_battleground** (binary: true for Fortune 500 + Sovereign AI, the two segments where partner ecosystem wins or loses the deal). These fields are seeded but unrendered.

Planned partner lens will render:
- Per-segment **partner_intensity** ranking with rationale (e.g. Fortune 500 = high: "channel-served — Dell/HPE/Lenovo/Cisco/Supermicro integrate, certify, support; the partner ecosystem wins or loses the deal")
- Per-segment **battleground** call-out where applicable, with the "critical battleground for the Partner-PM — flawless execution across Dell, HPE, Lenovo, Cisco, Supermicro" framing
- Channel ecosystem view: which OEMs (Dell, HPE, Lenovo, Cisco, Supermicro), ISVs (Red Hat, VMware, Nutanix, VAST), and integrator partners serve which segment
- Cross-cut against the competitive view: where partner-channel intensity shapes vendor selection (high intensity → integration cost favors integrated NVIDIA stack; low intensity → disaggregation challengers more viable)

### Dependency-graph KPI engine — `[SHIPPED]`

`lib/factory/kpi/` is the deterministic backbone:

- **`buildConfig(segmentId, architectureId, overrides?) → ConfigState`** — resolves a starting config from segment + RA defaults. Per-slot override hooks. **[SHIPPED]**
- **`lookupKpiValue(kpi, config) → KpiValue | null`** — segment-first resolver: returns segment-scoped value when present (outcome KPIs, SLO conventions, TCO bands), falls back to component-scoped value on the KPI's primary dependency slot (physics KPIs). **[SHIPPED]**
- **`applySwap(config, swap) → SwapReport`** — for each KPI in the catalog: if dependencies include `swap.slot` → CHANGED; else → HELD. Verify-needed flags surfaced from either side (before + after). Returns `{ changed[], held[], unverified[] }`. Pure function, no LLM, no network. **[SHIPPED]**

The engine is what the UI is allowed to READ. The LLM never computes KPI values; the agent's prose is qualitative only, never numeric.

### Honesty discipline — 4-class provenance — `[SHIPPED]`

Every seeded value carries a Provenance tag, rendered as a colored pill at every UI surface:

- **`cited`** — emerald pill — datasheet / independent source / published standard / sustainability report / industry SLO convention / analyst coverage
- **`claimed`** — sky pill — vendor announcement / marketing benchmark / `claimed_by` set / vendor product brief
- **`directional`** — amber pill — band / posture / range with no benchmark
- **`verify-needed`** flag — rose pill — overrides any status; needs human confirmation before promotion

Plus the following honesty mechanics, all live in the codebase today:

- **Pill double-duty** — in current-vs-current comparisons (B200 vs MI355X), pills encode evidence basis (datasheet-confirmed vs vendor-stated), not announced-vs-shipping. In MI455X-style roadmap comparisons, pills would encode announced-vs-delivered. In roadmap-vs-roadmap comparisons (Vera Rubin vs MI455X — planned), pills encode claim-vs-claim
- **Engine output verbatim** — swap-report `why` text renders in monospace ("Depends on gpu, fabric, software; swap touches 'gpu' (...)") — machine-derived classification, not UX copy-writing. Proves the reasoning is real
- **Honest gaps preserved** — when a competitor has no defensible figure for a KPI (e.g. Arista per-hop latency), the cell renders "(no value seeded for this fabric)" in muted gray. Not fabricated, not "—"
- **Category-error guards** — render as amber caution callouts via keyword-match detector. Currently fires on: msg/sec ≠ PPS (Cornelis MPI-msg-rate vs Broadcom/Arista packet-rate not directly comparable); Broadcom 250 ns latency "transparency, not necessarily superiority" framing (only vendor publishing per-hop latency; missing-number from NVIDIA/Cornelis is NOT evidence of worse performance); AMD dense/sparse caveat on FP4 + FP8 (not apples-to-apples with NVIDIA's explicit dense/sparse split)
- **PARITY-aware scorecard winner logic** — ~5% numeric tolerance treats vendor-claim-vs-datasheet noise as a tie, not a winner. Strict equality would falsely push 9-vs-9.2 PFLOPS FP4 into AMD-win territory; PARITY honors the noise floor
- **UNRESOLVED winner state** — when either side carries verify-needed flag, the scorecard reports UNRESOLVED rather than naming a winner. Acknowledges "neither side solid"

### Verify-needed triage — `[PLANNED — V3_TODO buckets A + B]`

The verify-needed flags across the corpus are NOT uniform. Triage planned in two buckets with opposite treatment:

- **Bucket A — resolvable with effort** (verify → clear the flag → tag cited):
  - B200 FP8 dense — NVIDIA datasheet has this; never confirmed in current seeding
  - MI355X FP8 — sources spread 5/10/40 PFLOPS; almost certainly a dense-vs-sparse + measurement-scope confusion
  - Vera Rubin specs — resolves as a side-effect of building the roadmap pair view
  - Action: focused FP8 cleanup pass (~30-min session), clear what's confirmable
- **Bucket B — genuinely unknowable right now** (leave flagged, EXPLAIN why):
  - Quantum-X800 latency / msg-rate magnitude — NVIDIA doesn't publish per-hop latency; unknowable because data doesn't exist publicly
  - CN6000 collective-op large-scale breakpoint — pre-production product; no independent measurement exists yet
  - Action: explanatory "why this is flagged" treatment per flag (possibly a typed `Provenance.flag_reason: 'unknowable-public' | 'pre-production' | 'verify-pending'` field) so genuine unknowns read as deliberate rigor, not oversight

The triage IS the interview script. Bucket A = rigor ("I verified these, here's the source"). Bucket B = judgment ("flagged on purpose — I won't assert a number I can't defend"). The Bucket B answer is the more valuable demonstration for a Principal / Director PM hire.

### 5 customer segments seeded — `[SHIPPED]`

| Segment | North-star | RA blend | ISV blend | L1 facility | partner_intensity | battleground |
|---|---|---|---|---|---|---|
| Frontier AI Labs | MFU + TTT | [NVL72] | [VAST Data] | liquid-cooled, ~120 kW/rack (CITED) + Rubin trajectory note | low-medium | no |
| Hyperscalers | TCO/token | [NVL72, HGX] | [VAST Data] | hyperscale owned DC (CITED) + Rubin trajectory note | low | no |
| Fortune 500 Enterprise | Production ROI | [HGX (training), RTX_PRO (inference)] | [Red Hat, VMware, Nutanix] | enterprise DC / colo, air-cooled ceiling ~10-15 kW/rack (CITED) | high | **YES** |
| Sovereign AI | Data residency % | [NVL72, HGX, RTX_PRO] | [Red Hat, VAST Data] | in-country DC, mixed cooling (DIRECTIONAL) | high | **YES** |
| Industry Verticals | Domain accuracy + Safety latency | [HGX (specialized training), RTX_PRO (edge inference)] | [Nutanix, VMware] | edge / on-prem distributed (DIRECTIONAL) | medium-high | no |

Each segment carries: delivered_kpis (north-star + supporting + TCO + seed-full for competitive use), architecture_blend (lead RA + per-RA roles where matrix-specified), isv_blend + isv_rationale, l1_profile (text + provenance + optional trajectory_note), partner_intensity + is_battleground.

### v3 architecture summary

```
app/factory/architect/page.tsx          [SHIPPED]  server — resolves 5 SegmentViews
app/factory/competitive/page.tsx        [SHIPPED]  server — resolves both modes' data

agents/factory/solution-architect-agent.ts  [SHIPPED]  v3 agent (RAG + honesty division enforced)
                                            currently exercised via scripts/test-solution-architect.ts;
                                            pre-compute-to-JSON for architect page rendering is PLANNED

lib/factory/kpi/                        [SHIPPED]  dependency-graph KPI engine
  definitions.ts                                    KPI catalog with deps + tiers
  knowledge.ts                                      JSON loaders for nvidia knowledge files
  engine.ts                                         buildConfig + lookupKpiValue + applySwap
  types.ts                                          ProvenanceStatus + Provenance + ConfigState + SwapReport etc.

components/factory/                     presentational + client switchers
  segment-switcher.tsx                  [SHIPPED]  client — toggles between 5 segments
  ai-factory-cake.tsx                   [SHIPPED]  server — L1-L5 layered render
  delivered-kpis-panel.tsx              [SHIPPED]  server — north-star + supporting
  tco-bars.tsx                          [SHIPPED]  server — CapEx + OpEx directional bars
  competitive-mode-switcher.tsx         [SHIPPED]  client — toggles slot swap + full-stack
  fabric-swap-view.tsx                  [SHIPPED]  client — 4 swap targets with reports
  amd-replacement-view.tsx              [SHIPPED]  client — scorecard + framing + reused changed/held
  swap-report-card.tsx                  [SHIPPED]  shared sections (CHANGED / HELD / UNVERIFIED)
  blast-radius-strip.tsx                [SHIPPED]  reusable L1-L5 strip (multi-layer prop ready;
                                                   currently only L2 used; multi-layer activated by
                                                   PLANNED software-layer extension)
  provenance-pill.tsx                   [SHIPPED]  4-state pill (cited / claimed / directional / verify-needed)

  heatmap-view.tsx                      [PLANNED — phase 3c-3]
  cerebras-paradigm-view.tsx            [PLANNED]
  roadmap-pair-view.tsx                 [PLANNED]
  partner-lens-view.tsx                 [PLANNED — phase 3d]

data/targets/nvidia/
  target.json                           [SHIPPED]  target metadata
  corpus.json                           [SHIPPED]  RAG chunks for solution-architect-agent
  knowledge/
    segments.json                       [SHIPPED]  5 segments + delivered_kpis + RA/ISV blends + L1 profile
    architectures.json                  [SHIPPED]  NVL72 / HGX / RTX_PRO with default_components
    stack.json                          [SHIPPED]  5 layers + NVIDIA components (Blackwell B200, GB200,
                                                   B300, RTX PRO 6000, Spectrum-X, Quantum-X800,
                                                   ConnectX-8, NVAIE, Dell XE9680, Red Hat OpenShift AI,
                                                   VMware Private AI Foundation, Nutanix Enterprise AI,
                                                   VAST Data)
    competitors.json                    [SHIPPED]  competitor components (AMD MI355X current + Helios
                                                   MI455X roadmap, hyperscaler custom silicon,
                                                   Cornelis CN5000 prior + CN6000 current, Broadcom
                                                   Tomahawk Ultra, Arista Etherlink) + categories
                                                   (full_cake_replacement, fabric_alternatives,
                                                   uec_coalition)
    roadmap.json                        [SHIPPED]  Vera Rubin trajectory note

    cerebras.json                       [PLANNED]  separate component file or competitor section;
                                                   needs web-verified WSE-3 / CS-3 specs
    vera_rubin component                [PLANNED]  to enable roadmap pair vs MI455X
```

## v2-cornelis — Director PM Operating Framework (preserved) — `[SHIPPED]`

### Routes

- **`/factory/segments/[segmentId]`** — five segments with workload / reference architecture / channel / TCO model / value proposition / sources sidebar. Header: Export Partner Brief (PDF)
- **`/factory/phase-gate`** — seven-lane × six-phase swim-lane grid (42 cells, four states). One live cell (`validation::development`) opens the Phase-Gate Brief Agent panel inline (RAG + MCP). Header: Export Status Grid (Excel)
- **`/factory/roadmap`** — multi-generation Timeline (CN5000 / CN6000 / CN7000) + EOL Methodology + Commitment Register. Three live AT-RISK / SLIP rows (SNL Tier-1 Federal + Neocloud A + Enterprise Automotive) open the Roadmap Comms Generator inline. Header: Export for Customer Review (PPT)
- **`/factory/about`** — scaffolded, content not yet drafted

### Current target

`data/targets/config.json` reads `"cornelis"` — v2 routes resolve through Cornelis Networks data (CN5000 / CN6000 / CN7000 SuperNIC product family across five customer segments: Federal HPC, Academic HPC, Enterprise Commercial AI, Neoclouds, Sovereign AI).

### Two live agents

- **Phase-Gate Brief Agent** (`agents/factory/phasegate-brief-agent.ts`) — streams a structured executive brief (Issue / Recommendation / Confidence / Owner / Decision By / Rationale). Augmented by RAG retrieval over a 54-chunk Cornelis corpus (three real CN5000 product briefs ingested via `pdf-parse` + one simulated CN6000 NPI Program Brief, with source-diversity selection) and MCP-style segments-server tool invocation (`list_segments` + `get_segment`, Salesforce stand-in). Orchestration breadcrumbs visible in panel
- **Roadmap Comms Generator** (`agents/factory/roadmap-comms-agent.ts`) — streams a customer-facing comms register entry (Subject / To / From / Re / Situation / Impact / Mitigation / Escalation Path / Sign-off). Status-calibrated tone (formal for SLIP, preventive for AT-RISK). Role-based sign-offs only

### Three exports — stakeholder triad

| Audience | Format | Library | Source view | Sanitization |
|---|---|---|---|---|
| External customer (QBR) | PPT | `pptxgenjs` | Roadmap | Heavy — AT-RISK + SLIP collapse to business-blue; no internal data |
| Internal engineering | Excel | `exceljs` | Phase-Gate | None — full candor, alarm colors visible, role-based names visible |
| Sales / BD / Partner | PDF | `@react-pdf/renderer` | Customer Segments | Light — drops internal notes, keeps TCO + competitive positioning + channel |

## AI Architecture patterns (cross-context)

Patterns demonstrated across the codebase, callable from either demo context.

### Claude streaming — `[SHIPPED]`

Phase-Gate Brief (v2), Roadmap Comms (v2), and Solution Architect (v3) all stream responses via the Anthropic SDK, pinned at `claude-sonnet-4-5` with `claude-sonnet-4-20250514` as a fallback when the primary returns a model error. Server-side Route Handlers wrap each agent's streaming output in a `ReadableStream` body. Client panels read token-by-token, accumulating into a `<pre>` block for the streaming view and parsing the final buffer into structured fields for the done view. All panels use the `AbortController` + `cancelled` flag pattern inside `useEffect` cleanup to handle React 18 Strict Mode double-mounts — no ref-based debounce, no stranded fetches on remount.

### RAG (Retrieval-Augmented Generation) — `[SHIPPED]`

- **v2** Phase-Gate Brief retrieves from 54-chunk local corpus (`data/targets/cornelis/rag-corpus/`). Query built from clicked cell's lane + phase + detail + matched decision title + product-family context; chunks scored by length-normalized token overlap; source-diversity selection returns top chunk per source to prevent single-document echo chambers
- **v3** Solution Architect retrieves from `data/targets/nvidia/corpus.json` (NVIDIA Blackwell + Cornelis CN5000 competitive context + segment profiles). Same source-diversity selection. Per-target RAG cache via `Map<targetId, IndexedChunk[]>`

### MCP-style tool invocation — `[SHIPPED — v2 only]`

Phase-Gate Brief invokes an in-process MCP-shaped segments-server with `list_segments` + `get_segment` tools. Stands in for what would be Salesforce / ERP in production. Wrapped in `try` / `catch` — if it fails, the brief still generates from RAG + program context alone, no regression. Tool invocations surface in panel Orchestration section.

### Dependency-graph KPI engine — `[SHIPPED — v3 only]`

`applySwap(config, swap) → SwapReport` is pure, deterministic, no LLM, no network. For each KPI in the catalog: if dependencies include `swap.slot` → CHANGED; else → HELD. Verify-needed flags surfaced from either side. Engine output is the source of truth; the LLM is forbidden from computing KPI values, only from explaining them qualitatively in prose. The Solution Architect agent's prose is scanned for numeric values by the honesty test (`scripts/test-solution-architect.ts`) — zero violations to date despite the engine output containing real numeric figures.

## End-to-end workflows

### v3 (AI Factory Advisor) — currently shipped

```
  ┌────────────────────────────────────────────────────────────┐
  │  /factory/architect                              [SHIPPED] │
  │                                                            │
  │  Pick segment → header (segment · RA blend · matrix note)  │
  │  5-layer cake (L5 Apps · L4 Models · L3 ISV blend · L2     │
  │  GPU+fabric · L1 facility profile) · NVAIE wrapper rail ·  │
  │  Dell chassis divider                                      │
  │                                                            │
  │  Delivered KPIs panel: north-star + supporting (per        │
  │  segment) · CapEx/OpEx directional bars · all values       │
  │  pilled per provenance                                     │
  └──────────────────────────┬─────────────────────────────────┘
                             │  Cross to competitive view
                             ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /factory/competitive                            [SHIPPED] │
  │                                                            │
  │  Mode toggle:                                              │
  │    SLOT SWAPS — Fabric  [SHIPPED]                          │
  │    FULL-STACK REPLACEMENT — AMD  [SHIPPED for GPU layer]   │
  │                                                            │
  │  Per-target swap report:                                   │
  │    blast-radius strip · target meta · within-vendor        │
  │    framing (Quantum-X800 two-track) · diagonal framing     │
  │    (AMD concede-then-locate) · scorecard (PARITY-aware) ·  │
  │    CHANGED / HELD / UNVERIFIED · strategic framing         │
  │    (buying philosophies side-by-side)                      │
  └────────────────────────────────────────────────────────────┘
```

### v3 (AI Factory Advisor) — planned extensions

```
  /factory/competitive  →  software-layer scorecard (ROCm vs CUDA)  [PLANNED 3c-2 step 2]
  /factory/competitive  →  roadmap pair (Vera Rubin vs MI455X)      [PLANNED]
  /factory/competitive  →  Cerebras paradigm contrast               [PLANNED]
  /factory/competitive/heatmap  →  segment × competitor matrix      [PLANNED 3c-3]
  /factory/partners     →  partner_intensity + battleground render  [PLANNED 3d]
```

### v2 (Director PM Framework) — `[SHIPPED]`

```
  ┌────────────────────────────────────────────────────────────┐
  │  /factory/segments/[segmentId]   — Customer demand lens    │
  │  ► Export Partner Brief (PDF, sales/BD/partner audience)   │
  └──────────────────────────┬─────────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /factory/phase-gate             — Program execution lens  │
  │                                                            │
  │  Click validation × development:                           │
  │    Phase-Gate Brief Agent streams structured exec brief    │
  │    ← RAG (54-chunk Cornelis corpus, source-diversity)      │
  │    ← MCP get_segment(...) per affected segment             │
  │                                                            │
  │  ► Export Status Grid (Excel, internal engineering)        │
  └──────────────────────────┬─────────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /factory/roadmap                — Customer commitments    │
  │                                                            │
  │  Click AT-RISK or SLIP row (3 live):                       │
  │    Roadmap Comms Generator streams customer comms entry    │
  │                                                            │
  │  ► Export for Customer Review (PPT, external customer)     │
  └────────────────────────────────────────────────────────────┘
```

A Director walking the v2 chain end-to-end on one cell exercises Claude streaming (both agents), RAG retrieval (Phase-Gate Brief), MCP tool invocation (Phase-Gate Brief), and the stakeholder-triad exports (one per view).

## Tech stack

- **Framework** — Next.js 14 App Router · TypeScript · Tailwind CSS
- **Agent model** — Anthropic Claude `claude-sonnet-4-5` (primary) with `claude-sonnet-4-20250514` fallback, via the official Anthropic SDK
- **Document generation (v2)** — `pptxgenjs` (PPT), `exceljs` (Excel), `@react-pdf/renderer` (PDF), `pdf-parse` (corpus ingestion)

## How to run

```
npm run dev
```

**v3-nvidia routes (active demo):**

- `http://localhost:3000/factory/architect` — defaults to Fortune 500 / HGX; segment selector at top
- `http://localhost:3000/factory/competitive` — defaults to Slot Swaps mode, Cornelis CN6000 target

**v2-cornelis routes (preserved demo):**

- `http://localhost:3000/factory/segments/federal-hpc` (or any of the 5 segments)
- `http://localhost:3000/factory/phase-gate`
- `http://localhost:3000/factory/roadmap`

The active v2 target is read from `data/targets/config.json` (currently `"cornelis"`); v3 routes resolve `nvidia` knowledge directly and ignore that file.

To retarget v2 for a different company:

1. Create `data/targets/<new-target-id>/` with `target.json`, `segments.json`, `products.json`, `roadmap.json`, `phase-gate.json`, and a `rag-corpus/` subdirectory of public-source documents
2. Update `active_target` in `data/targets/config.json`
3. Restart dev server — v2 UI, data loaders, and agents reconfigure for the new target automatically

To extend v3 with additional segments / RAs / competitors:

1. Edit `data/targets/nvidia/knowledge/{segments,architectures,stack,competitors}.json` with new entries
2. KPI catalog lives in `lib/factory/kpi/definitions.ts` — add new KPI defs there if needed
3. Provenance discipline: every value carries `{ status, source?, claimed_by?, last_verified, flag? }`. Honest gaps are explicit absence, not fabricated zeros

## Branch scope

Branched as `v2-cornelis` from `main` (May 2026) for the Cornelis Director-PM demo, then forked to `v3-nvidia` (May 2026) for the AI Factory Advisor demo. Both demo experiences coexist on the `v3-nvidia` branch through the pathname-conditional TopNav. The `v2-cornelis` branch retains only the v2 demo; the `main` branch carries the v1 NOC inference orchestration system separately, fully functional and untouched.

This branch contains the shared multi-context code under `app/factory/`, `app/api/factory/`, `agents/factory/`, `components/factory/`, `data/targets/`, `lib/factory/`, and `scripts/`, plus the shared root layout and Tailwind/Next config.

## Planned scope (V3_TODO summary)

Tracked in detail in `V3_TODO.md`. Status as of current branch tip:

| Item | Phase | Status |
|---|---|---|
| Software-layer competitive view (ROCm vs CUDA / NVAIE) — extends AMD scorecard to L2+L4+L5 multi-layer | 3c-2 step 2 | `[PLANNED]` |
| Roadmap pair view (Vera Rubin vs MI455X) | fast-follow after 3c-2 | `[PLANNED]` — needs Rubin web-verification |
| Cerebras paradigm-contrast competitor | after 3c-2 | `[PLANNED]` — needs Cerebras web-verification; fallback = heat-map column |
| Heat-map view (segment × competitor) | 3c-3 | `[PLANNED]` |
| Partner lens (partner_intensity render + channel ecosystem) | 3d | `[PLANNED]` — data seeded |
| Verify-needed triage (FP8 cleanup + explanatory treatment) | polish | `[PLANNED]` — bucket A is ~30-min session; bucket B is per-flag note treatment |
| Reusable BlastRadius full extraction (currently has multi-layer prop support but only L2 used) | 3c-2 step 2 | `[PLANNED]` — natural extension when L2+L4+L5 multi-highlighting lands |
| Pre-compute Solution Architect rationale to JSON | architect-page enhancement | `[PLANNED]` — agent runs via test script today, not from architect page |
| Typed Provenance.note_kind (replaces keyword-match caution detector) | polish | `[PLANNED]` — keyword-match is interim |
| v2-cornelis About view content | v2 polish | `[PLANNED]` |
| 10-minute demo script | demo prep | `[PLANNED]` |
| Framing pass tier 2 — README | this commit | `[SHIPPED]` (this file) |
