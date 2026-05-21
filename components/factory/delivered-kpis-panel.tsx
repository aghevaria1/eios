import type { KpiDefinition, KpiValue } from '@/lib/factory/kpi'
import { ProvenancePill } from './provenance-pill'

export interface KpiResult {
  kpi: KpiDefinition
  value: KpiValue | null
}

interface Props {
  northStar: KpiResult[]
  supporting: KpiResult[]
}

export function DeliveredKpisPanel({ northStar, supporting }: Props) {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          DELIVERED KPIs
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Engine-resolved values for the composed config. The pill reflects each
          value&apos;s provenance — green = cited source, amber = directional band,
          red = needs human verification before promotion.
        </div>
      </header>

      <div className="space-y-6 p-5">
        {northStar.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-mono tracking-widest text-[#76B900]">
              ★ NORTH-STAR
            </div>
            <div className="space-y-3">
              {northStar.map((r) => (
                <NorthStarCard key={r.kpi.id} result={r} />
              ))}
            </div>
          </div>
        )}

        {supporting.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-mono tracking-widest text-gray-500">
              SUPPORTING
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {supporting.map((r) => (
                <SupportingCard key={r.kpi.id} result={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function NorthStarCard({ result }: { result: KpiResult }) {
  return (
    <div className="rounded border border-[#76B900]/40 bg-[#76B900]/[0.05] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-100">
          {result.kpi.name}
        </h3>
        {result.value && <ProvenancePill value={result.value} />}
      </div>
      <ValueBody value={result.value} prominent />
    </div>
  )
}

function SupportingCard({ result }: { result: KpiResult }) {
  return (
    <div className="flex h-full flex-col rounded border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-100">{result.kpi.name}</h4>
        {result.value && <ProvenancePill value={result.value} />}
      </div>
      <ValueBody value={result.value} />
    </div>
  )
}

function ValueBody({
  value,
  prominent = false,
}: {
  value: KpiValue | null
  prominent?: boolean
}) {
  if (!value) {
    return (
      <div className="mt-3 text-xs italic text-gray-500">
        no value seeded for this segment
      </div>
    )
  }
  const textClass = prominent
    ? 'text-sm leading-relaxed text-gray-100'
    : 'text-xs leading-relaxed text-gray-200'
  return (
    <div className="mt-3 space-y-2">
      {value.text && <div className={textClass}>{value.text}</div>}
      {value.range && (
        <div className="text-xs font-mono text-gray-200">
          {formatRange(value.range)}
        </div>
      )}
      {value.band && value.band !== 'tbd' && !value.text && (
        <div className="text-xs font-mono uppercase tracking-widest text-gray-300">
          band: {value.band}
        </div>
      )}
      {value.scale_conditional && (
        <div className="space-y-1 text-xs leading-relaxed text-gray-300">
          <div>
            <span className="text-gray-500">small-scale: </span>
            {value.scale_conditional.small_scale}
          </div>
          <div>
            <span className="text-gray-500">large-scale: </span>
            {value.scale_conditional.large_scale}
          </div>
        </div>
      )}
      {value.provenance.source && (
        <div className="border-t border-gray-800 pt-2 text-[10px] leading-relaxed text-gray-500">
          <span className="font-mono uppercase tracking-widest text-gray-600">
            source ·{' '}
          </span>
          {value.provenance.source}
        </div>
      )}
      {value.provenance.notes && (
        <div className="text-[10px] leading-relaxed text-gray-500">
          <span className="font-mono uppercase tracking-widest text-gray-600">
            note ·{' '}
          </span>
          {value.provenance.notes}
        </div>
      )}
    </div>
  )
}

function formatRange(r: {
  min: number
  max: number
  unit?: string
}): string {
  if (r.min === r.max) return `${r.min}${r.unit ? ' ' + r.unit : ''}`
  return `${r.min}–${r.max}${r.unit ? ' ' + r.unit : ''}`
}
