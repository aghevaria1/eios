'use client'

// Act 1 Layer Table — AMD-specific 5-row layer-verdict table.
//
// FROZEN VERDICTS: 5 verdicts copied byte-for-byte from the LayerFightMap's
// buildLayerVerdicts (AMD branch). L5 NVIDIA-DECISIVE, L4 TIE-CLOSE +
// workload-dependent badge, L3 SHARED, L2 TIE-CLOSE, L1 SHARED.
//
// Replaces the LayerFightMap USAGE in amd-replacement-view (Layer Fight
// Map component file is untouched, still used by Cerebras + fabric tabs).
// Scannable 4-col table form is the readability fix.
//
// Shipping-now product identifiers (B200, MI355X) live in L2 cells.

type VerdictKind =
  | 'nvidia-decisive'
  | 'tie-close'
  | 'tie-close-workload'
  | 'shared'

interface LayerRow {
  layerId: string
  layerName: string
  nvidiaCell: string
  amdCell: string
  verdictLabel: string
  verdictKind: VerdictKind
  verdictNuance?: string // optional small badge under the pill
}

const ROWS: LayerRow[] = [
  {
    layerId: 'L5',
    layerName: 'Ecosystem',
    nvidiaCell:
      'NVAIE wraps the CUDA-rooted stack — TensorRT-LLM, FlashAttention 3, NCCL, cuDNN, cuBLAS, ~20-year ecosystem depth',
    amdCell:
      'ROCm closing on mainstream inference — workload-dependent (memory-bound favors MI300X; compute-bound H100 leads)',
    verdictLabel: 'NVIDIA — DECISIVE',
    verdictKind: 'nvidia-decisive',
    verdictNuance: 'contested (software ecosystem moat)',
  },
  {
    layerId: 'L4',
    layerName: 'Software',
    nvidiaCell:
      'NIM / Nemotron / Dynamo / NeMo Guardrails (proprietary microservices) + integrated CUDA-tuned PyTorch / Triton',
    amdCell:
      'PyTorch / vLLM / SGLang / FlashInfer / llama.cpp official ROCm support; ~90-95% mainstream throughput',
    verdictLabel: 'TIE — CLOSE',
    verdictKind: 'tie-close-workload',
    verdictNuance: 'workload-dependent · contested',
  },
  {
    layerId: 'L3',
    layerName: 'ISV / orchestration',
    nvidiaCell:
      'Red Hat OpenShift AI / VMware Private AI Foundation / Nutanix Enterprise AI / VAST Data',
    amdCell: 'Same — vendor-agnostic by design',
    verdictLabel: 'SHARED',
    verdictKind: 'shared',
    verdictNuance: 'same regardless of GPU vendor',
  },
  {
    layerId: 'L2',
    layerName: 'GPU (compute silicon)',
    nvidiaCell:
      'Blackwell B200 — 192 GB HBM3e, 8 TB/s bandwidth, 9 PFLOPS FP4 dense',
    amdCell:
      'MI355X — 288 GB HBM3e, 8 TB/s bandwidth, 9.2 PFLOPS FP4 dense',
    verdictLabel: 'TIE — CLOSE',
    verdictKind: 'tie-close',
    verdictNuance: 'AMD memory-lead +50%, perf parity · contested',
  },
  {
    layerId: 'L1',
    layerName: 'Facility (land · power · shell)',
    nvidiaCell: 'Dell PowerEdge XE9680 chassis + DC / colo / hyperscale patterns',
    amdCell: 'Same',
    verdictLabel: 'SHARED',
    verdictKind: 'shared',
    verdictNuance: 'same regardless of GPU vendor',
  },
]

export function Act1LayerTable() {
  return (
    <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <header className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          LAYER VERDICTS  ·  AMD vs NVIDIA, by layer
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          5 layers, 5 verdicts. AMD contests L2 / L4 / L5; L1 / L3 are SHARED
          (present in both stacks identically, not differentiators). Shipping-
          now current-gen products (B200 / MI355X) shown at L2.
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950/50 text-left">
              <th className="w-[18%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                LAYER
              </th>
              <th className="w-[30%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                NVIDIA
              </th>
              <th className="w-[30%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                AMD
              </th>
              <th className="w-[22%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                VERDICT
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <LayerRowView key={row.layerId} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-800 bg-gray-950/40 px-5 py-3 text-[11px] leading-relaxed text-gray-400">
        <span className="font-mono uppercase tracking-widest text-gray-500">
          summary ·{' '}
        </span>
        AMD contests 3 of 5 layers (L2 silicon, L4 software, L5 ecosystem); L1
        and L3 are SHARED — present in both stacks identically, not
        differentiators. L5 is where NVIDIA wins decisively (the software
        ecosystem moat); L2 + L4 are close ties.
      </div>
    </section>
  )
}

function LayerRowView({ row }: { row: LayerRow }) {
  const classes = verdictClasses(row.verdictKind)
  return (
    <tr className="border-t border-gray-800 align-top">
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="font-mono text-[10px] font-semibold tracking-widest text-gray-400">
          {row.layerId}
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-100">
          {row.layerName}
        </div>
      </td>
      <td className="bg-gray-900/60 px-4 py-3">
        <div className="text-[11px] leading-relaxed text-gray-300">
          {row.nvidiaCell}
        </div>
      </td>
      <td className="bg-gray-900/60 px-4 py-3">
        <div className="text-[11px] leading-relaxed text-gray-300">
          {row.amdCell}
        </div>
      </td>
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="space-y-1">
          <span
            className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes.pill}`}
          >
            {row.verdictLabel}
          </span>
          {row.verdictKind === 'tie-close-workload' && (
            <div>
              <span className="whitespace-nowrap rounded border border-dashed border-amber-400/50 bg-amber-500/5 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-amber-200">
                WORKLOAD-DEPENDENT
              </span>
            </div>
          )}
          {row.verdictNuance && (
            <div className="text-[10px] italic leading-relaxed text-gray-500">
              {row.verdictNuance}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function verdictClasses(kind: VerdictKind): { pill: string } {
  if (kind === 'nvidia-decisive') {
    return {
      pill: 'bg-[#76B900]/15 border-[#76B900]/60 text-[#9FD848]',
    }
  }
  if (kind === 'tie-close' || kind === 'tie-close-workload') {
    return {
      pill: 'bg-amber-500/10 border-amber-500/50 text-amber-200',
    }
  }
  // shared
  return {
    pill: 'bg-gray-700/30 border-gray-600 text-gray-300',
  }
}
