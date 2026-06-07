'use client'

import { useState } from 'react'

// Partner Prioritization — the partner-onboarding operating tool.
//
// THREE components, one view:
//   1. PRIORITIZATION  — impact × effort 2×2 (inline-SVG scatter, no chart
//      lib) + a roadmap list that re-sorts live by score (impact / effort).
//      Sliders tune the SELECTED partner's impact + effort → the dot moves,
//      the ranking re-sorts, and Component 2 re-derives.
//   2. METRICS FRAMEWORK — a 3-tier framework (north-star / leading /
//      guardrail) + pre-committed kill criteria, all switching by partner
//      TYPE (OEM vs ISV). Picking a different partner re-derives it.
//   3. SCALE BEYOND +1 — the three structural axes (certification /
//      substrate-abstraction / integration-contract) that make partner N+1
//      a process, not a project.
//
// All state is React state (no storage). Matches the V3 design language:
// font-mono, gray-950 canvas, NVIDIA green (#76B900 / #9FD848) accent,
// rounded-md gray-800 cards, [10px] tracking-widest mono kickers.

// ─── Model ────────────────────────────────────────────────────────────
type PartnerKind =
  | 'OEM'
  | 'App ISV'
  | 'Healthcare ISV'
  | 'Fintech ISV'
  | 'Neocloud / Sovereign'

interface Partner {
  id: string
  name: string
  short: string // chart label
  kind: PartnerKind
  impact: number // 1–10 — inference pull-through / strategic fit
  effort: number // 1–10 — integration / certification burden
  segment: string // the customer segment this partner unlocks for NVIDIA
  note: string
  kb: string // pre-seeded knowledge-base text for "Score from KB" mode
  // KB-scoring results — populated only after a successful KB score.
  rationale?: string
  sources?: string[]
  kbScored?: boolean
}

// Metrics framework branches three ways by partner type. OEM is its own
// branch; every ISV sub-kind (App / Healthcare / Fintech) resolves to ISV
// via the 'ISV' substring; Neocloud / Sovereign is the third branch.
type MetricsKind = 'oem' | 'isv' | 'neosov'

function metricsKind(kind: PartnerKind): MetricsKind {
  if (kind === 'OEM') return 'oem'
  if (kind.includes('ISV')) return 'isv'
  return 'neosov' // Neocloud / Sovereign
}

const SEED: Partner[] = [
  {
    id: 'qai',
    name: 'Qai',
    short: 'Qai',
    kind: 'Neocloud / Sovereign',
    impact: 9,
    effort: 8,
    segment: 'Qatar / Gulf sovereign-AI — government, enterprise, regional',
    note: 'QIA-backed sovereign AI champion; newer than G42/HUMAIN, not yet locked to a GPU vendor. One operator unlocks a whole national segment.',
    kb: 'Qai is a Qatar Investment Authority (QIA)-backed sovereign-AI champion building national AI infrastructure for Qatar and the broader Gulf region. It targets government, large-enterprise, and regional workloads that require in-country data residency. Qai is newer than regional peers like G42 and HUMAIN and has not yet committed to a GPU vendor, so the field is open. Landing Qai as an anchor neocloud/sovereign operator would unlock an entire national segment — government, enterprise, and regional customers — for NVIDIA inference. The main onboarding friction is sovereign procurement, data-residency guarantees, and the scale of a greenfield national build-out.',
  },
  {
    id: 'practo',
    name: 'Practo',
    short: 'Practo',
    kind: 'Healthcare ISV',
    impact: 8,
    effort: 5,
    segment: 'Healthcare / clinical (regulated, on-prem, data-resident)',
    note: 'India health-tech SaaS (clinic software, triage, summaries). Regulated-data fit — NeMo Guardrails, federated learning.',
    kb: 'Practo is an India-based health-tech SaaS provider offering clinic-management software, patient triage, and AI clinical summaries to a large network of providers. Its workloads are regulated, frequently deployed on-premise, and data-resident by requirement. The NVIDIA fit centers on NeMo Guardrails for safe, compliant clinical outputs and federated learning for privacy-preserving model training across clinics. As a healthcare ISV, Practo unlocks the regulated clinical vertical. Integration is a moderate software effort — meaningful compliance and validation work, but no greenfield infrastructure build.',
  },
  {
    id: 'mollie',
    name: 'Mollie',
    short: 'Mollie',
    kind: 'Fintech ISV',
    impact: 8,
    effort: 5,
    segment: 'Financial services / agentic commerce (regulated)',
    note: 'European payments platform building agentic-commerce rails. Regulated fintech + agentic-payment angle.',
    kb: 'Mollie is a European payments platform serving large numbers of merchants and now building agentic-commerce rails — infrastructure for autonomous agents that transact on a user\'s behalf. It operates under strict EU financial-services regulation with hard compliance and auditability requirements. The strategic angle for NVIDIA is agentic payments: inference-heavy agents driving commerce through Mollie\'s rails pull NVIDIA into the fintech vertical. As a fintech ISV, Mollie unlocks regulated financial-services and agentic-commerce customers. Onboarding effort is a moderate software integration gated by regulatory and security review.',
  },
  {
    id: 'aic',
    name: 'AIC',
    short: 'AIC',
    kind: 'OEM',
    impact: 6,
    effort: 3,
    segment: 'Hardware-tier buyers / server refresh',
    note: 'Taiwanese server OEM; recruit into NVIDIA-Certified Systems. Lower-effort quick win.',
    kb: 'AIC is an established Taiwanese server and storage OEM that builds rackmount compute and storage platforms. The motion is to recruit AIC into the NVIDIA-Certified Systems program so its boxes ship pre-validated for NVIDIA accelerators. Effort is comparatively low — a certification and qualification exercise rather than a deep software integration or greenfield build. As an OEM, AIC unlocks hardware-tier buyers and server-refresh demand through its existing channel. The pull-through is real but bounded — it sells certified iron, not a new strategic segment.',
  },
  {
    id: 'turbopuffer',
    name: 'Turbopuffer',
    short: 'Turbopuffer',
    kind: 'App ISV',
    impact: 7,
    effort: 3,
    segment: 'RAG / vector-search consumers',
    note: 'Multi-tenant vector DB; NIM / NeMo Retriever integration. Lower-effort quick win.',
    kb: 'Turbopuffer is a multi-tenant vector database built for serverless, cost-efficient vector search at scale. It integrates naturally with NVIDIA NIM and NeMo Retriever to serve retrieval-augmented-generation (RAG) workloads. Onboarding effort is low — a well-scoped API/SDK integration rather than a certification program or infrastructure build. As an app ISV, Turbopuffer unlocks RAG and vector-search consumers across many downstream applications. The pull-through compounds because each RAG app built on it inherits the NVIDIA inference path.',
  },
]

// ─── Quadrant logic ───────────────────────────────────────────────────
// Midpoint split on a 1–10 scale. >= 5.5 counts as "high".
const THRESHOLD = 5.5

type QuadKey = 'do-first' | 'plan-fund' | 'quick-win' | 'punt'

interface QuadMeta {
  key: QuadKey
  label: string
  svgFill: string
  svgStroke: string
  dot: string // dot fill (hex)
  pill: string // tailwind classes for list pills
}

const QUADS: Record<QuadKey, QuadMeta> = {
  'do-first': {
    key: 'do-first',
    label: 'DO FIRST',
    svgFill: 'rgba(118,185,0,0.10)',
    svgStroke: 'rgba(118,185,0,0.35)',
    dot: '#9FD848',
    pill: 'border-[#76B900]/40 bg-[#76B900]/10 text-[#9FD848]',
  },
  'plan-fund': {
    key: 'plan-fund',
    label: 'PLAN / FUND',
    svgFill: 'rgba(245,158,11,0.08)',
    svgStroke: 'rgba(245,158,11,0.30)',
    dot: '#fcd34d',
    pill: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
  'quick-win': {
    key: 'quick-win',
    label: 'QUICK WIN',
    svgFill: 'rgba(56,189,248,0.07)',
    svgStroke: 'rgba(56,189,248,0.28)',
    dot: '#7dd3fc',
    pill: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  },
  punt: {
    key: 'punt',
    label: 'PUNT',
    svgFill: 'rgba(244,63,94,0.06)',
    svgStroke: 'rgba(148,163,184,0.22)',
    dot: '#9ca3af',
    pill: 'border-gray-600/50 bg-gray-700/25 text-gray-400',
  },
}

function quadrantOf(p: Partner): QuadKey {
  const hiImpact = p.impact >= THRESHOLD
  const hiEffort = p.effort >= THRESHOLD
  if (hiImpact && !hiEffort) return 'do-first'
  if (hiImpact && hiEffort) return 'plan-fund'
  if (!hiImpact && !hiEffort) return 'quick-win'
  return 'punt'
}

function score(p: Partner): number {
  return p.impact / p.effort
}

// ─── KB-scoring: shape + safe parser ──────────────────────────────────
type ScoreMode = 'manual' | 'kb'

interface KbScore {
  impact: number
  effort: number
  segment: string
  rationale: string
  sources: string[]
}

function clampScore(v: unknown): number | null {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return null
  return Math.max(1, Math.min(10, n))
}

// Parse the model's raw text into a KbScore. Defensive on purpose: strips
// ```json fences, falls back to slicing the first {...} block, validates the
// numeric range, and returns null on anything malformed so the caller can
// keep the manual score.
function parseKbScore(raw: string): KbScore | null {
  if (!raw) return null
  let t = raw.trim()
  // Strip a leading/trailing markdown code fence if present.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  // Fall back to the first balanced-looking {...} slice.
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
  const impact = clampScore(obj.impact)
  const effort = clampScore(obj.effort)
  if (impact == null || effort == null) return null
  const segment =
    typeof obj.segment === 'string' ? obj.segment.trim() : ''
  const rationale =
    typeof obj.rationale === 'string' ? obj.rationale.trim() : ''
  const sources = Array.isArray(obj.sources)
    ? obj.sources.filter((s): s is string => typeof s === 'string')
    : []
  return { impact, effort, segment, rationale, sources }
}

// ─── Root view ────────────────────────────────────────────────────────
export function PrioritizationView() {
  const [partners, setPartners] = useState<Partner[]>(SEED)
  const [selectedId, setSelectedId] = useState<string>(SEED[0].id)
  // Scoring mode — defaults to 'manual' so the demo never depends on a live
  // API call. 'kb' opts into the Anthropic-backed "Score from KB" path.
  const [mode, setMode] = useState<ScoreMode>('manual')
  // Transient KB-scoring UI state, kept out of the partner objects.
  const [scoringIds, setScoringIds] = useState<string[]>([])
  const [scoreErrors, setScoreErrors] = useState<Record<string, string | null>>(
    {},
  )

  const selected =
    partners.find((p) => p.id === selectedId) ?? partners[0]

  const ranked = [...partners].sort((a, b) => score(b) - score(a))

  function tuneSelected(field: 'impact' | 'effort', value: number) {
    setPartners((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, [field]: value } : p)),
    )
  }

  function updateKb(id: string, kb: string) {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, kb } : p)))
  }

  // Score one partner from its KB via the Anthropic-backed route. On success
  // the partner's impact/effort/segment update in state — same reactive path
  // as the sliders, so the dot moves and the roadmap re-sorts. On ANY failure
  // (network, non-200, unparseable JSON) we set a non-blocking error and keep
  // the existing manual score untouched.
  async function scorePartner(id: string) {
    const p = partners.find((x) => x.id === id)
    if (!p || !p.kb.trim()) return
    setScoringIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setScoreErrors((prev) => ({ ...prev, [id]: null }))
    try {
      const res = await fetch('/api/factory/prioritization-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: p.name, type: p.kind, kb: p.kb }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { text?: string }
      const parsed = parseKbScore(data.text ?? '')
      if (!parsed) throw new Error('Unparseable score')
      setPartners((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                impact: parsed.impact,
                effort: parsed.effort,
                segment: parsed.segment || x.segment,
                rationale: parsed.rationale,
                sources: parsed.sources,
                kbScored: true,
              }
            : x,
        ),
      )
    } catch {
      setScoreErrors((prev) => ({
        ...prev,
        [id]: "Couldn't score from KB — showing manual score",
      }))
    } finally {
      setScoringIds((prev) => prev.filter((x) => x !== id))
    }
  }

  async function scoreAll() {
    await Promise.all(partners.map((p) => scorePartner(p.id)))
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Header />

      <ModeToggle
        mode={mode}
        onSelect={setMode}
        onScoreAll={scoreAll}
        scoring={scoringIds.length > 0}
      />

      {/* ─── COMPONENT 1 — Prioritization (the interactive centerpiece) ── */}
      <section className="mt-8">
        <SectionKicker
          index="01"
          title="Prioritization — impact × effort"
          blurb="Where to spend the onboarding budget. X = effort (integration / certification burden), Y = impact (inference pull-through / strategic fit). Pick a partner, then tune it live — the dot moves and the roadmap re-sorts by score (impact ÷ effort)."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <QuadrantChart
            partners={partners}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
          <RoadmapList
            ranked={ranked}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
        </div>
        <TunePanel selected={selected} onTune={tuneSelected} />
        {mode === 'kb' && (
          <KbPanel
            selected={selected}
            scoring={scoringIds.includes(selected.id)}
            error={scoreErrors[selected.id] ?? null}
            onKbChange={(kb) => updateKb(selected.id, kb)}
            onScore={() => scorePartner(selected.id)}
          />
        )}
      </section>

      {/* ─── COMPONENT 2 — Metrics framework (selected partner) ────────── */}
      <section className="mt-10">
        <SectionKicker
          index="02"
          title="Metrics framework"
          blurb="Objective before metric: whose outcome? → partner adoption + NVIDIA inference pull-through. The framework below auto-switches by partner type."
        />
        <MetricsFramework selected={selected} />
      </section>

      {/* ─── COMPONENT 3 — Scale beyond +1 partner ─────────────────────── */}
      <section className="mt-10">
        <SectionKicker
          index="03"
          title="Scale beyond +1 partner — the three axes"
          blurb="Each partner type adds scale a different way. Get the seam right once and partner N+1 inherits it."
        />
        <ScaleAxes />
      </section>

      <HonestyNote />
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="mb-2">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        AI FACTORY · PARTNER PRIORITIZATION
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-gray-100">
        Partner Prioritization — sequence, measure, scale
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300">
        How I&apos;d run partner onboarding for the AI Partner Solutions &amp;
        OEM Ecosystem motion:{' '}
        <span className="font-mono text-[#76B900]">prioritize</span> which
        partners to bring on first,{' '}
        <span className="font-mono text-[#76B900]">define</span> the success
        metrics that match each partner type, and show how partner{' '}
        <span className="font-mono text-[#76B900]">N+1</span> scales as a
        process rather than a project.
      </p>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-gray-400">
        Priority weighted by the customer segment each partner unlocks — a{' '}
        <span className="font-mono text-[#76B900]">neocloud/sovereign</span>{' '}
        operator unlocks a whole region; an{' '}
        <span className="font-mono text-[#76B900]">ISV</span> unlocks a vertical.
      </p>
    </header>
  )
}

// ─── Section kicker (numbered) ────────────────────────────────────────
function SectionKicker({
  index,
  title,
  blurb,
}: {
  index: string
  title: string
  blurb: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] tracking-widest text-[#76B900]">
          {index}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
          {title}
        </h2>
      </div>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-400">
        {blurb}
      </p>
    </div>
  )
}

// ─── COMPONENT 1a — the 2×2 scatter (inline SVG, no chart lib) ─────────
function QuadrantChart({
  partners,
  selectedId,
  onSelect,
}: {
  partners: Partner[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  // Geometry — value 1..10 mapped into the plot rect.
  const W = 380
  const H = 360
  const M = { top: 16, right: 14, bottom: 34, left: 34 }
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom

  const xOf = (effort: number) => M.left + ((effort - 1) / 9) * plotW
  // impact grows upward → invert y
  const yOf = (impact: number) => M.top + plotH - ((impact - 1) / 9) * plotH

  const midX = xOf(THRESHOLD)
  const midY = yOf(THRESHOLD)
  const left = M.left
  const right = M.left + plotW
  const top = M.top
  const bottom = M.top + plotH

  // Quadrant rects keyed to their meaning.
  const rects: { q: QuadKey; x: number; y: number; w: number; h: number }[] = [
    { q: 'do-first', x: left, y: top, w: midX - left, h: midY - top },
    { q: 'plan-fund', x: midX, y: top, w: right - midX, h: midY - top },
    { q: 'quick-win', x: left, y: midY, w: midX - left, h: bottom - midY },
    { q: 'punt', x: midX, y: midY, w: right - midX, h: bottom - midY },
  ]

  // Corner-anchored quadrant labels (placed just inside each corner).
  const labels: { q: QuadKey; x: number; y: number; anchor: 'start' | 'end' }[] =
    [
      { q: 'do-first', x: left + 6, y: top + 14, anchor: 'start' },
      { q: 'plan-fund', x: right - 6, y: top + 14, anchor: 'end' },
      { q: 'quick-win', x: left + 6, y: bottom - 8, anchor: 'start' },
      { q: 'punt', x: right - 6, y: bottom - 8, anchor: 'end' },
    ]

  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          IMPACT × EFFORT  ·  click a dot to select
        </div>
      </div>
      <div className="p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Impact versus effort prioritization scatter chart"
        >
          {/* Quadrant fills */}
          {rects.map((r) => {
            const meta = QUADS[r.q]
            return (
              <rect
                key={r.q}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={meta.svgFill}
                stroke={meta.svgStroke}
                strokeWidth={1}
              />
            )
          })}

          {/* Mid dividers */}
          <line
            x1={midX}
            y1={top}
            x2={midX}
            y2={bottom}
            stroke="rgba(120,120,130,0.35)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <line
            x1={left}
            y1={midY}
            x2={right}
            y2={midY}
            stroke="rgba(120,120,130,0.35)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          {/* Quadrant corner labels */}
          {labels.map((l) => (
            <text
              key={l.q}
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              fill={QUADS[l.q].dot}
              className="font-mono"
              fontSize={9}
              letterSpacing={1.5}
              opacity={0.85}
            >
              {QUADS[l.q].label}
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={(left + right) / 2}
            y={H - 6}
            textAnchor="middle"
            fill="#9ca3af"
            className="font-mono"
            fontSize={9}
            letterSpacing={2}
          >
            EFFORT →
          </text>
          <text
            x={12}
            y={(top + bottom) / 2}
            textAnchor="middle"
            fill="#9ca3af"
            className="font-mono"
            fontSize={9}
            letterSpacing={2}
            transform={`rotate(-90 12 ${(top + bottom) / 2})`}
          >
            IMPACT →
          </text>

          {/* Dots */}
          {partners.map((p) => {
            const meta = QUADS[quadrantOf(p)]
            const cx = xOf(p.effort)
            const cy = yOf(p.impact)
            const sel = p.id === selectedId
            return (
              <g
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="cursor-pointer"
              >
                {sel && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={10}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={1.5}
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={sel ? 6 : 5}
                  fill={meta.dot}
                  stroke="rgba(10,10,12,0.9)"
                  strokeWidth={1}
                />
                <text
                  x={cx + 9}
                  y={cy + 3}
                  fill={sel ? '#f3f4f6' : '#9ca3af'}
                  className="font-mono"
                  fontSize={9}
                  fontWeight={sel ? 700 : 400}
                >
                  {p.short}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── COMPONENT 1b — ranked roadmap list (re-sorts live) ───────────────
function RoadmapList({
  ranked,
  selectedId,
  onSelect,
}: {
  ranked: Partner[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          ONBOARDING ROADMAP  ·  sorted by score (impact ÷ effort)
        </div>
      </div>
      <ul className="divide-y divide-gray-800">
        {ranked.map((p, i) => {
          const meta = QUADS[quadrantOf(p)]
          const sel = p.id === selectedId
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={[
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  sel
                    ? 'bg-[#76B900]/10 border-l-2 border-l-[#76B900]'
                    : 'border-l-2 border-l-transparent hover:bg-gray-900/60',
                ].join(' ')}
              >
                <span
                  className={`w-5 shrink-0 text-center font-mono text-sm font-semibold ${
                    sel ? 'text-[#76B900]' : 'text-gray-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      sel ? 'text-[#76B900]' : 'text-gray-200'
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-gray-500">
                    {p.kind} · score {score(p).toFixed(2)}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                    <span className="font-mono uppercase tracking-widest text-gray-600">
                      Unlocks:{' '}
                    </span>
                    {p.segment}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest ${meta.pill}`}
                >
                  {meta.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── COMPONENT 1c — live tuning sliders for the selected partner ──────
function TunePanel({
  selected,
  onTune,
}: {
  selected: Partner
  onTune: (field: 'impact' | 'effort', value: number) => void
}) {
  const meta = QUADS[quadrantOf(selected)]
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-[#76B900]/30 bg-[#76B900]/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#76B900]/30 px-5 py-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-gray-500">
            TUNE SELECTED  ·  re-sorts the roadmap + re-derives the metrics
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-100">
            {selected.name}{' '}
            <span className="font-mono text-[11px] font-normal text-gray-500">
              · {selected.kind}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#76B900]">
              Unlocks:
            </span>
            <span className="text-xs text-gray-300">{selected.segment}</span>
          </div>
          <div className="mt-1.5 text-xs italic leading-relaxed text-gray-400">
            {selected.note}
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest ${meta.pill}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 px-5 py-4 md:grid-cols-2">
        <SliderRow
          label="Impact"
          hint="inference pull-through / strategic fit"
          value={selected.impact}
          onChange={(v) => onTune('impact', v)}
        />
        <SliderRow
          label="Effort"
          hint="integration / certification burden"
          value={selected.effort}
          onChange={(v) => onTune('effort', v)}
        />
      </div>
      {selected.kbScored && (
        <WhyThisScore
          rationale={selected.rationale}
          sources={selected.sources}
        />
      )}
    </div>
  )
}

// ─── "Why this score" — evidence behind a KB-derived score ────────────
// Renders inside the selected-partner detail panel once a KB score lands.
// Collapsed by default; expands to the model's rationale + the KB snippets
// it cited. Scores become auditable, not asserted.
function WhyThisScore({
  rationale,
  sources,
}: {
  rationale?: string
  sources?: string[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[#76B900]/30 px-5 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#9FD848]">
          {open ? '▾' : '▸'} Why this score
        </span>
        <span className="rounded border border-[#76B900]/40 bg-[#76B900]/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-[#9FD848]">
          KB-scored
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">
          claude · evidence-backed
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {rationale && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                Rationale
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-300">
                {rationale}
              </p>
            </div>
          )}
          {sources && sources.length > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                Sources (from KB)
              </div>
              <ul className="mt-1 space-y-1.5">
                {sources.map((s, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-l-[#76B900]/40 pl-3 text-xs italic leading-relaxed text-gray-400"
                  >
                    “{s}”
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!rationale && (!sources || sources.length === 0) && (
            <p className="text-xs text-gray-500">
              No rationale returned for this score.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SliderRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
          {label}{' '}
          <span className="normal-case tracking-normal text-gray-600">
            · {hint}
          </span>
        </div>
        <div className="font-mono text-lg font-semibold text-[#9FD848]">
          {value}
          <span className="text-[11px] font-normal text-gray-500"> / 10</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#76B900]"
        aria-label={label}
      />
      <div className="mt-1 flex justify-between font-mono text-[9px] text-gray-600">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  )
}

// ─── Scoring-mode toggle (Manual ⇄ Score from KB) ─────────────────────
// Defaults to Manual so the demo never depends on a live API call. In KB
// mode, exposes a "Score all" affordance + a one-line explanation.
function ModeToggle({
  mode,
  onSelect,
  onScoreAll,
  scoring,
}: {
  mode: ScoreMode
  onSelect: (m: ScoreMode) => void
  onScoreAll: () => void
  scoring: boolean
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-5 py-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-gray-500">
            SCORING MODE
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Manual scores are the default and always-on fallback. KB mode
            derives them from pasted source text.
          </div>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded border border-gray-700">
          <ModeButton
            label="Manual scores"
            active={mode === 'manual'}
            onClick={() => onSelect('manual')}
          />
          <ModeButton
            label="Score from KB"
            active={mode === 'kb'}
            onClick={() => onSelect('kb')}
          />
        </div>
      </div>
      {mode === 'kb' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="max-w-2xl text-[11px] leading-relaxed text-gray-500">
            <span className="font-mono uppercase tracking-widest text-[#76B900]">
              RAG-lite ·{' '}
            </span>
            the selected partner&apos;s KB is sent to Claude with a fixed
            impact/effort rubric. The returned score moves the dot and re-sorts
            the roadmap — manual sliders still override, and a failed call keeps
            the manual score.
          </p>
          <button
            type="button"
            onClick={onScoreAll}
            disabled={scoring}
            className="inline-flex shrink-0 items-center gap-2 rounded border border-[#76B900]/40 bg-[#76B900]/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#9FD848] transition-colors hover:bg-[#76B900]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scoring && <Spinner />}
            Score all
          </button>
        </div>
      )}
    </div>
  )
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest transition-colors ${
        active
          ? 'bg-[#76B900]/15 text-[#9FD848]'
          : 'bg-transparent text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

// ─── KB panel (selected partner) — paste source text + score ──────────
// One shared panel scoped to the selected partner. Pre-seeded KB so the mode
// demos out-of-the-box. Spinner while scoring; non-blocking error on failure.
function KbPanel({
  selected,
  scoring,
  error,
  onKbChange,
  onScore,
}: {
  selected: Partner
  scoring: boolean
  error: string | null
  onKbChange: (kb: string) => void
  onScore: () => void
}) {
  const empty = !selected.kb.trim()
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 px-5 py-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-gray-500">
            KNOWLEDGE BASE ·{' '}
            <span className="text-[#76B900]">{selected.name}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Paste press releases, partnership news, tech-stack notes, earnings
            highlights. Pre-seeded with what we already know.
          </div>
        </div>
        <button
          type="button"
          onClick={onScore}
          disabled={scoring || empty}
          className="inline-flex shrink-0 items-center gap-2 rounded border border-[#76B900]/40 bg-[#76B900]/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#9FD848] transition-colors hover:bg-[#76B900]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scoring && <Spinner />}
          {scoring ? 'Scoring…' : 'Score this partner'}
        </button>
      </div>
      <div className="px-5 py-4">
        <textarea
          value={selected.kb}
          onChange={(e) => onKbChange(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder="Paste source text for this partner…"
          className="w-full resize-y rounded border border-gray-700 bg-gray-950/60 px-3 py-2 font-mono text-xs leading-relaxed text-gray-200 placeholder-gray-600 focus:border-[#76B900]/50 focus:outline-none"
        />
        {error && (
          <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            {error}
          </div>
        )}
        {selected.kbScored && !error && (
          <div className="mt-3 text-[11px] text-gray-500">
            Scored from KB — impact{' '}
            <span className="font-mono text-[#9FD848]">{selected.impact}</span>,
            effort{' '}
            <span className="font-mono text-[#9FD848]">{selected.effort}</span>.
            See “Why this score” in the panel above for the rationale + cited
            snippets.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inline spinner (no deps — Tailwind animate-spin) ─────────────────
function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-[#9FD848]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ─── COMPONENT 2 — metrics framework (switches by partner type) ───────
function MetricsFramework({ selected }: { selected: Partner }) {
  const kind = metricsKind(selected.kind)

  const northStar =
    kind === 'neosov'
      ? 'Regional GPU consumption × sovereign workloads landed'
      : kind === 'oem'
        ? 'Certified-systems shipped × inference pull-through'
        : 'Partner-driven inference consumption (tokens/mo in prod)'

  const leading =
    kind === 'neosov'
      ? [
          'Capacity online (MW/GPUs)',
          'Anchor customers signed',
          'Time-to-first-sovereign-workload',
        ]
      : kind === 'oem'
        ? [
            'NVQual pass-rate',
            'Time-to-certify (days)',
            'Design-in milestones hit',
          ]
        : [
            'Validation pass-rate',
            'Time-to-first-token-in-prod',
            'Blueprint reuse rate',
          ]

  const guardrail =
    kind === 'neosov'
      ? ['Data-residency compliance', 'Utilization rate', 'Energy/PUE efficiency']
      : [
          'Escalation volume',
          'Latency SLO adherence',
          'Support cost / deployment',
        ]

  const kill =
    kind === 'neosov'
      ? 'Kill if no anchor sovereign customer by gate 2 or residency/compliance cannot be met'
      : kind === 'oem'
        ? 'Kill if not certified by gate 2 (90 days) or <2 design wins'
        : 'Kill if <X production inference by gate 2 or validation fails twice'

  const kindLabel =
    kind === 'neosov' ? 'Neocloud / Sovereign' : kind === 'oem' ? 'OEM' : 'ISV'

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
          Framework for
        </span>
        <span className="rounded border border-[#76B900]/40 bg-[#76B900]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#9FD848]">
          {selected.name}
        </span>
        <span className="text-gray-600">·</span>
        <span className="font-mono text-[11px] text-gray-400">
          resolves as {kindLabel} metrics
        </span>
      </div>

      {/* NORTH STAR */}
      <div className="overflow-hidden rounded-md border border-[#76B900]/30 bg-[#76B900]/[0.05]">
        <div className="border-b border-[#76B900]/30 px-5 py-2">
          <div className="text-[10px] font-mono tracking-widest text-[#9FD848]">
            NORTH STAR  ·  the one number
          </div>
        </div>
        <div className="px-5 py-4 text-lg font-semibold text-gray-100">
          {northStar}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEADING */}
        <TierCard title="LEADING" sub="moves first — predicts the north star">
          <div className="flex flex-wrap gap-2">
            {leading.map((m) => (
              <Chip key={m} text={m} tone="green" />
            ))}
          </div>
        </TierCard>

        {/* GUARDRAIL */}
        <TierCard title="GUARDRAIL" sub="must not degrade as we scale">
          <div className="flex flex-wrap gap-2">
            {guardrail.map((m) => (
              <Chip key={m} text={m} tone="gray" />
            ))}
          </div>
        </TierCard>
      </div>

      {/* KILL CRITERIA */}
      <div className="overflow-hidden rounded-md border border-rose-500/40 bg-rose-500/[0.06]">
        <div className="border-b border-rose-500/30 px-5 py-2">
          <div className="text-[10px] font-mono tracking-widest text-rose-300">
            PRE-COMMITTED KILL CRITERIA  ·  agreed up front, not negotiated later
          </div>
        </div>
        <div className="px-5 py-4 text-sm font-semibold leading-relaxed text-rose-100">
          {kill}
        </div>
      </div>
    </div>
  )
}

function TierCard({
  title,
  sub,
  children,
}: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-400">
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Chip({ text, tone }: { text: string; tone: 'green' | 'gray' }) {
  const classes =
    tone === 'green'
      ? 'border-[#76B900]/40 bg-[#76B900]/10 text-[#9FD848]'
      : 'border-gray-700 bg-gray-800/60 text-gray-300'
  return (
    <span
      className={`rounded border px-2.5 py-1 font-mono text-[11px] tracking-wide ${classes}`}
    >
      {text}
    </span>
  )
}

// ─── COMPONENT 3 — scale beyond +1 partner (the three axes) ───────────
function ScaleAxes() {
  const axes = [
    {
      plus: '+1 OEM',
      problem: 'certification problem',
      body: 'Re-run NVQual → NVIDIA-Certified Systems. The box is interchangeable below the platform; nothing above the OEM seam changes.',
    },
    {
      plus: '+1 Platform ISV',
      problem: 'substrate-abstraction problem',
      body: 'Built to standard Kubernetes / container APIs, not vendor-specific hooks — so the substrate is swappable. Test: does the platform layer leak vendor specifics?',
    },
    {
      plus: '+1 App ISV',
      problem: 'integration-contract problem',
      body: 'Each app partner integrates through a stable API contract + MCP tools — never touching platform internals. Partner #2 inherits the blueprint and self-serves ~80%.',
    },
  ]

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {axes.map((a) => (
          <div
            key={a.plus}
            className="rounded-md border border-gray-800 bg-gray-900/30 p-4"
          >
            <div className="font-mono text-sm font-semibold text-[#9FD848]">
              {a.plus}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-gray-500">
              {a.problem}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-300">
              {a.body}
            </p>
          </div>
        ))}
      </div>
      <p className="border-l-2 border-l-[#76B900]/50 pl-4 text-sm italic leading-relaxed text-gray-300">
        The first partner produces the reference architecture; certification
        enforces it; the ecosystem compounds. Partner N+1 is a process, not a
        project — certify once, integrate once, deploy many.
      </p>
    </div>
  )
}

// ─── Honesty note ─────────────────────────────────────────────────────
function HonestyNote() {
  return (
    <div className="mt-10 rounded-md border border-gray-800 bg-gray-950/40 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
      <span className="font-mono uppercase tracking-widest text-gray-600">
        honesty note ·{' '}
      </span>
      Named companies (Qai, Practo, Mollie, AIC, Turbopuffer) are illustrative
      prioritization targets to demonstrate the method — not claims about
      NVIDIA partnership status. Confirm partner status before engaging.
    </div>
  )
}
