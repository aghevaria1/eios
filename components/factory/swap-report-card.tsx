import type {
  Component,
  KpiValue,
  Provenance,
  SwapImpact,
  SwapReport,
  UnverifiedFlag,
} from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'
import { BlastRadiusStrip } from './blast-radius-strip'

// Fabric-swap framing for the inline blast-radius call site (FabricSwapView).
// AMD GPU swap and future swaps build their own framing in their own views.
const FABRIC_SWAP_LAYERS = ['L2']
const FABRIC_SWAP_SLOT_LABEL = 'Fabric'
const FABRIC_SWAP_FRAMING =
  'single-layer swap, low switching cost — compute / software / OEM / ISV stack untouched'

interface Props {
  baseline: Component
  target: Component
  report: SwapReport
}

export function SwapReportCard({ baseline, target, report }: Props) {
  // HELD with at least one value seeded — keeps the expanded list useful by
  // skipping all-null KPIs the engine flagged held purely structurally.
  const heldWithValues = report.held.filter((h) => h.before || h.after)
  return (
    <div className="space-y-6">
      <BlastRadiusStrip
        highlightedLayers={FABRIC_SWAP_LAYERS}
        slotLabel={FABRIC_SWAP_SLOT_LABEL}
        changedCount={report.changed.length}
        heldCount={report.held.length}
        framingText={FABRIC_SWAP_FRAMING}
      />
      <TargetMetaCard target={target} />
      <WithinVendorFramingCard baseline={baseline} target={target} />
      <ChangedKpiSection impacts={report.changed} target={target} slotLabel="fabric" />
      <StrategicFramingSection baseline={baseline} target={target} />
      <HeldKpiSection impacts={heldWithValues} totalHeld={report.held.length} slotLabel="fabric" />
      {report.unverified.length > 0 && (
        <UnverifiedFlagsSection flags={report.unverified} />
      )}
    </div>
  )
}

// Blast-radius strip moved to components/factory/blast-radius-strip.tsx in
// phase 3c-2 step 1 — generalized for multi-layer highlighting (AMD step 2
// will use L2 + L4 + L5) and arbitrary slot labels. SwapReportCard calls it
// above with fabric-specific args.

// Within-vendor swap framing — currently fires only for within-NVIDIA fabric
// swaps (Spectrum-X ↔ Quantum-X800). The insight: NVIDIA offers BOTH Ethernet
// and InfiniBand on first-party silicon; the disaggregation challengers
// (Broadcom Tomahawk Ultra, Arista Etherlink) are Ethernet-only. So the
// Spectrum-X → Quantum-X800 swap is a within-NVIDIA protocol choice, not a
// vendor swap — surfacing this turns the swap from a competitive gap into a
// competitive strength point.
function WithinVendorFramingCard({
  baseline,
  target,
}: {
  baseline: Component
  target: Component
}) {
  if (baseline.vendor !== 'nvidia' || target.vendor !== 'nvidia') return null
  const baseProtocol = baseline.protocol
    ? extractProtocolShort(baseline.protocol.text)
    : null
  const targetProtocol = target.protocol
    ? extractProtocolShort(target.protocol.text)
    : null
  return (
    <section className="rounded-md border border-[#76B900]/40 bg-[#76B900]/[0.04] p-4">
      <div className="text-[10px] font-mono tracking-widest text-[#76B900]/80">
        WITHIN-NVIDIA SWAP · TWO-TRACK STRATEGY
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-200">
        <span className="font-mono text-[#76B900]">{baseline.name}</span>{' '}
        <span className="text-gray-500">→</span>{' '}
        <span className="font-mono text-[#76B900]">{target.name}</span> is a
        within-NVIDIA fabric swap across protocols.
        {baseProtocol && targetProtocol && (
          <>
            {' '}
            Protocol shift:{' '}
            <span className="font-mono text-[#76B900]">{baseProtocol}</span>{' '}
            <span className="text-gray-500">→</span>{' '}
            <span className="font-mono text-[#76B900]">{targetProtocol}</span>.
          </>
        )}{' '}
        NVIDIA is the only vendor offering both fabric protocols on first-party
        silicon — the disaggregation challengers (Broadcom Tomahawk Ultra,
        Arista Etherlink) are Ethernet-only. The choice between Spectrum-X and
        Quantum-X800 is buyer-archetype (Ethernet ecosystem fit vs InfiniBand
        collective-op performance), not a vendor swap.
      </p>
    </section>
  )
}

// Extract the leading short protocol name from the seeded protocol.text field
// (e.g., "InfiniBand (Quantum-3 ASIC) — distinct protocol…" → "InfiniBand").
function extractProtocolShort(protocolText: string): string {
  const m = protocolText.match(/^([^(—,]+)/)
  return (m?.[1] ?? protocolText).trim()
}

// ────────────────────────────────────────────────────────────────────────
// Target meta — name + generation + component-level metadata
// (performance_vs_prior, protocol) where seeded.
// ────────────────────────────────────────────────────────────────────────
function TargetMetaCard({ target }: { target: Component }) {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-gray-500">
            TARGET
          </div>
          <h2 className="mt-1 text-lg font-semibold text-gray-100">
            {target.name}
          </h2>
        </div>
        {target.generation && (
          <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400">
            {target.generation}
          </span>
        )}
      </div>
      {(target.performance_vs_prior || target.protocol) && (
        <div className="mt-4 space-y-3">
          {target.performance_vs_prior && (
            <MetaRow
              label="performance vs prior"
              text={target.performance_vs_prior.text}
              provenance={target.performance_vs_prior.provenance}
            />
          )}
          {target.protocol && (
            <MetaRow
              label="protocol"
              text={target.protocol.text}
              provenance={target.protocol.provenance}
            />
          )}
        </div>
      )}
    </section>
  )
}

function MetaRow({
  label,
  text,
  provenance,
}: {
  label: string
  text: string
  provenance: Provenance
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-l-2 border-gray-700 pl-3">
      <div className="flex-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
          {label}
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-200">{text}</div>
        <NotesBlock notes={provenance.notes} />
      </div>
      <ProvenancePill provenance={provenance} />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// CHANGED — fabric-dependent KPIs with before → after
// ────────────────────────────────────────────────────────────────────────
export function ChangedKpiSection({
  impacts,
  target,
  slotLabel = 'fabric',
}: {
  impacts: SwapImpact[]
  target: Component
  slotLabel?: string
}) {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          CHANGED  ·  {impacts.length} {slotLabel}-dependent KPI
          {impacts.length === 1 ? '' : 's'}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          These KPIs declare{' '}
          <span className="font-mono text-gray-300">{slotLabel}</span> in their
          dependency set — the swap recomposes their before / after values.
        </div>
      </header>
      <div className="space-y-px bg-gray-800">
        {impacts.map((impact) => (
          <ChangedKpiRow
            key={impact.kpi.id}
            impact={impact}
            targetName={target.name}
          />
        ))}
      </div>
    </section>
  )
}

function ChangedKpiRow({
  impact,
  targetName,
}: {
  impact: SwapImpact
  targetName: string
}) {
  return (
    <div className="bg-gray-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-100">
            {impact.kpi.name}
          </h3>
          <div className="mt-1 text-[10px] font-mono tracking-widest text-gray-500">
            {impact.kpi.id}  ·  tier {impact.kpi.tier}
          </div>
        </div>
        <ChangedTag />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <KpiSidePanel label="BEFORE · baseline" value={impact.before} />
        <KpiSidePanel
          label={`AFTER · ${targetName}`}
          value={impact.after}
        />
      </div>
      <WhyLine why={impact.why} />
    </div>
  )
}

function ChangedTag() {
  return (
    <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest text-emerald-300">
      CHANGED
    </span>
  )
}

function HeldTag() {
  return (
    <span className="whitespace-nowrap rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest text-gray-400">
      HELD
    </span>
  )
}

function KpiSidePanel({
  label,
  value,
}: {
  label: string
  value: KpiValue | null
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          {label}
        </div>
        {value ? <ProvenancePill provenance={value.provenance} /> : null}
      </div>
      <div className="mt-2">
        {value ? (
          <KpiValueDisplay value={value} />
        ) : (
          <div className="text-xs italic text-gray-500">
            (no value seeded for this fabric)
          </div>
        )}
      </div>
    </div>
  )
}

export function KpiValueDisplay({ value }: { value: KpiValue }) {
  return (
    <div className="space-y-1 text-xs leading-relaxed text-gray-200">
      {value.range && (
        <div className="font-mono">
          {value.range.min === value.range.max
            ? `${value.range.min}${value.range.unit ? ' ' + value.range.unit : ''}`
            : `${value.range.min}–${value.range.max}${value.range.unit ? ' ' + value.range.unit : ''}`}
        </div>
      )}
      {value.band && (
        <div className="font-mono uppercase tracking-widest text-gray-300">
          band: {value.band}
        </div>
      )}
      {value.text && <div>{value.text}</div>}
      {value.scale_conditional && (
        <div className="space-y-0.5 text-[11px] text-gray-300">
          <div>
            <span className="text-gray-500">small-scale: </span>
            {value.scale_conditional.small_scale}
          </div>
          <div>
            <span className="text-gray-500">large-scale: </span>
            {value.scale_conditional.large_scale}
          </div>
          {value.scale_conditional.breakpoint && (
            <div>
              <span className="text-gray-500">breakpoint: </span>
              {value.scale_conditional.breakpoint}
            </div>
          )}
        </div>
      )}
      <NotesBlock notes={value.provenance.notes} />
      {value.provenance.source && (
        <div className="border-t border-gray-800 pt-1 text-[10px] leading-relaxed text-gray-500">
          <span className="font-mono uppercase tracking-widest text-gray-600">
            source ·{' '}
          </span>
          {value.provenance.source}
        </div>
      )}
      {value.provenance.claimed_by && (
        <div className="text-[10px] text-gray-500">
          <span className="font-mono uppercase tracking-widest text-gray-600">
            claimed by ·{' '}
          </span>
          {value.provenance.claimed_by}
        </div>
      )}
    </div>
  )
}

function WhyLine({ why }: { why: string }) {
  return (
    <div className="mt-3 border-t border-gray-800 pt-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
        why · engine output
      </div>
      <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-400">
        {why}
      </pre>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Strategic framing — baseline vs target buying philosophy side-by-side
// ────────────────────────────────────────────────────────────────────────
function StrategicFramingSection({
  baseline,
  target,
}: {
  baseline: Component
  target: Component
}) {
  const baselinePhilosophy = baseline.kpi_values?.fabric_buying_philosophy
  const targetPhilosophy = target.kpi_values?.fabric_buying_philosophy
  if (!baselinePhilosophy || !targetPhilosophy) return null
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          STRATEGIC FRAMING  ·  buying philosophy
        </div>
        <div className="mt-1 text-xs text-gray-400">
          The KPI deltas above are <em>what</em> changes. These are{' '}
          <em>why</em> a buyer would choose each — different fabrics encode
          different customer archetypes.
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <PhilosophyCard
          side="baseline"
          component={baseline}
          value={baselinePhilosophy}
        />
        <PhilosophyCard
          side="target"
          component={target}
          value={targetPhilosophy}
        />
      </div>
    </section>
  )
}

function PhilosophyCard({
  side,
  component,
  value,
}: {
  side: 'baseline' | 'target'
  component: Component
  value: KpiValue
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
          {side}  ·  {component.name}
        </div>
        <ProvenancePill provenance={value.provenance} />
      </div>
      {value.text && (
        <div className="mt-2 text-sm leading-relaxed text-gray-100">
          &ldquo;{value.text}&rdquo;
        </div>
      )}
      <NotesBlock notes={value.provenance.notes} />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// HELD — collapsible. Count always visible; list expands on click.
// ────────────────────────────────────────────────────────────────────────
export function HeldKpiSection({
  impacts,
  totalHeld,
  slotLabel = 'fabric',
}: {
  impacts: SwapImpact[]
  totalHeld: number
  slotLabel?: string
}) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <details className="group">
        <summary className="cursor-pointer list-none px-5 py-3 hover:bg-gray-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-mono tracking-widest text-gray-500">
                HELD  ·  {totalHeld} KPI
                {totalHeld === 1 ? '' : 's'} insulated from this swap
                {impacts.length !== totalHeld && (
                  <span className="ml-2 text-gray-600">
                    ({impacts.length} with seeded values)
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                These KPIs do NOT declare{' '}
                <span className="font-mono text-gray-300">{slotLabel}</span> in
                their dependency set — the swap&apos;s blast radius is
                bounded. Click to expand.
              </div>
            </div>
            <span className="text-gray-500 transition-transform group-open:rotate-90">
              ▸
            </span>
          </div>
        </summary>
        <div className="space-y-px bg-gray-800">
          {impacts.map((impact) => (
            <HeldKpiRow key={impact.kpi.id} impact={impact} />
          ))}
        </div>
      </details>
    </section>
  )
}

function HeldKpiRow({ impact }: { impact: SwapImpact }) {
  // For HELD, engine sets before === after — render either side once.
  const value = impact.before
  return (
    <div className="bg-gray-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-100">
            {impact.kpi.name}
          </h4>
          <div className="mt-1 text-[10px] font-mono tracking-widest text-gray-500">
            {impact.kpi.id}  ·  tier {impact.kpi.tier}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {value && <ProvenancePill provenance={value.provenance} />}
          <HeldTag />
        </div>
      </div>
      {value && (
        <div className="mt-2 rounded border border-gray-800 bg-gray-950/40 p-3">
          <KpiValueDisplay value={value} />
        </div>
      )}
      <WhyLine why={impact.why} />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// UNVERIFIED flags — surfaced by either side of the swap
// ────────────────────────────────────────────────────────────────────────
export function UnverifiedFlagsSection({ flags }: { flags: UnverifiedFlag[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-rose-500/30 bg-rose-500/[0.03]">
      <header className="border-b border-rose-500/20 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-rose-400">
          UNVERIFIED  ·  {flags.length} value
          {flags.length === 1 ? '' : 's'} flagged on this swap
        </div>
        <div className="mt-1 text-xs text-gray-400">
          The engine surfaces verify-needed flags from BOTH sides of the
          swap. These values must NOT be presented as cited without human
          confirmation.
        </div>
      </header>
      <ul className="divide-y divide-rose-500/10 px-5 py-2 text-xs">
        {flags.map((f, i) => (
          <li key={`${f.component_id}::${f.kpi_id}::${i}`} className="py-2">
            <div className="font-mono text-rose-300">
              ⚑  {f.kpi_id}  @  {f.component_id}
            </div>
            {f.notes && (
              <div className="mt-1 text-[11px] leading-relaxed text-gray-500">
                {f.notes}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Notes rendering — caution-class notes get a distinct amber treatment;
// plain notes render muted. Caution detection is currently keyword-match
// on durable phrases baked into the seeded data; flagged as INTERIM —
// a typed provenance.note_kind field would be more robust.
// ────────────────────────────────────────────────────────────────────────
export function NotesBlock({ notes }: { notes: string | undefined }) {
  if (!notes) return null
  if (isCautionNote(notes)) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/[0.05] px-2 py-1.5 text-[11px] leading-relaxed text-amber-300">
        <span className="font-mono text-amber-400">⚠</span>
        <span>{notes}</span>
      </div>
    )
  }
  return (
    <div className="mt-2 text-[10px] leading-relaxed text-gray-500">
      <span className="font-mono uppercase tracking-widest text-gray-600">
        note ·{' '}
      </span>
      {notes}
    </div>
  )
}

export function isCautionNote(notes: string): boolean {
  const lower = notes.toLowerCase()
  return (
    lower.includes('not directly comparable') ||
    lower.includes('category-error') ||
    lower.includes('transparency, not necessarily superiority') ||
    lower.includes('dense vs sparse') ||
    lower.includes('dense or sparse') ||
    lower.includes('dense/sparse') ||
    (lower.includes('msg/sec') && lower.includes('pps'))
  )
}
