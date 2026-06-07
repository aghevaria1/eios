'use client'

// Switching Cost Table — Act 3's cost articulation.
//
// LEADS Act 3 (above the engine-output dependency cascade). The cost answer
// comes first (fixes the prior "doesn't say what the cost is" problem);
// engine output follows below as the technical proof (dependency model in
// action).
//
// HONESTY DISCIPLINE:
//   · Magnitudes use words (HIGH / MODERATE / NEUTRAL-TO-FAVORABLE) where
//     no defensible number exists
//   · The ONE cited number is FA3 ~30-40% throughput loss (matches seeded
//     amd_rocm.software_cuda_exclusive_libs provenance — Spheron 2026)
//   · NO fabricated dollar figures or port timelines
//   · The dollars-row inversion (AMD often cheaper, so cost ISN'T dollars)
//     is the real insight — stated as the moat thesis landing, not spin
//
// REMOVED FROM TAB: deployment-outcome KPIs (MFU, TCO/token, ROI, TTT,
// inference p99) — they live on the architect page in the delivered-KPIs
// panel, where their config-context gives them meaning.

type Magnitude = 'high' | 'real-cited' | 'moderate' | 'neutral-favorable'

interface CostRow {
  dimension: string
  whatItIs: string
  magnitudeLabel: string
  magnitudeDetail: string
  magnitudeKind: Magnitude
}

const ROWS: CostRow[] = [
  {
    dimension: 'Engineering effort',
    whatItIs: 'CUDA → ROCm re-port + re-validation + team retraining',
    magnitudeLabel: 'HIGH',
    magnitudeDetail: 'the dominant cost (no defensible dollar figure or port timeline)',
    magnitudeKind: 'high',
  },
  {
    dimension: 'Ecosystem loss',
    whatItIs:
      'Give up CUDA-exclusive libraries (TensorRT-LLM, FlashAttention 3)',
    magnitudeLabel: 'REAL — ~30-40% throughput loss',
    magnitudeDetail:
      'cited · Spheron 2026 (FA3 absence cost on 7B+ training; matches seeded software_cuda_exclusive_libs provenance)',
    magnitudeKind: 'real-cited',
  },
  {
    dimension: 'Risk / maturity',
    whatItIs: 'Betting on ROCm for your specific workload',
    magnitudeLabel: 'MODERATE',
    magnitudeDetail:
      'closing but per-workload unproven — workload-dependent: memory-bound favors MI300X, compute-bound H100 leads (per seeded software_mainstream_inference)',
    magnitudeKind: 'moderate',
  },
  {
    dimension: 'Hardware dollars',
    whatItIs: 'AMD often competitive or cheaper on memory + price',
    magnitudeLabel: 'NEUTRAL-TO-FAVORABLE',
    magnitudeDetail: 'NOT where the cost is — the inversion',
    magnitudeKind: 'neutral-favorable',
  },
]

export function SwitchingCostTable() {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          SWITCHING COST  ·  what does it actually cost?
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-200">
          Switching costs mostly{' '}
          <span className="font-mono font-semibold text-amber-200">EFFORT + ECOSYSTEM + RISK</span>
          {' '}— <span className="italic">not dollars</span>. AMD&apos;s hardware
          is often competitive or cheaper; the real cost is re-porting from
          CUDA and giving up the mature ecosystem.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950/50 text-left">
              <th className="w-[22%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                DIMENSION
              </th>
              <th className="w-[38%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                WHAT IT IS
              </th>
              <th className="w-[40%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                MAGNITUDE
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <CostRowView key={row.dimension} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-4">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          THE INVERSION  ·  the real insight
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-300">
          The{' '}
          <span className="font-mono text-[#9FD848]">dollars row is the inversion</span>
          : AMD&apos;s hardware economics often favor AMD, so the cost isn&apos;t
          dollars — it&apos;s effort / ecosystem / risk. This ties back to the
          moat thesis: the moat holds{' '}
          <span className="italic">even when AMD&apos;s hardware economics are
          favorable</span>, because switching cost lives in{' '}
          <span className="font-mono text-amber-200">L3-L5 (effort, ecosystem, risk)</span>
          {' '}— not in silicon price.
        </p>
      </div>
    </section>
  )
}

function CostRowView({ row }: { row: CostRow }) {
  const classes = magnitudeClasses(row.magnitudeKind)
  return (
    <tr className="border-t border-gray-800 align-top">
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="text-sm font-semibold text-gray-100">
          {row.dimension}
        </div>
      </td>
      <td className="bg-gray-900/60 px-4 py-3">
        <div className="text-[11px] leading-relaxed text-gray-300">
          {row.whatItIs}
        </div>
      </td>
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes.pill}`}
            >
              {row.magnitudeLabel}
            </span>
            {row.magnitudeKind === 'real-cited' && (
              <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest text-emerald-300">
                CITED
              </span>
            )}
          </div>
          <div className="text-[10px] leading-relaxed text-gray-500">
            {row.magnitudeDetail}
          </div>
        </div>
      </td>
    </tr>
  )
}

function magnitudeClasses(kind: Magnitude): { pill: string } {
  if (kind === 'high') {
    return { pill: 'bg-amber-500/15 border-amber-500/60 text-amber-200' }
  }
  if (kind === 'real-cited') {
    return { pill: 'bg-amber-500/15 border-amber-500/60 text-amber-200' }
  }
  if (kind === 'moderate') {
    return { pill: 'bg-amber-500/10 border-amber-500/40 text-amber-200/80' }
  }
  // neutral-favorable — the inversion, NVIDIA-green to signal "not the problem"
  return { pill: 'bg-[#76B900]/10 border-[#76B900]/40 text-[#9FD848]' }
}
