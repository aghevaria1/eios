import type { KpiDefinition, KpiValue } from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'

interface KpiResult {
  kpi: KpiDefinition
  value: KpiValue | null
}

interface Props {
  capex: KpiResult
  opex: KpiResult
}

export function TcoBars({ capex, opex }: Props) {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          TCO DIRECTION  ·  CAPEX  |  OPEX  ·  never summed
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Two independent directional bands. The engine never computes a TCO total
          — CapEx and OpEx live separately to keep the honesty boundary intact.
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <TcoCard label="CAPEX" result={capex} />
        <TcoCard label="OPEX" result={opex} />
      </div>

      <footer className="border-t border-gray-800 px-5 py-3">
        <div className="text-[10px] leading-relaxed text-gray-500">
          Directional — relative magnitude, not computed totals. Bar fill encodes
          the band (high / medium / low), not a precise figure. CapEx and OpEx are
          never summed by this module.
        </div>
      </footer>
    </section>
  )
}

function TcoCard({ label, result }: { label: string; result: KpiResult }) {
  if (!result.value) {
    return (
      <div className="rounded border border-gray-800 bg-gray-900/60 p-4">
        <div className="text-xs italic text-gray-500">no value seeded</div>
      </div>
    )
  }
  const v = result.value
  const fill = fillForBand(v.band)
  const factors = parseFactors(v.text ?? '')
  return (
    <div className="flex h-full flex-col rounded border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-mono font-semibold tracking-widest text-gray-300">
          {label}{' '}
          <span className="text-gray-600">(directional)</span>
        </div>
        <ProvenancePill value={v} />
      </div>

      <div className="mt-3">
        <div
          className="relative h-3 overflow-hidden rounded-sm bg-gray-800"
          role="img"
          aria-label={`${label} directional band: ${fill.label.toLowerCase()}`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-amber-500/70"
            style={{ width: `${fill.pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-end text-[10px] font-mono uppercase tracking-widest text-amber-300">
          {fill.label}
        </div>
      </div>

      {factors.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            FACTORS
          </div>
          <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-gray-300">
            {factors.map((f, i) => (
              <li key={i}>
                <span className="text-gray-600">·</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.provenance.notes && (
        <div className="mt-3 border-t border-gray-800 pt-2 text-[10px] leading-relaxed text-gray-500">
          <span className="font-mono uppercase tracking-widest text-gray-600">
            note ·{' '}
          </span>
          {v.provenance.notes}
        </div>
      )}
    </div>
  )
}

function fillForBand(band: KpiValue['band']): { pct: number; label: string } {
  switch (band) {
    case 'high':
      return { pct: 85, label: 'HIGH' }
    case 'medium':
      return { pct: 55, label: 'MEDIUM' }
    case 'low':
      return { pct: 25, label: 'LOW' }
    case 'tbd':
      return { pct: 0, label: 'TBD' }
    default:
      return { pct: 0, label: band ? band.toUpperCase() : '—' }
  }
}

function parseFactors(text: string): string[] {
  const stripped = text.replace(/^factors:\s*/i, '').trim()
  if (!stripped) return []
  return stripped.split(/,\s*/).filter(Boolean)
}
