'use client'

import type { Component, KpiValue } from '@/lib/factory/kpi'

// Hyperscaler Self-Supply view — the 4th competitive type's strategic panel.
//
// CRITICAL DECISION: this is a STRATEGIC PANEL, not a layer-fight-map.
// Hyperscaler captive chips (TPU / Trainium / MTIA / Maia) are mostly
// internal / unbenchmarked vs NVIDIA spec-for-spec. Forcing them onto
// the cake as "contests L2-gpu" would (a) mis-frame a market-structure
// threat as a spec fight, and (b) fabricate head-to-head verdicts for
// chips with no public comparable data. The honest form is a dedicated
// panel about market structure, maturity, coexistence, and the
// partner-PM implications.
//
// Structure:
//   1. Header framing — the 4th competitive type, on the switching-cost
//      spectrum (the buyer-exits-the-market end).
//   2. Four maturity-differentiated cards, ordered most-mature-left →
//      least-mature-right. Horizontal order IS the spectrum. Visual
//      treatment graduates by tier (amber = merchant threat / emerald =
//      coexistence / gray = internal / dashed gray = least mature).
//   3. Five-facet strategic verdict, all-must-hold: threat + trajectory /
//      moat / coexistence / structural enablers / partner-PM angle.
//
// HONESTY DISCIPLINE:
//   The maturity SPREAD across the 4 IS the insight — they're NOT a
//   monolith. Descriptors not tier-numbers (no leaderboard implied).
//   Emerald = coexistence (NVIDIA-adjacent), NOT winner — card text
//   disambiguates. Share trajectory as RANGE, never single number.
//   Specs CITED but flagged as captive/unbenchmarked. Coexistence
//   real (NVLink Fusion / training-on-NVIDIA). Partner-PM angle named
//   explicitly as the role-fit signal.

interface Props {
  google: Component
  aws: Component
  meta: Component
  microsoft: Component
}

// Card visual treatment per maturity character. Order matters — left to
// right reads as maturity spectrum (most → least). Each card's accent
// disambiguates the color meaning in its body text (especially emerald
// for Trainium, which must read "coexistence-with-NVIDIA," NOT "winner").
type CardAccent = 'amber' | 'emerald' | 'gray-solid' | 'gray-dashed'

interface CardConfig {
  component: Component
  accent: CardAccent
  badgeLabel: string         // descriptor — NOT a tier number
  deploymentTag: string      // MERCHANT / COEXISTENCE / INTERNAL / OPENAI-ANCHORED
  takeawayLine: string       // "what this means for NVIDIA" — short, calibrated
}

export function HyperscalerSelfSupplyView({
  google,
  aws,
  meta,
  microsoft,
}: Props) {
  const cards: CardConfig[] = [
    {
      component: google,
      accent: 'amber',
      badgeLabel: 'MOST MATURE + MERCHANT',
      deploymentTag: 'MERCHANT',
      takeawayLine:
        'Most direct customer-becomes-supplier-becomes-merchant-vendor path of the 4 — the one with merchant ambitions beyond its origin cloud.',
    },
    {
      component: aws,
      accent: 'emerald',
      badgeLabel: 'COMMERCIAL VOLUME + COEXISTENCE',
      deploymentTag: 'COEXISTENCE — NVLink Fusion',
      takeawayLine:
        'Emerald = coexistence with NVIDIA, NOT "winner." Trainium4 integrates NVLink Fusion (AWS-NVIDIA collab) — the most explicit "self-supply specific workloads + NVIDIA holds the rest" signal across the 4.',
    },
    {
      component: meta,
      accent: 'gray-solid',
      badgeLabel: 'NARROW + INTERNAL',
      deploymentTag: 'INTERNAL ONLY',
      takeawayLine:
        'Limit-of-own-program signal: Meta hedges multi-vendor (NVIDIA training + MTIA inference + in-talks-for-TPU) — not "Meta replaces NVIDIA with MTIA."',
    },
    {
      component: microsoft,
      accent: 'gray-dashed',
      badgeLabel: 'LEAST MATURE',
      deploymentTag: 'OPENAI-ANCHORED',
      takeawayLine:
        'Earliest of the 4. OpenAI volume justifies the program; OpenAI still uses NVIDIA + AWS Trainium in parallel. Maia adds capacity, NOT replacement.',
    },
  ]

  return (
    <div className="space-y-6">
      <TypeFramingHeader />
      <ColorLegend />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((cfg) => (
          <HyperscalerCard key={cfg.component.id} cfg={cfg} />
        ))}
      </div>
      <StrategicVerdict />
    </div>
  )
}

// ─── Header framing — 4th competitive type ──────────────────────────
function TypeFramingHeader() {
  return (
    <section className="rounded-md border border-gray-700 bg-gray-900/40 p-5">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        THE 4TH COMPETITIVE TYPE  ·  customer self-supply
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-200">
        Your biggest customers becoming your{' '}
        <span className="font-mono text-amber-300">suppliers</span>. Not a
        swap, not a paradigm —{' '}
        <span className="font-mono text-amber-300">vertical integration</span>
        . On the switching-cost spectrum, this is the &quot;buyer exits the
        market&quot; end: the threat isn&apos;t a better spec, it&apos;s a
        customer who used to pay you deciding to make their own.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        Four programs, four different maturity characters. The spread across
        the 4 IS the insight — they are not a monolith. The threat is real,
        the moat is locatable, the share trajectory is a range, and the
        partner-PM motion (where NVIDIA still wins inside a TPU shop or a
        Trainium shop) is the role-fit story.
      </p>
      <p className="mt-2 text-[10px] font-mono uppercase leading-relaxed tracking-widest text-gray-500">
        Switching-cost spectrum:&nbsp;
        <span className="text-gray-400">slot swap (low)</span>
        &nbsp;→&nbsp;
        <span className="text-gray-400">full-stack replacement</span>
        &nbsp;→&nbsp;
        <span className="text-gray-400">alternative paradigm</span>
        &nbsp;→&nbsp;
        <span className="text-amber-300">customer self-supply (buyer exits)</span>
      </p>
    </section>
  )
}

// ─── Color legend — disambiguates accent semantics ──────────────────
// Emerald is the trickiest: must read "coexistence with NVIDIA," NOT
// "Trainium is the winner / best." The legend states the meaning
// explicitly so no reader misreads color = ranking.
function ColorLegend() {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30 px-5 py-3">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        CARD COLOR LEGEND  ·  characterization, not ranking
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] leading-relaxed md:grid-cols-4">
        <div>
          <span className="mr-1.5 inline-block h-2 w-4 rounded-sm bg-amber-500/60" />
          <span className="text-amber-200">amber</span>{' '}
          <span className="text-gray-400">= merchant-vendor threat</span>
        </div>
        <div>
          <span className="mr-1.5 inline-block h-2 w-4 rounded-sm bg-emerald-500/60" />
          <span className="text-emerald-200">emerald</span>{' '}
          <span className="text-gray-400">
            = coexistence with NVIDIA (NVIDIA-adjacent, NOT winner)
          </span>
        </div>
        <div>
          <span className="mr-1.5 inline-block h-2 w-4 rounded-sm bg-gray-500/60" />
          <span className="text-gray-300">gray (solid)</span>{' '}
          <span className="text-gray-400">= internal-only / captive</span>
        </div>
        <div>
          <span className="mr-1.5 inline-block h-2 w-4 rounded-sm border border-dashed border-gray-500/60" />
          <span className="text-gray-400">gray (dashed)</span>{' '}
          <span className="text-gray-400">= least mature / earliest</span>
        </div>
      </div>
    </section>
  )
}

// ─── One hyperscaler card ───────────────────────────────────────────
function HyperscalerCard({ cfg }: { cfg: CardConfig }) {
  const styles = cardStyles(cfg.accent)
  const c = cfg.component
  const maturity = textOf(c.kpi_values?.self_supply_maturity_tier)
  const specs = textOf(c.kpi_values?.self_supply_chip_specs)
  const deployment = textOf(c.kpi_values?.self_supply_deployment_state)
  const coexistence = textOf(c.kpi_values?.self_supply_coexistence_signal)

  return (
    <article
      className={`flex flex-col gap-3 rounded-md p-4 ${styles.container}`}
    >
      {/* Header stacks vertically — title section on top, deployment badge
          on its own row below. Robust to any badge-text length: prior
          flex-row + whitespace-nowrap caused long badges (e.g.
          "COEXISTENCE — NVLINK FUSION") to overflow the column and
          collide with the title text in the 4-col xl grid. */}
      <header className="space-y-2">
        <div>
          <div className={`text-[10px] font-mono font-semibold tracking-widest ${styles.badgeText}`}>
            {cfg.badgeLabel}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-100 leading-tight">
            {c.name}
          </div>
          <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-500">
            {c.vendor}
          </div>
        </div>
        <div>
          <span
            className={`inline-block max-w-full break-words rounded border px-2 py-0.5 text-[9px] font-mono font-semibold uppercase leading-tight tracking-widest ${styles.tagBadge}`}
          >
            {cfg.deploymentTag}
          </span>
        </div>
      </header>

      <div className="space-y-2 text-[11px] leading-relaxed text-gray-300">
        {maturity && (
          <Row label="MATURITY CHARACTER" body={maturity} />
        )}
        {specs && (
          <Row label="SPECS" body={specs} />
        )}
        {deployment && (
          <Row label="DEPLOYMENT" body={deployment} />
        )}
        {coexistence && (
          <Row label="COEXISTENCE / THREAT" body={coexistence} />
        )}
      </div>

      <footer className={`mt-auto rounded border-t pt-2 text-[11px] italic leading-relaxed ${styles.takeawayBox}`}>
        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
          what this means for NVIDIA →
        </span>
        <p className="mt-1 text-gray-300">{cfg.takeawayLine}</p>
      </footer>
    </article>
  )
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-gray-300">{body}</div>
    </div>
  )
}

function textOf(kpi: KpiValue | undefined): string {
  return kpi?.text ?? ''
}

function cardStyles(accent: CardAccent): {
  container: string
  badgeText: string
  tagBadge: string
  takeawayBox: string
} {
  if (accent === 'amber') {
    return {
      container: 'border-2 border-amber-500/60 bg-amber-500/8',
      badgeText: 'text-amber-300',
      tagBadge: 'border-amber-500/60 bg-amber-500/20 text-amber-100',
      takeawayBox: 'border-amber-500/30',
    }
  }
  if (accent === 'emerald') {
    return {
      container: 'border-2 border-emerald-500/60 bg-emerald-500/8',
      badgeText: 'text-emerald-300',
      tagBadge: 'border-emerald-500/60 bg-emerald-500/20 text-emerald-100',
      takeawayBox: 'border-emerald-500/30',
    }
  }
  if (accent === 'gray-solid') {
    return {
      container: 'border-2 border-gray-600 bg-gray-800/30',
      badgeText: 'text-gray-300',
      tagBadge: 'border-gray-600 bg-gray-700/40 text-gray-200',
      takeawayBox: 'border-gray-700',
    }
  }
  // gray-dashed — least mature signal
  return {
    container: 'border-2 border-dashed border-gray-600 bg-gray-900/20',
    badgeText: 'text-gray-400',
    tagBadge: 'border-dashed border-gray-600 bg-gray-800/40 text-gray-300',
    takeawayBox: 'border-dashed border-gray-700',
  }
}

// ─── Strategic verdict — 5 facets, all-must-hold for calibrated read ──
function StrategicVerdict() {
  return (
    <section className="overflow-hidden rounded-md border border-amber-500/30 bg-gray-900/30">
      <header className="border-b border-amber-500/30 bg-amber-500/5 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-amber-300">
          THE STRATEGIC VERDICT  ·  5 facets — all must hold for a calibrated read
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          Cherry-picking one facet inflates the threat (threat alone) or
          dismisses real validation (moat alone). The honest read is the
          intersection: real threat + locatable moat + coexistence framing +
          structural enablers + the partner-PM motion. Calibration is the
          discipline.
        </div>
      </header>
      <div className="space-y-3 p-5">
        <Facet
          label="THREAT + SHARE TRAJECTORY"
          body={
            <>
              Self-supply eats <span className="font-mono text-amber-200">inference</span>{' '}
              first (~2/3 of compute). ASIC shipments are projected at{' '}
              <span className="font-mono text-amber-200">~27.8%</span> of the
              2026 AI accelerator market (+44.6% YoY — ~3× merchant GPU
              growth). Share trajectory is a{' '}
              <span className="font-mono text-amber-200">RANGE</span>, not a
              point: ~90% now → ~75% (gradual / bullish-NVIDIA framing) ... ~20-30%
              inference by 2028 (aggressive / aggressive-ASIC framing).
              Sources frame the end-state differently — render as a range,
              never assert one number.
            </>
          }
        />
        <Facet
          label="WHY NVIDIA HOLDS — THE MOAT"
          body={
            <>
              Off-the-shelf availability (no custom-design cycle). Multi-cloud
              portability (TPU stays on GCP; Trainium stays on AWS).
              Software / dev stack (<span className="font-mono">CUDA</span>{' '}
              / <span className="font-mono">NVAIE</span> — captive chips
              lack equivalent ecosystem depth). The merchant / sovereign /
              enterprise market that can&apos;t build custom silicon (the
              long tail). Frontier training + workload flexibility beyond
              what custom chips were designed for.
            </>
          }
        />
        <Facet
          label="COEXISTENCE — NOT ZERO-SUM"
          body={
            <>
              <span className="font-mono text-emerald-200">NVLink Fusion</span>{' '}
              (AWS-NVIDIA Trainium4 collaboration) — the most explicit
              coexistence signal. Meta uses NVIDIA for{' '}
              <span className="font-mono text-emerald-200">training</span>{' '}
              + MTIA for{' '}
              <span className="font-mono text-emerald-200">inference</span>.
              Everyone buys NVIDIA for{' '}
              <span className="font-mono text-emerald-200">frontier model training</span>.
              Frame as &quot;self-supply specific workloads + NVIDIA holds
              the rest&quot; — not &quot;hyperscalers replace NVIDIA.&quot;
              The not-zero-sum anchor.
            </>
          }
        />
        <Facet
          label="STRUCTURAL ENABLERS — BROADCOM + TSMC"
          body={
            <>
              Most custom chips are{' '}
              <span className="font-mono text-cyan-200">Broadcom-architected</span>{' '}
              (TPU co-design, OpenAI silicon partnership) — the layered-
              Ethernet-ecosystem story (Broadcom as the silicon-arms-dealer,
              Phase 3c-2 step 3) extends here. Broadcom enables both the
              fabric attack AND the self-supply attack. AND: all 4 +
              NVIDIA fab at{' '}
              <span className="font-mono text-cyan-200">TSMC (~92% advanced AI)</span>{' '}
              — same chokepoint. The structural enablers are shared, which
              bounds how fast self-supply can scale.
            </>
          }
        />
        <Facet
          label="THE PARTNER-PM ANGLE  ·  the role-specific punchline"
          body={
            <>
              These hyperscalers are NVIDIA&apos;s biggest{' '}
              <span className="font-mono text-[#9FD848]">PARTNERS</span>{' '}
              and biggest self-supply{' '}
              <span className="font-mono text-amber-200">THREATS</span>{' '}
              simultaneously. The co-sell + coexistence motion — where
              NVIDIA still wins inside a TPU shop or a Trainium shop on{' '}
              <span className="font-mono">frontier training</span> /{' '}
              <span className="font-mono">workload flexibility</span> /{' '}
              <span className="font-mono">multi-cloud portability</span> /
              workloads custom chips weren&apos;t designed for — IS the
              partner-PM job. Naming this motion explicitly (not just
              &quot;NVIDIA vs hyperscalers&quot;) is the role-fit signal.
            </>
          }
          highlight
        />
      </div>
    </section>
  )
}

function Facet({
  label,
  body,
  highlight = false,
}: {
  label: string
  body: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded border p-3 ${
        highlight
          ? 'border-[#76B900]/40 bg-[#76B900]/8'
          : 'border-gray-800/60 bg-gray-950/30'
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className={highlight ? 'text-[#9FD848]' : 'text-amber-300'}>▸</span>
        <div
          className={`text-[11px] font-mono font-semibold tracking-widest ${
            highlight ? 'text-[#9FD848]' : 'text-amber-200'
          }`}
        >
          {label}
        </div>
      </div>
      <p className="mt-1 pl-4 text-xs leading-relaxed text-gray-300">{body}</p>
    </div>
  )
}
