# EIOSv2 — Director PM Operating Framework

A builder-level framework for how a Director-level Product Manager would systematically operate a hardware product line — built specifically as a candidate-fit artifact for the Director PM role at **Cornelis Networks**. Authored by Ashit Ghevaria.

This is the `v2-cornelis` branch of the EdgeInferenceOS repository, scoped to the Director PM application for clean Vercel deployment. The `main` branch carries the v1 NOC inference orchestration system separately, fully functional and untouched; v1 documentation lives there.

> ⚠ **Day 1 Thinking Artifact** — Synthesized from publicly available materials — Ready for correction by the team. Authored by Ashit Ghevaria as a structured proposal for how a Director PM would approach the Cornelis Networks role in their first 90 days. Built in Claude Code over one week, branched from production v1.

## Status

**Demo spine complete.** Three primary views, two live agents (Phase-Gate Brief Agent augmented with RAG retrieval and MCP-style tool invocation — see *AI Architecture* below), and three exports (stakeholder triad: external customer / internal engineering / sales-BD-partner). All v1 code was deleted from this branch on 2026-05-19 to scope the deployment to v2 only; v1 remains intact on the `main` branch.

## What it is

A target-configurable Director PM Operating Framework. Same multi-agent architecture as v1, applied to a different domain: how a Director-level Product Manager would systematically operate a hardware product line. The framework retargets to any hardware product line by swapping the active target configuration in `data/targets/config.json`.

## Current target

**Cornelis Networks** — covering the CN5000 / CN6000 / CN7000 SuperNIC product family across five customer segments: Federal HPC, Academic HPC, Enterprise Commercial AI, Neoclouds, and Sovereign AI.

## Architecture summary

Three layers, target-driven:

1. **UI** — Next.js App Router under `app/director/` with sub-routes per view (`/segments/[segmentId]`, `/phase-gate`, `/roadmap`, `/about`). Server components read target config + JSON at render; client components handle interactivity (slider state, agent streaming, inline expansion panels).
2. **Agents** — Async functions in `agents/director/` following v1's `runXAgent(input, onStream?) → Promise<Output>` convention. Stream from Anthropic SDK via `claude-sonnet-4-5` with fallback to `claude-sonnet-4-20250514`. Two live agents shipped (see *Two live agents* below).
3. **Data** — Per-target JSON in `data/targets/<active>/` (segments, products, roadmap, phase-gate, target metadata, RAG corpus). Active target read from `data/targets/config.json`. Loaded via typed readers in `lib/director/load-target.ts`.

## AI Architecture

Three AI-stack patterns are demonstrated in the Phase-Gate Brief Agent's live cell flow. The Roadmap Comms Generator uses the streaming pattern only; RAG retrieval and MCP tool invocation are scoped to the Phase-Gate Brief Agent for this build.

### Claude streaming

Phase-Gate Brief Agent and Roadmap Comms Agent both stream responses via the Anthropic SDK, pinned at `claude-sonnet-4-5` with `claude-sonnet-4-20250514` as a fallback when the primary returns a model error. Server-side Route Handlers wrap each agent's streaming output in a `ReadableStream` body returned to the client. The client panel reads token-by-token from the response body, accumulating into a `<pre>` block for the streaming view and parsing the final buffer into structured fields for the done view. Both panels use the `AbortController` + `cancelled` flag pattern inside `useEffect` cleanup to handle React 18 Strict Mode double-mounts — no ref-based debounce, no stranded fetches on remount.

### RAG (Retrieval-Augmented Generation)

The Phase-Gate Brief Agent retrieves from a 54-chunk local corpus spanning four source documents: three real Cornelis CN5000 product briefs (PDFs ingested via `pdf-parse`) and one simulated CN6000 NPI Program Brief (markdown, clearly labeled as a pre-GA internal draft). Per request the agent builds a query from the clicked cell's lane + phase + detail + matched exec decision title + a product-family context tail, then scores corpus chunks by length-normalized keyword overlap (`overlap / sqrt(chunk_token_count)`). Source-diversity selection returns the top-scoring chunk per source rather than top-K raw chunks — preventing a single-document retrieval echo chamber when one document dominates scoring. Retrieved chunks are injected as a `PROGRAM AND PRODUCT CONTEXT` block before the brief format spec in the prompt. Retrieval is visible to the demo viewer in the agent panel's Orchestration section as `✓ RAG · N chunks`, with the contributing document filenames listed in the Sources section below the brief.

### MCP-style tool invocation

The Phase-Gate Brief Agent invokes an in-process MCP-shaped segments-server (`lib/director/mcp/segments-server.ts`) with two tools: `list_segments` returns all five segment IDs + names + subtitles, `get_segment(segment_id)` returns a full segment profile (workload, architecture, channel, TCO, value proposition). The server stands in for what would be a Salesforce or ERP connection in production — the MCP abstraction means the agent doesn't care where the data lives. A small heuristic identifies affected customer segments per phase-gate cell from cell + decision context (default Federal HPC + Sovereign AI for critical-path NPI cells without explicit segment hints), then the agent calls `get_segment` per affected ID and injects the result as a `CUSTOMER SEGMENT IMPACT` block in the prompt. The MCP path is wrapped in `try`/`catch` — if it fails the brief still generates from RAG + program context alone, no regression. Tool invocations are visible in the agent panel's Orchestration section as `✓ MCP → Segments Server · N segments (Salesforce stand-in)` and logged to the dev server console (`[MCP] list_segments() → 5 segments` etc.) for demo visibility.

## End-to-end workflow

The Director PM journey traverses the three primary views in sequence. Each view surfaces a different lens on the same target program; agents fire at the appropriate stage when the Director clicks a live element. Unlike v1's continuous telemetry tick, v2 is user-triggered — there is no automatic A2A handoff; the Director walks the chain by navigating between views.

```
  ┌────────────────────────────────────────────────────────────┐
  │  /director/segments/[segmentId]    — Customer demand lens  │
  │                                                            │
  │  Workload · Reference architecture · Channel · TCO model · │
  │  Value proposition · Sources sidebar                       │
  │                                                            │
  │  ► Export Partner Brief (PDF, @react-pdf/renderer)         │
  │    Audience: Sales / BD / Partner                          │
  └──────────────────────────┬─────────────────────────────────┘
                             │  Director identifies customer-anchored
                             │  commitments and navigates to phase-gate
                             ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /director/phase-gate              — Program execution lens │
  │                                                            │
  │  7-lane × 6-phase status grid · methodology framing        │
  │                                                            │
  │  Click validation × development (one live cell):           │
  │    ┌────────────────────────────────────────────────────┐  │
  │    │ Phase-Gate Brief Agent (claude-sonnet-4-5)         │  │
  │    │  ← RAG retrieval (54-chunk Cornelis corpus,        │  │
  │    │     source-diversity selection)                    │  │
  │    │  ← MCP get_segment(...) per affected segment       │  │
  │    │     (Salesforce stand-in)                          │  │
  │    │  → streams structured exec brief: Issue /          │  │
  │    │     Recommendation / Confidence / Owner / By /     │  │
  │    │     Rationale + Sources + Orchestration footer     │  │
  │    └────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ► Export Status Grid (Excel, exceljs)                     │
  │    Audience: Internal engineering / program managers       │
  └──────────────────────────┬─────────────────────────────────┘
                             │  Brief identifies at-risk customer
                             │  commitments; Director navigates to roadmap
                             ▼
  ┌────────────────────────────────────────────────────────────┐
  │  /director/roadmap         — Customer commitments lens     │
  │                                                            │
  │  Timeline (CN5000/6000/7000) · CN5000 EOL methodology ·    │
  │  Commitment Register                                       │
  │                                                            │
  │  Click SLIP or AT-RISK row (3 live: SNL · Neocloud A ·     │
  │  Enterprise Auto):                                         │
  │    ┌────────────────────────────────────────────────────┐  │
  │    │ Roadmap Comms Generator (claude-sonnet-4-5)        │  │
  │    │  → streams customer comms register entry: Subject  │  │
  │    │    / To / From / Re / Situation / Impact /         │  │
  │    │    Mitigation / Escalation Path / Sign-off         │  │
  │    │  Status-calibrated tone (SLIP formal, AT RISK      │  │
  │    │  preventive); brevity discipline (one sentence per │  │
  │    │  prose section); role-based sign-offs only         │  │
  │    └────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ► Export for Customer Review (PPT, pptxgenjs)             │
  │    Audience: External customer (QBR)                       │
  └────────────────────────────────────────────────────────────┘
```

A Director walking the chain end-to-end on one cell exercises every architectural pattern in this build: Claude streaming (both agents), RAG retrieval (Phase-Gate Brief Agent), MCP-style tool invocation (Phase-Gate Brief Agent), and the stakeholder-triad exports (one per view).

## Three primary views

- **Customer Segments** (`/director/segments/[segmentId]`) — five segments populated with demo-narratable content across multiple editorial passes. Each segment renders workload profile, reference architecture, channel & partner ecosystem (OEM/ODM + HPC ISVs + AI/ML ISVs), interactive TCO model with deployment-size and supply-lead-time sliders, value proposition with named competitive positioning, and a persistent sources sidebar with inferences flagged and Day-1 PM open questions. Visual section differentiation via muted left-border color accents across the five primary card types. **Header button:** Export Partner Brief (PDF).
- **Phase-Gate Tracker** (`/director/phase-gate`) — seven-lane × six-phase swim-lane visualization. 42 status-colored cells across four states (closed / in_progress / at_risk / future), with methodology framing inline at the top of the view. **One live cell** (`validation::development`) opens the Phase-Gate Brief Agent panel inline. **Header button:** Export Status Grid (Excel).
- **Roadmap + Lifecycle** (`/director/roadmap`) — three cards: multi-generation Timeline (CN5000 / CN6000 / CN7000 across 2024–2029 with phase-coded bars and sub-row packing for boundary-year overlaps), CN5000 EOL Methodology Framework (three phases with trigger criteria + decision dependencies + methodology-only flag), and Commitment Register (six entries with status-coded badges). **Three live rows** in the register (SNL Tier-1 Federal SLIP + Neocloud A AT RISK + Enterprise Automotive AT RISK) open the Roadmap Comms Generator inline. **Header button:** Export for Customer Review (PPT).

Plus **About** (`/director/about`) — scaffolded route, content not yet drafted.

## Two live agents

Both follow v1's agent function-convention, stream from Anthropic SDK pinned at `claude-sonnet-4-5` with fallback to `claude-sonnet-4-20250514`. UI uses Strict-Mode-safe `AbortController` + `cancelled` flag pattern (no ref-based debounce).

- **Phase-Gate Brief Agent** (`agents/director/phasegate-brief-agent.ts`) — clicking the live phase-gate cell streams a structured executive brief: Issue / Recommendation / Confidence pill / Decision Owner / Decision By / Rationale. Cross-references customer segments and the phase-gate exec decisions register. Selects between Option A and Option B with explicit tradeoff reasoning. Augmented by RAG retrieval over a 54-chunk Cornelis corpus and MCP-style segments-server tool invocation — see *AI Architecture* above. Both data sources surface to the demo viewer in the panel's Orchestration section alongside the brief.
- **Roadmap Comms Generator** (`agents/director/roadmap-comms-agent.ts`) — clicking a live commitment-register row streams a customer-facing comms register entry: Subject / To / From / Re / Situation / Impact / Mitigation / Escalation Path / Sign-off. Status-calibrated tone (formal acknowledgment for SLIP, preventive "wanted to surface early" framing for AT RISK). Role-based sign-offs only (no personal names, emails, or phone numbers). Brevity discipline — each prose section is exactly one sentence.

## Three exports live — stakeholder triad

Audience-appropriate artifact pairing demonstrates stakeholder framing: same source data, three different surfaces calibrated to who is reading.

| Audience | Format | Library | Source view | Sanitization |
|---|---|---|---|---|
| External customer (QBR) | PPT | `pptxgenjs` | Roadmap | Heavy — AT-RISK + SLIP collapse to business-blue; no internal data |
| Internal engineering | Excel | `exceljs` | Phase-Gate | None — full candor, alarm colors visible, role-based names visible |
| Sales / BD / Partner | PDF | `@react-pdf/renderer` | Customer Segments | Light — drops internal notes, keeps TCO + competitive positioning + channel |

- **Roadmap PPT — External customer-facing** (`app/api/director/roadmap-ppt`): 5-slide deck — Cover · Segment Context · Multi-generation Timeline 2024–2029 · Customer Commitment Status (sanitized) · CN5000 Lifecycle & Program Confidence. Customer picker exposes 6 commitment register entries. White business deck palette. Day-1 framing banner OFF (real customer artifact). Sanitization mapping: `on_track` → "On Plan" (sage), `at_risk` → "In Active Development" (business-blue), `slip` → "Under Active Program Management" (business-blue) — alarm colors never leak externally.
- **Phase-Gate Status Grid Excel — Internal engineering** (`app/api/director/phasegate-excel`): 2-sheet artifact. Sheet 1 = 7 lanes × 6 phases status grid (frozen top row + first column, conditional cell fills per status, wrap-text cells with status / target_date / detail). Sheet 2 = Exec Decisions Needed sourced from `exec_decisions_needed[]` (3 structured rows: Title / Affected Lane / Affected Phase / Status / Target Date / Owner / Escalate To / Detail; severity-ordered). Internal owner roles visible (VP Engineering, VP Operations, VP Product, COO / CEO escalation paths). SLIP color path wired for future-proofing; current phase-gate data has zero slip cells (slip lives in the commitment register, a different file).
- **Segment Brief PDF — Sales / BD / Partner** (`app/api/director/segment-brief-pdf`): single-page partner brief per segment (one PDF per segment, 5 segments). Header band + Value Proposition + Market Fit (top 3 buying criteria) + Use Case (workload mix · scale · bottleneck) + Reference Architecture (3 products + descriptions) + Competitive Positioning (3-row table) + TCO at Scale (3-column Cornelis / NVIDIA / Broadcom comparison with Cornelis-as-winner highlight, uniformly normalized to **3-year horizon** across all five segments) + OEM / Channel + Day-1 ISV Priority + confidentiality footer. White business deck palette consistent with PPT. PDF text sanitizer substitutes Unicode arrows (→) with ASCII (` -> `) for Helvetica-safe rendering.

## Currently deferred

Items intentionally out of scope for the demo spine but tracked for follow-up sessions:

- **About view content** — scaffolded route, content not yet drafted
- **10-minute demo script** — allocates airtime per view + agent + export, anchors each on its most distinctive moment

## Tech stack

- **Framework** — Next.js 14 App Router · TypeScript · Tailwind CSS
- **Agent model** — Anthropic Claude `claude-sonnet-4-5` (primary) with `claude-sonnet-4-20250514` fallback, via the official Anthropic SDK
- **Document generation** — `pptxgenjs` (PPT), `exceljs` (Excel), `@react-pdf/renderer` (PDF), `pdf-parse` (corpus ingestion)

## How to run v2

```
npm run dev
```

Then navigate to one of:

- `http://localhost:3000/director/segments/federal-hpc` (or any of the 5 segments)
- `http://localhost:3000/director/phase-gate`
- `http://localhost:3000/director/roadmap`

The active target is read from `data/targets/config.json` (currently `"cornelis"`). All UI and data flows resolve through that one switch.

To retarget for a different company:

1. Create `data/targets/<new-target-id>/` with `target.json`, `segments.json`, `products.json`, `roadmap.json`, `phase-gate.json`, and a `rag-corpus/` subdirectory of public-source documents
2. Update `active_target` in `data/targets/config.json`
3. Restart dev server — all UI, data loaders, and agents reconfigure for the new target automatically

## Branch scope

Branched as `v2-cornelis` from `main`. v1 code was deleted from this branch on 2026-05-19 to scope the deployment surface to v2 only; v1 remains fully intact on the `main` branch. This branch contains only the Director PM Framework code under `app/director/`, `app/api/director/`, `agents/director/`, `components/director/`, `data/targets/`, `lib/director/`, and `scripts/`, plus the shared root layout and Tailwind/Next config.

