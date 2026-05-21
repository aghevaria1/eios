// Day-1 framing constants for EdgeInferenceOS v2.
// Used by all in-app chrome (banners, footers, sidebars) and embedded into
// every export (PDF cover sections, Excel rows 1-3, PPT slide footers + speaker notes).
// Source of truth — do not duplicate framing copy elsewhere.

export const DAY_1_FRAMING = {
  fullStatement:
    'Day 1 Thinking Artifact — Synthesized from publicly available materials — Ready for correction by the team. Authored by Ashit Ghevaria, built in Claude Code as a structured proposal for how a Director PM would approach the Cornelis Networks role in their first 90 days.',
  shortBanner: 'Day 1 Thinking Artifact — synthesized from public materials',
  footerShort: 'Day 1 Thinking Artifact — Ready for correction by the team',
  exportCoverIntro:
    "This document is a Day 1 thinking artifact. It represents a candidate's structured proposal for how he would approach a Director PM role at Cornelis Networks. All product, customer, and roadmap details are synthesized from publicly available materials. It is not a representation of Cornelis Networks' internal operating model, roadmap commitments, or customer relationships. It is intended for discussion and is ready for correction by the team.",
  methodologyPhaseGate:
    'Proposed tracking framework — actual phase-gate states would be informed by internal program data.',
  methodologyEOL:
    'Methodology only — actual dates determined by installed-base and migration data.',
} as const

export type Day1FramingKey = keyof typeof DAY_1_FRAMING
