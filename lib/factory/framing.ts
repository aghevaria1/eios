// Day-1 framing constants. Used by Day1Banner + Day1Footer (the only active
// consumers — `shortBanner` and `footerShort`). The longer-form constants
// (`fullStatement`, `exportCoverIntro`, methodology lines) are reserved for
// future export embedding (PDF covers, Excel rows, PPT speaker notes) but
// not currently wired up to any export builder.
//
// Phrasing kept role-neutral so it serves both demo contexts unchanged:
//   v2-cornelis  — Director PM Operating Framework for Cornelis Networks
//   v3-nvidia    — AI Factory Advisor (NVIDIA partner-PM)
// Source of truth — do not duplicate framing copy elsewhere.

export const DAY_1_FRAMING = {
  fullStatement:
    'Day 1 Thinking Artifact — Synthesized from publicly available materials — Ready for correction by the team. Authored by Ashit Ghevaria, built in Claude Code as a structured proposal for how a Product Manager would approach the role in their first 90 days.',
  shortBanner: 'Day 1 Thinking Artifact — synthesized from public materials',
  footerShort: 'Day 1 Thinking Artifact — Ready for correction by the team',
  exportCoverIntro:
    "This document is a Day 1 thinking artifact. It represents a candidate's structured proposal for how they would approach a Product Manager role. All product, customer, and roadmap details are synthesized from publicly available materials. It is not a representation of any company's internal operating model, roadmap commitments, or customer relationships. It is intended for discussion and is ready for correction by the team.",
  methodologyPhaseGate:
    'Proposed tracking framework — actual phase-gate states would be informed by internal program data.',
  methodologyEOL:
    'Methodology only — actual dates determined by installed-base and migration data.',
} as const

export type Day1FramingKey = keyof typeof DAY_1_FRAMING
