// Layer Fight Map — the cake as competitive surface, showing per-layer
// state for one competitor vs the NVIDIA baseline. Headline synthesis for
// any competitive comparison view.
//
// FIVE STATES (taxonomy — different competitors use different subsets):
//
//   CONTESTED  — competitor genuinely fights NVIDIA at this layer. Carries
//                WINNER (nvidia | competitor | tie | split) + STRENGTH
//                (decisive | moderate | close), and may carry a NUANCE
//                label. The 'split' winner means each side leads its own
//                axis (e.g. Broadcom leads scale + economics; NVIDIA leads
//                integration + SHARP) — NOT a single winner. Split verdicts
//                carry structural nvidiaAxis[] + competitorAxis[] fields
//                that force both sides to be named (parallel to how
//                AGNOSTIC requires freedom[] + optimizationTradeoff[]).
//
//   AGNOSTIC   — competitor fields NO offering at this layer, but unlike
//                NVIDIA does not LOCK this layer either — openness is
//                itself a competitive property vs NVIDIA's lock-in/gravity.
//                Structural honesty guard: every AGNOSTIC verdict MUST
//                carry both freedom[] (what the openness frees) AND
//                optimizationTradeoff[] (what NVIDIA's lock-in delivers
//                that's lost). The type system makes "open = better"
//                framing impossible. Rendered as a two-column body with a
//                "Customer-dependent — open ≠ better" italic disclaimer.
//                Distinct from N/A (competitor absent AND irrelevant) and
//                SHARED (present-and-identical). Example: Cornelis at
//                L2-gpu / L3 / L4 / L5 — they don't field offerings there
//                but their open-fabric posture frees those layers from
//                NVIDIA pull.
//
//   N/A        — competitor doesn't play at this layer AND it's irrelevant
//                to the competitive story (no openness story either).
//                Visually dimmed + diagonal-stripe hatched. Example: any
//                fabric vendor at L1 — they have no datacenter offering
//                and no opinion about facilities.
//
//   SHARED     — layer is present in both stacks identically — not a
//                differentiator. Both vendors play, with identical outcomes.
//                Example: AMD vs NVIDIA L1 / L3 — both stacks include the
//                datacenter and ISV layer; the GPU choice doesn't change
//                them.
//
//   PARADIGM   — competitor doesn't map to the layer model at all.
//                Example: Cerebras (wafer-scale = different paradigm).
//
// HONESTY DISCIPLINE:
//   The 5 states encode genuinely different competitive realities. The
//   discriminated union enforces what fields each state must carry
//   (split → nvidiaAxis + competitorAxis; agnostic → freedom +
//   optimizationTradeoff). The type system is the guardrail against
//   collapsing distinct states into a misleading single label.

import type { CSSProperties } from 'react'

// L2 has optional sub-slot variants: full-stack competitors (AMD) use 'L2'
// for the whole compute+fabric layer; point-solution competitors split it
// to surface "absent at compute, present at networking" (fabric vendors).
export type LayerId =
  | 'L1'
  | 'L2'
  | 'L2-gpu'
  | 'L2-fabric'
  | 'L3'
  | 'L4'
  | 'L5'

export type ContestedWinner = 'nvidia' | 'competitor' | 'tie' | 'split'
export type ContestedStrength = 'decisive' | 'moderate' | 'close'

// Discriminated union — each kind carries only the fields that make sense
// for it. Type-safety enables reuse across competitors without optional-
// field sprawl, and forces both sides to be named for split + agnostic
// states (the honesty guardrails).
export type LayerState =
  | {
      kind: 'contested'
      winner: ContestedWinner
      strength: ContestedStrength
      nuance?: string
      // REQUIRED when winner === 'split': each side's axis list. Forces
      // the verdict to name what BOTH sides lead, preventing "competitor
      // leads" overreach. Strength on a split verdict means "how cleanly
      // the split decomposes" (decisive = clean axis decomposition).
      nvidiaAxis?: string[]
      competitorAxis?: string[]
    }
  | { kind: 'n/a' }
  | { kind: 'shared' }
  | { kind: 'paradigm' }
  | {
      kind: 'agnostic'
      // Structurally required — type-enforced "freedom vs optimization"
      // tradeoff framing. Both arrays MUST be populated.
      freedom: string[]
      optimizationTradeoff: string[]
    }

export interface LayerVerdict {
  layerId: LayerId
  layerName: string
  state: LayerState
  shortLabel: string
  evidence: string
  pointers?: string[]
  sourceRef?: string
}

export type CompetitorColor = 'sky' | 'amber' | 'purple' | 'cyan'

interface Props {
  competitorName: string
  competitorColor?: CompetitorColor // default sky
  verdicts: LayerVerdict[]
  narrative: string
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
          The cake as competitive surface. Five states encode genuinely
          different competitive realities:
          <span className="text-amber-300"> CONTESTED</span> (real fight —
          winner can be split-by-axis to avoid overclaiming),
          <span className="text-teal-300"> AGNOSTIC</span> (competitor
          fields nothing here but its openness frees the layer from NVIDIA
          lock-in — tradeoff vs optimization),
          <span className="text-gray-300"> SHARED</span> (present in both
          stacks identically — not a differentiator),
          <span className="text-gray-500"> N/A</span> (competitor doesn&apos;t
          play AND it&apos;s irrelevant — dimmed/hatched), or
          <span className="text-indigo-300"> PARADIGM</span> (doesn&apos;t
          map to the layer model). Order: L5 (top) → L1 (bottom).
        </div>
      </header>
      <div className="flex flex-col">
        {verdicts.map((v) => (
          <LayerBand
            key={v.layerId}
            verdict={v}
            competitorName={competitorName}
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
  competitorName,
  competitorColor,
}: {
  verdict: LayerVerdict
  competitorName: string
  competitorColor: CompetitorColor
}) {
  const styles = bandStyles(verdict.state, competitorColor)
  const renderTwoColumn = shouldRenderTwoColumn(verdict.state)
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
      {renderTwoColumn && (
        <TwoColumnBody
          state={verdict.state}
          competitorName={competitorName}
          competitorColor={competitorColor}
        />
      )}
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

function shouldRenderTwoColumn(state: LayerState): boolean {
  if (state.kind === 'agnostic') return true
  if (state.kind === 'contested' && state.winner === 'split') return true
  return false
}

// ─── Two-column body — used by AGNOSTIC and CONTESTED-SPLIT ──────────
// Both states share the same structural visual: two parallel columns
// naming each side, italic disclaimer at the bottom. The discipline:
// the type system requires both sides to be populated; the visual makes
// the tradeoff land.
function TwoColumnBody({
  state,
  competitorName,
  competitorColor,
}: {
  state: LayerState
  competitorName: string
  competitorColor: CompetitorColor
}) {
  if (state.kind === 'agnostic') {
    return (
      <TwoColumnLayout
        leftHeader="FREEDOM"
        leftHeaderClass={openFreedomHeaderClasses(competitorColor)}
        leftItems={state.freedom}
        rightHeader="OPTIMIZATION TRADEOFF"
        rightHeaderClass="text-[#9FD848]"
        rightItems={state.optimizationTradeoff}
        footer="Customer-dependent — open ≠ better; lock-in buys real optimization."
      />
    )
  }
  if (state.kind === 'contested' && state.winner === 'split') {
    return (
      <TwoColumnLayout
        leftHeader={`${competitorName.toUpperCase()} LEADS`}
        leftHeaderClass={competitorHeaderClasses(competitorColor)}
        leftItems={state.competitorAxis ?? []}
        rightHeader="NVIDIA LEADS"
        rightHeaderClass="text-[#9FD848]"
        rightItems={state.nvidiaAxis ?? []}
        footer="Customer-dependent — depends on what you optimize for. Different axes, not a single winner."
      />
    )
  }
  return null
}

function TwoColumnLayout({
  leftHeader,
  leftHeaderClass,
  leftItems,
  rightHeader,
  rightHeaderClass,
  rightItems,
  footer,
}: {
  leftHeader: string
  leftHeaderClass: string
  leftItems: string[]
  rightHeader: string
  rightHeaderClass: string
  rightItems: string[]
  footer: string
}) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ColumnBlock header={leftHeader} headerClass={leftHeaderClass} items={leftItems} />
        <ColumnBlock header={rightHeader} headerClass={rightHeaderClass} items={rightItems} />
      </div>
      <div className="mt-2 text-[10px] italic leading-relaxed text-gray-500">
        {footer}
      </div>
    </div>
  )
}

function ColumnBlock({
  header,
  headerClass,
  items,
}: {
  header: string
  headerClass: string
  items: string[]
}) {
  return (
    <div className="rounded border border-gray-800/60 bg-gray-950/30 p-3">
      <div className={`text-[10px] font-mono font-semibold tracking-widest ${headerClass}`}>
        {header}
      </div>
      <ul className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-gray-300">
        {items.map((it, i) => (
          <li key={i}>
            <span className="text-gray-600">·</span> {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function competitorHeaderClasses(competitorColor: CompetitorColor): string {
  if (competitorColor === 'sky') return 'text-sky-300'
  if (competitorColor === 'amber') return 'text-amber-300'
  if (competitorColor === 'cyan') return 'text-cyan-300'
  return 'text-purple-300'
}

function openFreedomHeaderClasses(competitorColor: CompetitorColor): string {
  // For AGNOSTIC, the "freedom" side reads as competitor-flavored openness.
  // Reuse the competitor color so the cross-competitor identity stays
  // consistent across AGNOSTIC and CONTESTED-SPLIT bands.
  return competitorHeaderClasses(competitorColor)
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
        <span className="max-w-[200px] whitespace-normal rounded border border-dashed border-amber-400/50 bg-amber-500/5 px-1.5 py-0.5 text-right text-[9px] font-mono uppercase leading-tight tracking-widest text-amber-200">
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
  if (state.kind === 'agnostic') {
    return {
      label: 'AGNOSTIC / OPEN',
      classes:
        'border-dashed border-teal-400/60 bg-teal-500/10 text-teal-200',
    }
  }
  // contested
  if (state.winner === 'split') {
    return {
      label: 'SPLIT — BY AXIS',
      classes:
        'border-dashed border-amber-400/60 bg-amber-500/8 text-amber-100',
    }
  }
  return {
    label: contestedLabel(state.winner, state.strength),
    classes: contestedPillClasses(state.winner, state.strength, competitorColor),
  }
}

function contestedLabel(
  winner: 'nvidia' | 'competitor' | 'tie',
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
  winner: 'nvidia' | 'competitor' | 'tie',
  strength: ContestedStrength,
  competitorColor: CompetitorColor,
): string {
  if (winner === 'tie') {
    return strength === 'decisive'
      ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
      : 'border-amber-500/50 bg-amber-500/10 text-amber-200'
  }
  if (winner === 'nvidia') {
    return strength === 'decisive'
      ? 'border-[#76B900]/60 bg-[#76B900]/15 text-[#9FD848]'
      : 'border-[#76B900]/40 bg-[#76B900]/10 text-[#9FD848]'
  }
  // competitor wins
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
  if (competitorColor === 'cyan') {
    return strength === 'decisive'
      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200'
      : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
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
    // Distinct visual treatment from the other 5 states:
    //   · Indigo background (signature PARADIGM color)
    //   · Vertical-stripe pattern (PERPENDICULAR to N/A's diagonal hatch)
    //     — signals "monolithic columnar architecture, not separate layers"
    //   · Connecting left-border (border-l-2 indigo-400/60) — when every
    //     band in a fight-map is PARADIGM, the left-edges align across the
    //     stack and visually read as ONE continuous line running through
    //     the whole cake, the doesn't-decompose insight.
    return {
      bg: 'bg-indigo-500/10 border-l-2 border-l-indigo-400/60',
      inlineStyle: {
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(99,102,241,0.02) 0 6px, rgba(99,102,241,0.10) 6px 8px)',
      },
      layerIdText: 'text-indigo-300',
      shortLabelText: 'italic text-indigo-200',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  if (state.kind === 'agnostic') {
    // Subtle teal tint + dashed border (open/unlocked motif). The body
    // does the heavy lifting via the two-column FREEDOM/TRADEOFF layout.
    return {
      bg: 'bg-teal-500/5',
      inlineStyle: { borderBottomStyle: 'dashed' },
      layerIdText: 'text-teal-300',
      shortLabelText: 'text-teal-100',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
  // contested
  if (state.winner === 'split') {
    // Two-color gradient: competitor color on left → NVIDIA-green on right.
    // Visually signals "both sides win different axes" before the reader
    // reaches the two-column body. Explicit per-color branches for
    // Tailwind JIT (arbitrary-color gradient stops must be literal strings).
    if (competitorColor === 'sky') {
      return {
        bg: 'bg-gradient-to-r from-sky-500/10 to-[#76B900]/10',
        layerIdText: 'text-amber-300',
        shortLabelText: 'text-amber-100',
        evidenceText: 'text-gray-300',
        pointersText: 'text-gray-400',
      }
    }
    if (competitorColor === 'amber') {
      return {
        bg: 'bg-gradient-to-r from-amber-500/10 to-[#76B900]/10',
        layerIdText: 'text-amber-300',
        shortLabelText: 'text-amber-100',
        evidenceText: 'text-gray-300',
        pointersText: 'text-gray-400',
      }
    }
    if (competitorColor === 'cyan') {
      return {
        bg: 'bg-gradient-to-r from-cyan-500/10 to-[#76B900]/10',
        layerIdText: 'text-amber-300',
        shortLabelText: 'text-amber-100',
        evidenceText: 'text-gray-300',
        pointersText: 'text-gray-400',
      }
    }
    return {
      bg: 'bg-gradient-to-r from-purple-500/10 to-[#76B900]/10',
      layerIdText: 'text-amber-300',
      shortLabelText: 'text-amber-100',
      evidenceText: 'text-gray-300',
      pointersText: 'text-gray-400',
    }
  }
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
  // competitor wins (clean — not split)
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
  if (competitorColor === 'cyan') {
    return {
      bg: state.strength === 'decisive' ? 'bg-cyan-500/15' : 'bg-cyan-500/8',
      layerIdText: 'text-cyan-300',
      shortLabelText: 'text-cyan-200',
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
