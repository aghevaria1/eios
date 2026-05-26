'use client'

// Breadth Heat-Map — 5th competitive tab. Orthogonal to the 4 depth tabs.
//
// The 4 depth tabs answer "which competitor in which depth"; this tab
// answers "which segment faces which threat." Different axis, same truth.
//
// 5-state cell taxonomy (mirrors the fight-map honesty discipline):
//   · PRIMARY THREAT      strong threat — top-3 in this segment
//   · SECONDARY           credible but not primary
//   · NICHE               only relevant for narrow use cases in this segment
//   · N/A — not a threat  competitor doesn't threaten this segment — honest absence
//   · CONDITIONAL         threat depends on a sub-condition (reserved — unused today)
//
// 4 columns grouped by competitive TYPE (mirrors the 4-tab framework):
//   REPLACE (AMD) · POINT-SOLUTION (fabric) · PARADIGM (Cerebras) ·
//   SELF-SUPPLY (hyperscaler silicon).
//
// HONESTY DISCIPLINE:
//   · Every cell carries a DIRECTIONAL pill — cell verdicts are authored
//     synthesis on verified data, NOT engine-computed
//   · N/A cells render dimmed + diagonal hatch — visible "not a threat here,"
//     never a fabricated low score
//   · Each cell's threat-level is consistent with the matching competitor's
//     fight-map verdict (breadth and depth = same truth, two angles)
//   · Click-through navigates to the relevant depth tab (cell → mode switch)

import type { CompetitiveMode } from './competitive-mode-switcher'

type ThreatState =
  | 'primary'
  | 'secondary'
  | 'niche'
  | 'na'
  | 'conditional'

interface Cell {
  state: ThreatState
  why: string
  targetMode: CompetitiveMode | null // null for N/A (no click-through)
}

interface SegmentRow {
  segmentId: string
  segmentName: string
  segmentSubtitle: string
  cells: {
    replace: Cell
    pointSolution: Cell
    paradigm: Cell
    selfSupply: Cell
  }
}

// Column labels mirror the depth-tab names verbatim so each column reads
// identically to the tab it clicks through to. Order matches tab order
// after the reorder (Full-Stack Replacement first, then Slot Swaps, etc.).
// Click-through TARGETS are keyed by content (replace → 'replacement',
// pointSolution → 'slot', etc.) — reorder doesn't change targets.
const COLUMN_LABELS: Array<{
  key: keyof SegmentRow['cells']
  label: string
  sublabel: string
}> = [
  { key: 'replace', label: 'Full-Stack Replacement', sublabel: 'AMD' },
  { key: 'pointSolution', label: 'Slot Swaps', sublabel: 'fabric (Cornelis · Broadcom · Arista)' },
  { key: 'paradigm', label: 'Alternative Paradigm', sublabel: 'Cerebras' },
  { key: 'selfSupply', label: 'Customer Self-Supply', sublabel: 'hyperscaler silicon' },
]

const ROWS: SegmentRow[] = [
  {
    segmentId: 'frontier-ai-labs',
    segmentName: 'Frontier AI Labs',
    segmentSubtitle: 'e.g. Anthropic, xAI',
    cells: {
      replace: {
        state: 'secondary',
        why: 'memory-bound competitive; ecosystem moat holds',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'primary',
        why: 'large-scale training fabric-bound; Cornelis HPC-tuning + Broadcom 1024-node scale-up + Arista hyperscaler-proven all credible',
        targetMode: 'slot',
      },
      paradigm: {
        state: 'secondary',
        why: 'frontier-lab inference deployments (OpenAI 750 MW) — credible inference-share threat; training stays NVIDIA',
        targetMode: 'paradigm',
      },
      selfSupply: {
        state: 'secondary',
        why: 'labs building their own — Anthropic on Trainium etc.',
        targetMode: 'self-supply',
      },
    },
  },
  {
    segmentId: 'hyperscalers',
    segmentName: 'Hyperscalers',
    segmentSubtitle: 'e.g. Google Cloud, Azure',
    cells: {
      replace: {
        state: 'secondary',
        why: 'multi-vendor diversification',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'primary',
        why: 'open-fabric adoption — Ethernet has surpassed InfiniBand in AI back-end per Dell\'Oro 2026',
        targetMode: 'slot',
      },
      paradigm: {
        state: 'niche',
        why: 'AWS Bedrock + OpenAI hyperscaler deployments — present but narrow workload-fit',
        targetMode: 'paradigm',
      },
      selfSupply: {
        state: 'primary',
        why: 'this IS where they\'re building their own — defining segment',
        targetMode: 'self-supply',
      },
    },
  },
  {
    segmentId: 'neocloud',
    segmentName: 'Neocloud',
    segmentSubtitle: 'e.g. CoreWeave, Nebius, Lambda, Crusoe',
    cells: {
      replace: {
        state: 'niche',
        why: 'NVIDIA-committed by business model; AMD marginal (some MI300X in catalogs, e.g. Crusoe)',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'secondary',
        why: 'frontier-scale fabrics (e.g. CoreWeave 250K-class fleets) make the choice live; moderated by NVIDIA-integrated buying (rack-scale reference designs)',
        targetMode: 'slot',
      },
      paradigm: {
        state: 'niche',
        why: 'marginal alt-accelerator presence in catalogs',
        targetMode: 'paradigm',
      },
      selfSupply: {
        state: 'na',
        why: 'neoclouds don\'t build silicon — antithetical to the GPU-rental business model',
        targetMode: null,
      },
    },
  },
  {
    segmentId: 'fortune-500',
    segmentName: 'Fortune 500 Enterprise',
    segmentSubtitle: 'e.g. JPMorgan-class, Pfizer-class',
    cells: {
      replace: {
        state: 'niche',
        why: 'most won\'t risk CUDA-stack rewrite; ecosystem moat dominates',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'niche',
        why: 'enterprise scale doesn\'t need scale-up Ethernet',
        targetMode: 'slot',
      },
      paradigm: {
        state: 'na',
        why: 'paradigm-different + narrow workload — wrong audience',
        targetMode: null,
      },
      selfSupply: {
        state: 'na',
        why: 'enterprises don\'t build chips',
        targetMode: null,
      },
    },
  },
  {
    segmentId: 'sovereign-ai',
    segmentName: 'Sovereign AI',
    segmentSubtitle: 'e.g. G42-class',
    cells: {
      replace: {
        state: 'secondary',
        why: 'sovereignty may prefer non-NVIDIA / open stack',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'secondary',
        why: 'open-fabric philosophy aligns with sovereign asks',
        targetMode: 'slot',
      },
      paradigm: {
        state: 'niche',
        why: 'specific sovereign deployments only',
        targetMode: 'paradigm',
      },
      selfSupply: {
        state: 'na',
        why: 'sovereigns don\'t build chips — they buy or sponsor',
        targetMode: null,
      },
    },
  },
  {
    segmentId: 'industry-verticals',
    segmentName: 'Industry Verticals',
    segmentSubtitle: 'e.g. Mayo-class, Siemens-class',
    cells: {
      replace: {
        state: 'niche',
        why: 'specific industry stacks may diverge',
        targetMode: 'replacement',
      },
      pointSolution: {
        state: 'na',
        why: 'single-rack-class deployments don\'t need scale-up Ethernet',
        targetMode: null,
      },
      paradigm: {
        state: 'na',
        why: 'vertical workloads ≠ Llama-class reasoning sweet spot',
        targetMode: null,
      },
      selfSupply: {
        state: 'na',
        why: 'verticals don\'t build chips',
        targetMode: null,
      },
    },
  },
]

interface Props {
  onCellClick: (mode: CompetitiveMode) => void
}

export function BreadthHeatMap({ onCellClick }: Props) {
  return (
    <div className="space-y-4">
      <Header />
      <Matrix onCellClick={onCellClick} />
      <Legend />
      <PatternInsight />
    </div>
  )
}

function Header() {
  return (
    <section className="rounded-md border border-gray-700 bg-gray-900/40 p-5">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        BIRD&apos;S EYE VIEW  ·  segment × threat matrix
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-200">
        Orthogonal to the 4 depth tabs.{' '}
        <span className="font-mono text-gray-400">Depth tabs answer</span>{' '}
        &quot;which competitor in which depth&quot;;{' '}
        <span className="font-mono text-gray-400">this view answers</span>{' '}
        &quot;which segment faces which threat.&quot; Same truth, two angles.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">
        Every cell is a{' '}
        <span className="font-mono text-amber-300">DIRECTIONAL</span> synthesis
        judgment on verified data — not engine-computed. N/A cells render as{' '}
        <span className="font-mono text-gray-500">honest absence</span>{' '}
        (dimmed + hatched), NOT a fabricated low score. Click any non-N/A cell
        to navigate to the matching depth tab — columns left-to-right mirror
        the tab order above.
      </p>
    </section>
  )
}

function Matrix({
  onCellClick,
}: {
  onCellClick: (mode: CompetitiveMode) => void
}) {
  return (
    <section className="overflow-hidden rounded-md border-2 border-gray-700 bg-gray-900/30">
      <div className="overflow-x-auto">
        {/* table-fixed + border-collapse + visible borders on every th/td =
            clean scannable data-matrix grid. Cell content uses h-full+w-full
            to fill the td (which sizes to the row's tallest cell via standard
            HTML table behavior), so all cells in a row are visually uniform
            regardless of "why"-text length. */}
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950 text-left">
              <th className="w-[18%] border-b-2 border-r border-gray-700 px-4 py-3.5">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-300">
                  SEGMENT
                </div>
              </th>
              {COLUMN_LABELS.map((col) => (
                <th
                  key={col.key}
                  className="w-[20.5%] border-b-2 border-r border-gray-700 px-4 py-3.5 last:border-r-0"
                >
                  <div className="text-sm font-semibold leading-tight text-white">
                    {col.label}
                  </div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-[#9FD848]">
                    {col.sublabel}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <SegmentRowView
                key={row.segmentId}
                row={row}
                onCellClick={onCellClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SegmentRowView({
  row,
  onCellClick,
}: {
  row: SegmentRow
  onCellClick: (mode: CompetitiveMode) => void
}) {
  return (
    <tr className="align-top">
      <td className="border-b border-r-2 border-gray-700 bg-gray-950/70 px-4 py-3">
        <div className="text-sm font-semibold leading-tight text-white">
          {row.segmentName}
        </div>
        <div className="mt-1 text-[10px] italic leading-relaxed text-gray-400">
          {row.segmentSubtitle}
        </div>
      </td>
      {COLUMN_LABELS.map((col) => {
        const cell = row.cells[col.key]
        return (
          <td
            key={col.key}
            // p-0 + h-[1px] trick: removes inner padding so CellView fills the
            // td exactly (grid lines stay crisp); h-[1px] is the standard
            // workaround so h-full on the child resolves to the row's tallest-
            // cell height (browser ignores the 1px hint in favor of content).
            className="h-[1px] border-b border-r border-gray-700 p-0 last:border-r-0"
          >
            <CellView cell={cell} onCellClick={onCellClick} />
          </td>
        )
      })}
    </tr>
  )
}

function CellView({
  cell,
  onCellClick,
}: {
  cell: Cell
  onCellClick: (mode: CompetitiveMode) => void
}) {
  const styles = cellStyles(cell.state)
  const clickable = cell.targetMode !== null

  // Every cell — N/A and clickable alike — is a full-bleed flex column that
  // fills the td. The state pill + DIRECTIONAL pill anchor the top; the why
  // text fills the middle; the click cue (when applicable) sits at the bottom
  // via mt-auto. Short cells get padding-equalization automatically because
  // the flex column stretches to the td height.

  if (cell.state === 'na') {
    return (
      <div
        className={`flex h-full w-full flex-col p-3 ${styles.container}`}
        style={styles.inlineStyle}
      >
        <StatePill state={cell.state} />
        <div className="mt-1.5 text-[10px] italic leading-relaxed text-gray-600">
          {cell.why}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => cell.targetMode && onCellClick(cell.targetMode)}
      disabled={!clickable}
      className={`flex h-full w-full flex-col p-3 text-left transition-colors ${styles.container} ${
        clickable ? 'cursor-pointer hover:brightness-125' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <StatePill state={cell.state} />
        <DirectionalPill />
      </div>
      <div className={`mt-1.5 text-[10px] leading-relaxed ${styles.whyText}`}>
        {cell.why}
      </div>
      {clickable && (
        <div className="mt-auto pt-2 text-[9px] font-mono uppercase tracking-widest text-gray-500">
          → click to navigate to depth tab
        </div>
      )}
    </button>
  )
}

function StatePill({ state }: { state: ThreatState }) {
  const { label, classes } = stateLabelAndClasses(state)
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest ${classes}`}
    >
      {label}
    </span>
  )
}

function DirectionalPill() {
  return (
    <span className="whitespace-nowrap rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-mono font-semibold tracking-widest text-amber-300">
      DIRECTIONAL
    </span>
  )
}

function stateLabelAndClasses(state: ThreatState): {
  label: string
  classes: string
} {
  switch (state) {
    case 'primary':
      return {
        label: 'PRIMARY',
        classes: 'bg-amber-500/25 border-amber-500/70 text-amber-100',
      }
    case 'secondary':
      return {
        label: 'SECONDARY',
        classes: 'bg-amber-500/15 border-amber-500/50 text-amber-200',
      }
    case 'niche':
      return {
        label: 'NICHE',
        classes: 'bg-amber-500/8 border-amber-500/30 text-amber-200/80',
      }
    case 'na':
      return {
        label: 'N/A — NOT A THREAT',
        classes: 'border-dashed border-gray-700 bg-gray-900/40 text-gray-500',
      }
    case 'conditional':
      return {
        label: 'CONDITIONAL',
        classes: 'bg-sky-500/10 border-dashed border-sky-500/40 text-sky-300',
      }
  }
}

function cellStyles(state: ThreatState): {
  container: string
  whyText: string
  inlineStyle?: React.CSSProperties
} {
  // Cell-internal borders removed — the td borders carry grid lines now.
  // Cells use background color only; N/A keeps its diagonal-hatch overlay
  // + dim opacity to read as honest absence.
  if (state === 'na') {
    return {
      container: 'bg-gray-950/40 opacity-60',
      inlineStyle: {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(75,85,99,0.04) 0 6px, rgba(75,85,99,0.18) 6px 12px)',
      },
      whyText: 'text-gray-500',
    }
  }
  if (state === 'primary') {
    return {
      container: 'bg-amber-500/12',
      whyText: 'text-gray-200',
    }
  }
  if (state === 'secondary') {
    return {
      container: 'bg-amber-500/[0.07]',
      whyText: 'text-gray-300',
    }
  }
  if (state === 'niche') {
    return {
      container: 'bg-amber-500/[0.04]',
      whyText: 'text-gray-400',
    }
  }
  // conditional (reserved — unused today)
  return {
    container: 'bg-sky-500/8',
    whyText: 'text-gray-300',
  }
}

// ─── Legend ───────────────────────────────────────────────────────────
function Legend() {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30 px-5 py-3">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        CELL TAXONOMY  ·  5 states
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] leading-relaxed md:grid-cols-5">
        <LegendItem state="primary" body="top-3 threat in this segment" />
        <LegendItem state="secondary" body="credible but not primary" />
        <LegendItem state="niche" body="narrow use-cases only" />
        <LegendItem state="na" body="not a threat here — honest absence" />
        <LegendItem state="conditional" body="reserved · depends on sub-condition" />
      </div>
    </section>
  )
}

function LegendItem({
  state,
  body,
}: {
  state: ThreatState
  body: string
}) {
  return (
    <div className="flex items-start gap-1.5">
      <StatePill state={state} />
      <span className="text-gray-400">{body}</span>
    </div>
  )
}

// ─── Pattern insight footer ──────────────────────────────────────────
// Names what the matrix shape reveals — the synthesis-of-syntheses.
function PatternInsight() {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-950/40 px-5 py-4">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        PATTERN  ·  what the matrix reveals
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-300">
        <span className="font-mono text-amber-200">Hyperscalers face the broadest cross-pressure</span>{' '}
        — 2 PRIMARY threats (POINT-SOLUTION + SELF-SUPPLY) on top of SECONDARY
        on REPLACE; the segment is where every competitive type lands at scale.{' '}
        <span className="font-mono text-amber-200">Frontier</span> faces a
        PRIMARY POINT-SOLUTION threat (large-scale training fabric-bound) plus
        three SECONDARY threats; broad pressure but not concentrated.{' '}
        <span className="font-mono text-[#9FD848]">Neocloud is the least-contested segment</span>
        {' '}— zero PRIMARY threats, NVIDIA-committed by business model — but
        NOT zero pressure: SECONDARY on POINT-SOLUTION because their
        frontier-scale fabrics (e.g. CoreWeave 250K-class) make the fabric
        choice live; N/A on SELF-SUPPLY (antithetical to the rental model).{' '}
        <span className="font-mono text-gray-300">Fortune 500</span> and{' '}
        <span className="font-mono text-gray-300">Industry Verticals</span> are
        mostly NICHE / N/A — the ecosystem + integration moat protects them.
        Self-supply concentrates in Hyperscaler + (modestly) Frontier — the
        segments that have the engineering depth + customer-volume to build
        their own. The Cerebras column shows real frontier + hyperscaler
        presence (SECONDARY + NICHE) — N/A only where Cerebras genuinely
        doesn&apos;t reach.{' '}
        <span className="italic text-gray-400">
          The breadth view is consistent with each per-competitor depth fight-
          map — click any cell to navigate to the depth view.
        </span>
      </p>
    </section>
  )
}
