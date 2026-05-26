// Layer Fight Map — the cake as competitive surface, showing per-layer
// state for one competitor vs the NVIDIA baseline. Headline synthesis for
// any competitive comparison view.
//
// FOUR STATES (taxonomy — different competitors use different subsets):
//
//   CONTESTED  — competitor genuinely fights NVIDIA at this layer. Carries
//                WINNER (nvidia | competitor | tie) + STRENGTH (decisive |
//                moderate | close), and may carry a NUANCE label (e.g.
//                'workload-dependent' for AMD's L4).
//
//   N/A        — competitor doesn't play at this layer. Visually dimmed +
//                diagonal-stripe hatched to read as "out of play." MUST be
//                distinct from SHARED (a tie = even fight; N/A = no fight)
//                and from TIE (an even fight). Example: Broadcom (fabric
//                vendor) has nothing at L4/L5.
//
//   SHARED     — layer is present in both stacks identically — not a
//                differentiator. Example: AMD vs NVIDIA, the datacenter
//                (L1) and ISV/orchestration layer (L3) are the same
//                regardless of GPU vendor. Both stacks include them, but
//                the GPU choice doesn't change them.
//
//   PARADIGM   — competitor doesn't map to the layer model at all.
//                Example: Cerebras (wafer-scale = different paradigm).
//                Renders with explicit "doesn't map" treatment.
//
// HONESTY DISCIPLINE:
//   SHARED ≠ N/A ≠ TIE. Conflating them would either fabricate a fight
//   where none exists or hide one where it does. The taxonomy is the
//   guardrail — render them visually distinct.
//
// EXTENSIONS WIRED BUT NOT EXERCISED YET:
//   AMD (first instance) uses CONTESTED + SHARED only. The N/A hatch +
//   PARADIGM treatment + competitor-color variants are built in this
//   iteration because fabric (N/A) and Cerebras (PARADIGM) need them
//   later — building once vs reaching back to add states keeps the
//   component a stable surface across competitors.

import type { CSSProperties } from 'react'

export type LayerId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type ContestedWinner = 'nvidia' | 'competitor' | 'tie'
export type ContestedStrength = 'decisive' | 'moderate' | 'close'

// Discriminated union — each kind carries only the fields that make
// sense for it. Type-safety enables reuse across competitors without
// optional-field sprawl.
export type LayerState =
  | {
      kind: 'contested'
      winner: ContestedWinner
      strength: ContestedStrength
      // Optional nuance modifier (badge beside the state pill). Used for
      // AMD's L4 to surface workload-dependence without losing the
      // at-a-glance tie verdict.
      nuance?: string
    }
  | { kind: 'n/a' }
  | { kind: 'shared' }
  | { kind: 'paradigm' }

export interface LayerVerdict {
  layerId: LayerId
  layerName: string
  state: LayerState
  // Pre-composed concise label for the band body (e.g. 'NVIDIA — DECISIVE',
  // 'TIE — CLOSE', 'Same regardless of GPU vendor', 'not contested').
  // Caller composes this to keep wording control in one place.
  shortLabel: string
  // 1-2 sentence why. For SHARED/N/A, brief reason for the state.
  evidence: string
  // Optional bullet evidence (cited specifics — moat libraries, workload
  // splits, etc.).
  pointers?: string[]
  // Optional reference to the underlying data ('see scorecard below',
  // 'amd_rocm.kpi_values', etc.) — lets the reader trace verdicts back
  // to seeded data.
  sourceRef?: string
}

// Competitor colors — additive set. AMD = sky (matches existing sky pills
// in the win/loss scorecard). Cerebras planned amber. Purple held in
// reserve for a third competitor.
export type CompetitorColor = 'sky' | 'amber' | 'purple'

interface Props {
  competitorName: string
  competitorColor?: CompetitorColor // default sky
  verdicts: LayerVerdict[] // caller orders (typically L5 top → L1 bottom)
  narrative: string // pattern roll-up shown below the cake; no numeric score
}

export function LayerFightMap({
  competitorName,
  competitorColor = 'sky',
  verdicts,
  narrative,
}: Props) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          LAYER FIGHT MAP  ·  {competitorName} vs NVIDIA
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          The cake as competitive surface. Each layer is one of four states:
          <span className="text-amber-300"> CONTESTED</span> (real fight — read
          the winner + strength),
          <span className="text-gray-300"> SHARED</span> (present in both
          stacks identically — not a differentiator),
          <span className="text-gray-500"> N/A</span> (competitor doesn&apos;t
          play here — dimmed/hatched), or
          <span className="text-indigo-300"> PARADIGM</span> (doesn&apos;t map
          to the layer model). Order: L5 (top) → L1 (bottom).
        </div>
      </header>
      <div className="flex flex-col">
        {verdicts.map((v) => (
          <LayerBand
            key={v.layerId}
            verdict={v}
            competitorColor={competitorColor}
          />
        ))}
      </div>
      <NarrativeRollup narrative={narrative} />
    </section>
  )
}

// ─── One layer band — the visual unit of the cake ─────────────────────
function LayerBand({
  verdict,
  competitorColor,
}: {
  verdict: LayerVerdict
  competitorColor: CompetitorColor
}) {
  const styles = bandStyles(verdict.state, competitorColor)
  return (
    <div
      className={`relative border-b border-gray-800/60 px-5 py-4 ${styles.bg}`}
      style={styles.inlineStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div
            className={`text-[10px] font-mono font-semibold tracking-widest ${styles.layerIdText}`}
          >
            {verdict.layerId}  ·  {verdict.layerName}
          </div>
          <div className={`mt-1 text-sm font-semibold ${styles.shortLabelText}`}>
            {verdict.shortLabel}
          </div>
        </div>
        <StatePill state={verdict.state} competitorColor={competitorColor} />
      </div>
      <div className={`mt-2 text-xs leading-relaxed ${styles.evidenceText}`}>
        {verdict.evidence}
      </div>
      {verdict.pointers && verdict.pointers.length > 0 && (
        <ul
          className={`mt-2 space-y-0.5 text-[11px] leading-relaxed ${styles.pointersText}`}
        >
          {verdict.pointers.map((p, i) => (
            <li key={i}>
              <span className="text-gray-600">·</span> {p}
            </li>
          ))}
        </ul>
      )}
      {verdict.sourceRef && (
        <div className="mt-2 border-t border-gray-800/50 pt-2 text-[10px] italic leading-relaxed text-gray-500">
          {verdict.sourceRef}
        </div>
      )}
    </div>
  )
}

// ─── State pill (right of band) + optional nuance badge ──────────────
function StatePill({
  state,
  competitorColor,
}: {
  state: LayerState
  competitorColor: CompetitorColor
}) {
  const pill = pillFor(state, competitorColor)
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${pill.classes}`}
      >
        {pill.label}
      </span>
      {state.kind === 'contested' && state.nuance && (
        <span className="whitespace-nowrap rounded border border-dashed border-amber-400/50 bg-amber-500/5 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-amber-200">
          {state.nuance}
        </span>
      )}
    </div>
  )
}

// ─── Pill label + classes per state ──────────────────────────────────
function pillFor(
  state: LayerState,
  competitorColor: CompetitorColor,
): { label: string; classes: string } {
  if (state.kind === 'n/a') {
    return {
      label: 'N/A — NOT CONTESTED',
      classes: 'border-dashed border-gray-700 bg-gray-900/40 text-gray-500',
    }
  }
  if (state.kind === 'shared') {
    return {
      label: 'SHARED',
      classes: 'border-gray-600 bg-gray-800/40 text-gray-300',
    }
  }
  if (state.kind === 'paradigm') {
    return {
      label: 'PARADIGM — DOES NOT MAP',
      classes:
        'border-dashed border-indigo-400/50 bg-indigo-500/10 text-indigo-200',
    }
  }
  return {
    label: contestedLabel(state.winner, state.strength),
    classes: contestedPillClasses(state.winner, state.strength, competitorColor),
  }
}

function contestedLabel(
  winner: ContestedWinner,
  strength: ContestedStrength,
): string {
  const winnerWord =
    winner === 'nvidia'
      ? 'NVIDIA'
      : winner === 'competitor'
        ? 'COMPETITOR'
        : 'TIE'
  return `${winnerWord} · ${strength.toUpperCase()}`
}

function contestedPillClasses(
  winner: ContestedWinner,
  strength: ContestedStrength,
  competitorColor: CompetitorColor,
): string {
  if (winner === 'tie') {
    // Tie = amber neutral, strength tunes opacity.
    return strength === 'decisive'
      ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
      : 'border-amber-500/50 bg-amber-500/10 text-amber-200'
  }
  if (winner === 'nvidia') {
    return strength === 'decisive'
      ? 'border-[#76B900]/60 bg-[#76B900]/15 text-[#9FD848]'
      : 'border-[#76B900]/40 bg-[#76B900]/10 text-[#9FD848]'
  }
  // competitor wins — branch per color so Tailwind JIT picks up the literals.
  if (competitorColor === 'sky') {
    return strength === 'decisive'
      ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
      : 'border-sky-500/40 bg-sky-500/10 text-sky-200'
  }
  if (competitorColor === 'amber') {
    return strength === 'decisive'
      ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
      : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  }
  return strength === 'decisive'
    ? 'border-purple-500/60 bg-purple-500/15 text-purple-200'
    : 'border-purple-500/40 bg-purple-500/10 text-purple-200'
}

// ─── Band background + text colors per state ─────────────────────────
function bandStyles(
  state: LayerState,
  competitorColor: CompetitorColor,
): {
  bg: string
  inlineStyle?: CSSProperties
  layerIdText: string
  shortLabelText: string
  evidenceText: string
  pointersText: string
} {
  if (state.kind === 'n/a') {
    // Diagonal-stripe hatch + dimmed text = "out of play." Distinct from
    // SHARED gray (which is solid and at full opacity).
    return {
      bg: 'opacity-60',
      inlineStyle: {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(75,85,99,0.04) 0 6px, rgba(75,85,99,0.18) 6px 12px)',
      },
      layerIdText: 'text-gray-600',
      shortLabelText: 'italic text-gray-500',
      evidenceText: 'text-gray-500',
      pointersText: 'text-gray-600',
    }
  }
  if (state.kind === 'shared') {
    return {
      bg: 'bg-gray-700/15',
      layerIdText: 'text-gray-500',
      shortLabelText: 'italic text-gray-300',
      evidenceText: 'text-gray-400',
      pointersText: 'text-gray-500',
    }
  }
  if (state.kind === 'paradigm') {
    return {
      bg: 'bg-indigo-500/10',
      layerIdText: 'text-indigo-400',
      shortLabelText: 'text-indigo-200',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  // contested
  if (state.winner === 'tie') {
    return {
      bg: state.strength === 'decisive' ? 'bg-amber-500/12' : 'bg-amber-500/8',
      layerIdText: 'text-amber-400/80',
      shortLabelText: 'text-amber-200',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  if (state.winner === 'nvidia') {
    return {
      bg:
        state.strength === 'decisive'
          ? 'bg-[#76B900]/15'
          : 'bg-[#76B900]/8',
      layerIdText: 'text-[#76B900]',
      shortLabelText: 'text-[#9FD848]',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  // competitor wins — explicit per-color branches for Tailwind JIT
  if (competitorColor === 'sky') {
    return {
      bg: state.strength === 'decisive' ? 'bg-sky-500/15' : 'bg-sky-500/8',
      layerIdText: 'text-sky-300',
      shortLabelText: 'text-sky-200',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  if (competitorColor === 'amber') {
    return {
      bg: state.strength === 'decisive' ? 'bg-amber-500/15' : 'bg-amber-500/8',
      layerIdText: 'text-amber-300',
      shortLabelText: 'text-amber-200',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  return {
    bg:
      state.strength === 'decisive' ? 'bg-purple-500/15' : 'bg-purple-500/8',
    layerIdText: 'text-purple-300',
    shortLabelText: 'text-purple-200',
    evidenceText: 'text-gray-300',
    pointersText: 'text-gray-400',
  }
}

// ─── Narrative rollup ─────────────────────────────────────────────────
// Pattern paragraph that names the shape of the fight. No numeric score —
// the colored cake IS the score (per-layer at a glance), and a roll-up
// percentage would require defensible layer-weighting + miscount N/A
// layers + flatten the pattern.
function NarrativeRollup({ narrative }: { narrative: string }) {
  return (
    <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-4">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        PATTERN
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-300">{narrative}</p>
    </div>
  )
}
