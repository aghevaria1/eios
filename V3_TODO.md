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
