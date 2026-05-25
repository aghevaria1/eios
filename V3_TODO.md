# V3 TODO

- **v3 content/framing pass (do during polish phase, NOT now):** scrub all "Director PM" / "Director PM Operating Framework" language and replace with the AI Factory Advisor framing. Locations: README, TopNav title, `lib/factory/framing.ts`, type-header comments. Note: do NOT touch "Director Class Switch" — that's a real Cornelis Omni-Path product name.

- **Full L1-L5 blast-radius strip = shared visual, design at 3c-2 (AMD multi-layer case), reuse for Cerebras.** 3c-1b ships a lightweight hardcoded L2-only version inline in `swap-report-card.tsx` (constants `ALL_LAYERS`, `FABRIC_SWAP_LAYER`, `FABRIC_SWAP_SLOT_LABEL`; sub-components `LayerBlastRadiusStrip` + `LayerStrip`). 3c-2 will need multi-layer highlighting (AMD lights up L2 + L4 + L5 — GPU + Models/NIM + Apps wrapper) — extract a reusable `<BlastRadius layers={highlightedLayers} changedCount={...} heldCount={...} slotLabel={...} switchingCostFraming={...} />` component then. Insight to preserve: blast-radius (layer count + KPI delta count) encodes switching cost — small radius = contained = low cost (fabric swap), wide radius = deep = high cost (AMD full-cake). Cerebras paradigm view (later) needs a different visual altogether — "different architecture, no blast radius applicable" — flag if forcing the same component.

## Cerebras — alternative-paradigm competitor (build after fabric swap 3c-1b + AMD full-cake 3c-2)

Cerebras enters the competitive view as its OWN paradigm contrast — **NOT a slot swap, NOT forced into the AMD full-cake template**. It's wafer-scale (WSE-3 / CS-3 system): a monolithic-wafer architecture, fundamentally different from NVIDIA's distributed-GPU-cluster approach.

**Representation: "different approach" — NVIDIA distributed vs Cerebras monolithic.** Show where each wins. Do NOT render it as a layer-by-layer NVIDIA-cake swap — it has no comparable fabric/GPU-count/NVLink layers because there's no inter-GPU fabric INSIDE a wafer.

**Segment relevance:**
- Strongest at **Frontier AI Labs** + **high-volume inference** (wafer-scale memory bandwidth → fast training + very-fast inference claims)
- Weakest at **Fortune 500 Enterprise** (no CUDA/NVAIE-equivalent ecosystem, narrow ISV support)
- This narrow-but-sharp profile is a **cleaner version of the AMD moat story**: challenger wins a specific hardware dimension, NVIDIA wins integration / ecosystem breadth

**Data discipline when built:** VERIFY current Cerebras specs + market position via web before seeding. Cerebras is a fast-moving company with heavily vendor-claimed numbers — IPO / funding / customer situation changes, WSE-3 specs, inference-speed claims all need web-check, not training-data assertion. Specs mostly **CLAIMED** (sky pills), same as GB200 / CN6000 / AMD Helios pre-launch discipline. Re-verify timing of WSE-4 / next-gen roadmap if any has been announced.

**Lighter fallback if timeline tight:** a Cerebras column in the **3c-3 heat-map** (segment × competitor) instead of a full paradigm view — captures segment relevance and the narrow-but-sharp moat story without the dedicated paradigm-contrast build. Use this if 3c-1b + 3c-2 consume more time than budgeted.

## Verify-needed / unresolved triage (handle per bucket, not uniformly)

The verify-needed flags across the corpus are NOT uniform — triage into two buckets with opposite treatment. The triage itself becomes the interview script.

**BUCKET A — resolvable with effort (verify → clear the flag → tag cited):**

- **B200 FP8 dense** — NVIDIA datasheet has this; never confirmed in our seeding pass. Likely clearable to a cited number with a focused datasheet read.
- **MI355X FP8** — sources spread 5 / 10 / 40 PFLOPS; almost certainly a dense-vs-sparse + generation confusion, not genuine uncertainty. Focused verify can probably nail dense FP8 with a clean source.
- **Vera Rubin specs** — resolves as a side-effect of building the roadmap pair (Vera Rubin vs MI455X) anyway, so the verification falls out of the build, not a separate pass.

→ **Action:** focused verification pass (web + datasheets), clear what's confirmable, tag cited with source. Do this as its own cleanup step (an "FP8 pass" focused on the dense/sparse split) — NOT blocking current milestones. Probably a 30-min session.

**BUCKET B — genuinely unknowable right now (leave flagged, EXPLAIN why — turn into credibility feature):**

- **Quantum-X800 latency / msg-rate magnitude** — NVIDIA doesn't publish per-hop latency for Quantum-X800. Unknowable because the data doesn't exist publicly, not because we haven't looked. (Note: Spectrum-X has the same property — we left it directional honestly.)
- **CN6000 collective-op large-scale breakpoint** — pre-production product (announced Nov 2025, sampling mid-2026); no independent measurement exists yet. The CN5000 breakpoint (~16-32 nodes) doesn't transfer with confidence to CN6000's RoCEv2 + UEC redesign.

→ **Action:** small "why this is flagged" treatment per flag — a legend or per-flag explanatory note distinguishing "we couldn't verify" from "this is genuinely unknowable right now." Low priority / polish phase. Possibly a `flag_reason: 'unknowable-public' | 'pre-production' | 'verify-pending'` field on Provenance, or just an explicit category-line in the note.

**Why the triage matters (the interview script):**

- Bucket A answer: "I verified these, here's the source." (demonstrates rigor — went and got the number)
- Bucket B answer: "Flagged on purpose — NVIDIA doesn't publish this / it's pre-production. I won't assert a number I can't defend." (demonstrates judgment — knows the difference between "I don't know" and "this is genuinely unknowable, here's why")

The Bucket B answer is the more valuable demonstration for a Principal / Director PM hire. The flags become a credibility feature when the triage is visible, not noise when they're treated uniformly.
