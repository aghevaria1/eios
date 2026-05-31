# EIOS v3 — NVIDIA AI Factory Advisor

A decision-support tool for reasoning about NVIDIA AI-factory deployments: who buys them, how they're built, who competes for them, and how partners slot in. Built as a working model, not a slide deck — it **calculates** what can be calculated from cited specs, stays **directional** where the truth is genuinely uncertain, and makes that boundary explicit at every layer.

That boundary is the point. Anyone can assert numbers; the harder discipline is being precise about which numbers are computed, which are claimed, which are directional judgment, and which simply aren't knowable yet — and never letting a directional read masquerade as a fact. This app holds that line from the seeded data all the way through to the printable briefs.

**Live:** [eios-v3.vercel.app](https://eios-v3.vercel.app)

---

## What's in it

Three views, one underlying engine and knowledge base:

- **Architect** (`/factory/architect`) — the customer-facing solution architect. Pick one of 6 customer segments, see the reference build (a 5-layer "cake" from facility → silicon → software → orchestration → ecosystem), drag a GPU-count slider and watch the build metrics (FLOPS, HBM, power, racks, CapEx) recompute live from cited per-GPU specs, with the delivered-KPI scorecard and TCO bands for that segment.

- **Competitive** (`/factory/competitive`) — five competitive lenses. A **Bird's Eye** segment×threat matrix (which competitor type threatens which segment), plus four depth analyses: **Full-Stack Replacement** (AMD, a 3-act analysis — where's the fight, the silicon race & the moat, the switching cost), **Slot Swaps** (the three fabric competitors), **Alternative Paradigm** (Cerebras), and **Customer Self-Supply** (the four hyperscaler in-house chips). The throughline: silicon is at parity; the moat lives at L3–L5 (ecosystem/software/orchestration), not in the chip.

  The Bird's Eye matrix is 6 segments × 4 threat types — rows are who's being targeted, columns are who's targeting them, and each cell carries a directional threat verdict (PRIMARY / SECONDARY / NICHE / N/A) sourced from the depth analyses. Hyperscalers face two primary threats (Slot Swaps and Customer Self-Supply); Industry Verticals face one niche threat and three deliberate N/As; Neocloud's self-supply cell is a deliberate N/A (neoclouds don't build their own silicon — antithetical to the GPU-rental model), matching the same honest-absence framing used across the rest of the app. Click any non-N/A cell to drill into that competitor type's depth view.

- **Partner** (`/factory/partner`) — the partner lens. Toggle OEM / ISV / Neocloud-as-channel, segment-aware, showing each partner's responsibility slot, the operational KPIs they own (with honest "not seeded for this segment" gaps), and the co-sell motion as a partner-PM mental model.

Each view generates an **audience-targeted printable brief** (customer / sales / partner) capturing the view's current state — the provenance carries through unchanged, so a brief never reads more confident than the view it came from.

---

## End-to-end architecture

The whole app is one pipeline, and **provenance is preserved at every hop** — a value's honesty status (calculated / cited / directional / verify-needed) travels with it from the seed file to the printed brief, and is never upgraded along the way.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. SEEDED KNOWLEDGE         the ground truth, each value provenance-tagged │
│     • stack.json             NVIDIA L1–L5 components + competitor parts      │
│                              (AMD, fabric x3, Cerebras, hyperscaler chips)   │
│     • segments.json          6 customer segments — archetype, buying         │
│                              behavior, north-star, delivered-KPIs, blend     │
│     • kpi definitions        the KPI catalog + provenance model              │
│     provenance states:  CITED · CALCULATED · DIRECTIONAL · VERIFY-NEEDED     │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. ENGINE                  resolves data → values, computes consequences   │
│     • loadKnowledge          loads + validates the seeded layer              │
│     • KPI resolver           segment-first (segment.delivered_kpis) →        │
│                              component fallback                              │
│     • applySwap              dependency cascade: swap a component →           │
│                              { changed, held, unverified }                   │
│     • calculated metrics     FLOPS/HBM/power/racks/CapEx computed live from   │
│                              cited specs at the current slider value         │
│     (no value is invented here — everything traces to the seed + inputs)     │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. VIEWS                   consume engine output, render with provenance   │
│     • /architect             segment build + slider + delivered KPIs         │
│     • /competitive           Bird's Eye + 4 depth modes                      │
│     • /partner               OEM/ISV/Neocloud × segment                      │
│     (each renders the SAME ProvenancePill — views can't drift from truth)    │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. ARTIFACTS               audience-targeted printable briefs              │
│     • customer brief         from architect — what you're buying + cost      │
│     • sales brief            from competitive — verdict + moat + talk track   │
│     • partner brief          from partner — slot + owned KPIs + co-sell       │
│     (button per view · captures current state · print-to-PDF)                │
└─────────────────────────────────────────────────────────────────────────┘

   ◀══════════════ PROVENANCE THROUGHLINE (the spine) ═══════════════▶
   A CALCULATED value renders CALCULATED in the brief. A DIRECTIONAL read
   stays DIRECTIONAL. A VERIFY-NEEDED gap stays a gap. Single source of
   truth: the briefs reuse the views' rendering components, so nothing is
   ever silently upgraded to false confidence between seed and print.
```

---

## The honesty model

The provenance states are the backbone, and they mean specific things:

- **CITED** — sourced from a public, verifiable spec or disclosure (e.g. a published per-GPU memory figure). Traceable.
- **CALCULATED** — computed live from cited inputs (e.g. total FLOPS = per-GPU FLOPS × slider count). Carries compound provenance: a calculated value built on a verify-needed input is flagged as such, not laundered into certainty.
- **DIRECTIONAL** — synthesis judgment where configuration doesn't determine the answer (e.g. the L3–L5 moat trajectory, the competitive threat verdicts). Honest about being a read, not a measurement.
- **VERIFY-NEEDED** — a value that should be checked before relying on it; surfaced, not hidden.
- **N/A (honest absence)** — where something genuinely doesn't apply (e.g. self-supply for neoclouds, a partner KPI a segment doesn't prioritize), rendered as a deliberate, explained gap — never a fabricated low score.

Where the data doesn't support a claim, the app says so. Competitor strengths are conceded explicitly (concede-then-locate, never an NVIDIA sweep). Partner KPI gaps are framed as deliberate segment scoping. System integrators and distributors are named as real partner motions consciously left out for lack of seeded data, rather than faked. The boundary between what's computed and what's judged is the senior judgment the tool is built to demonstrate.

---

## Technical

**Stack:** Next.js (App Router) · TypeScript · deployed on Vercel.

**Routes** (all under `/factory`):

| Route | Role |
|---|---|
| `/factory/architect` | 6-segment selector · 5-layer build · live calculated metrics (slider) · delivered-KPI panel · TCO bands |
| `/factory/competitive` | Bird's Eye matrix + 4 depth modes (AMD / fabric / Cerebras / hyperscaler self-supply) |
| `/factory/partner` | OEM / ISV / Neocloud-as-channel toggle, segment-aware · slot diagram · KPI scorecard · co-sell mental model |

**Data layer** (`data/targets/nvidia/knowledge/`):
- `stack.json` — NVIDIA components across L1–L5 plus competitor parts; each KPI value provenance-tagged.
- `segments.json` — the 6 customer segments (frontier, hyperscaler, neocloud, fortune-500, sovereign, industry-vertical), each with archetype, buying behavior, north-star KPI, delivered-KPIs, architecture blend, and (for neocloud) the customer-AND-channel note.
- `lib/factory/kpi/` — KPI definitions + the provenance model.

**Engine** (`lib/factory/`):
- `loadKnowledge` — loads and validates the seeded layer.
- KPI resolver — segment-first (`segment.delivered_kpis`), component fallback.
- `applySwap` — the dependency cascade; returns `{ changed, held, unverified }` when a component is swapped.
- Calculated-metrics layer — derives FLOPS / HBM / power / racks / CapEx live from cited per-GPU specs at the current slider value, with compound provenance.

**Provenance rendering:** all views and all briefs render the same `ProvenancePill` component and shared formatters — there is no brief-specific pill, which is what structurally guarantees the briefs can't drift from the views.

**Artifact layer:** each view has a "Generate Brief" button (top of view) that opens a one-page, print-ready overlay capturing the view's current interactive state; export is the browser's native print-to-PDF.

### Run locally

```bash
npm install
npm run dev      # http://localhost:3000/factory/architect
npm run build    # production build
```

---

## Roadmap — where this goes next

The architecture was chosen for evolution. Two improvements, one story: make the retrieval and tool layers explicit, and the whole app becomes live. *(Framed as the designed-for trajectory — not capability the app claims today.)*

**1. Make RAG + MCP explicit (the mechanism).** Today the knowledge is seeded JSON resolved by a deterministic engine — the retrieval and tool layers are implicit. The next layer makes them first-class: a retrievable vector corpus (RAG) over the knowledge base, and live source/tool ingestion via MCP. (This is a pattern proven elsewhere in production — it's an architectural maturation, not a rewrite.)

**2. Real-time industry updates (the capability it unlocks).** When a competitor ships a capability or a vendor signs a new ISV, the app ingests it and every view + brief re-projects — because all views are projections of one provenance-tagged knowledge base. One change, propagated everywhere, with the honesty model intact.

The two connect as a single pipeline extension:

```
new competitor / partner move
        │
        ▼
   MCP ingests  →  RAG corpus updates  →  provenance-tagged KB updates  →  every view + brief re-projects
```

The single-source-of-truth knowledge base (one KB feeding all views) was a deliberate choice precisely to make this propagation possible — the roadmap is what the architecture was designed to enable, not a bolt-on.

---

## Recent additions

Newest first. The version tags are a presentation convention for this README — not git tags. Polish-only commits are omitted; only capability adds appear.

- **v3.11 — Artifact layer.** Three audience-targeted printable briefs (customer / sales / partner), one per view, captured at the view's current interactive state and rendered through the same provenance components — a brief never reads more confident than the view it came from.

- **v3.10 — Neocloud as 6th customer segment.** Added end-to-end across segment seed, selector, slider defaults, grounding, Bird's-Eye row, and partner-lens reuse — grounded in the January 2026 CoreWeave SUNK + Mission Control integration into NVIDIA's reference architectures for cloud partners.

- **v3.9 — Partner lens (`/factory/partner`).** OEM / ISV / Neocloud-as-channel toggle, segment-aware, with seeded-KPI scorecard and honest *"not seeded for this segment"* gap framing; system integrators and distributors consciously out of scope, not faked.

- **v3.8 — AMD competitive view redesign.** 3-act recomposition (where's the fight / silicon race & the L3–L5 moat / switching cost), table-based throughout for readability, with the moat-trajectory panel and switching-cost articulation replacing the older KPI-list framing.

- **v3.7 — Bird's Eye matrix.** Segment × threat-type breadth view at the entry of the competitive tab, 5-state taxonomy with N/A as honest absence, every cell directional, click-through to depth views.

- **v3.6 — Customer Self-Supply view.** Fourth competitive type — hyperscaler in-house silicon (TPU / Trainium / MTIA / Maia) as a strategic panel: four maturity-differentiated cards plus a 5-facet calibrated verdict.

- **v3.5 — Alternative Paradigm view (Cerebras).** Sixth taxonomy state (PARADIGM) first use — six-band *doesn't decompose* cake plus cross-layer contrast panel plus 3-facet verdict (NICHE-SHARP / SERIOUS-BUT-NARROW / MARKET-ARC).

- **v3.4 — Fabric fight-maps.** AGNOSTIC fifth taxonomy state and split-by-axis verdicts for Cornelis / Broadcom / Arista — each named for their distinct axis (performance / scale / operational) rather than reduced to a single winner.

- **v3.3 — Calculated KPIs + GPU slider.** Live FLOPS / HBM / power / racks / CapEx from cited per-GPU specs at the current slider value, with compound provenance badges that propagate verify-needed inputs into the calculated output.

- **v3.2 — Segment grounding.** Per-segment archetype + buying-behavior + representative-deployment lines, plus the hyperscaler dual-role cross-reference (customer AND competitor) and, later, the neocloud customer-AND-channel note.

- **v3.1 — ROCm software layer + layer-fight-map.** First competitor (AMD) on the per-layer synthesis view, introducing the 4-state then 5-state taxonomy with SHARED / contested honesty.

- **v3.0 — Foundation.** Verified corpus, dependency-graph KPI engine (segment-first → component fallback, applySwap dependency cascade), 5-layer cake at `/factory/architect`, delivered-KPIs panel, CapEx/OpEx directional bars, segment-first resolver, all six segments seeded with delivered KPIs.

---

## The six customer segments

| Segment | Optimizes for |
|---|---|
| Frontier AI Labs | frontier-scale training/inference performance |
| Hyperscalers | TCO/token at platform scale (and they build their own silicon) |
| Neocloud | fleet utilization + time-to-capacity (the rental-margin model) |
| Fortune 500 Enterprise | deployment cycle + compliance |
| Sovereign AI | data residency + air-gap + portability |
| Industry Verticals | safety certification + vertical fit |

Neocloud (e.g. CoreWeave, Nebius, Lambda, Crusoe) is both a major customer **and** a go-to-market channel — reflected in the partner lens, and grounded in the January 2026 integration of CoreWeave's SUNK and Mission Control into NVIDIA's reference architectures for cloud partners.
