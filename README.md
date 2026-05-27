# EIOS v3 — NVIDIA AI Factory Advisor

A decision-support tool for reasoning about NVIDIA AI-factory deployments: who buys them, how they're built, who competes for them, and how partners slot in. Built as a working model, not a slide deck — it **calculates** what can be calculated from cited specs, stays **directional** where the truth is genuinely uncertain, and makes that boundary explicit at every layer.

That boundary is the point. Anyone can assert numbers; the harder discipline is being precise about which numbers are computed, which are claimed, which are directional judgment, and which simply aren't knowable yet — and never letting a directional read masquerade as a fact. This app holds that line from the seeded data all the way through to the printable briefs.

---

## What's in it

Three views, one underlying engine and knowledge base:

- **Architect** (`/factory/architect`) — the customer-facing solution architect. Pick one of 6 customer segments, see the reference build (a 5-layer "cake" from facility → silicon → software → orchestration → ecosystem), drag a GPU-count slider and watch the build metrics (FLOPS, HBM, power, racks, CapEx) recompute live from cited per-GPU specs, with the delivered-KPI scorecard and TCO bands for that segment.

- **Competitive** (`/factory/competitive`) — five competitive lenses. A **Bird's Eye** segment×threat matrix (which competitor type threatens which segment), plus four depth analyses: **Full-Stack Replacement** (AMD, a 3-act analysis — where's the fight, the silicon race & the moat, the switching cost), **Slot Swaps** (the three fabric competitors), **Alternative Paradigm** (Cerebras), and **Customer Self-Supply** (the four hyperscaler in-house chips). The throughline: silicon is at parity; the moat lives at L3–L5 (ecosystem/software/orchestration), not in the chip.

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
