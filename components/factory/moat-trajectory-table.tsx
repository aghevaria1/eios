'use client'

// Moat Trajectory Table — 3-row directional table, REPLACES the band-style
// MoatTrajectoryPanel.
//
// FROZEN TRAJECTORIES: L5 widening-but-contested, L4 stable-to-mild-
// widening, L3 deliberately-flat. All evidence figures cite seeded data
// (FA3 ~30-40% throughput per Spheron 2026; Clarifai/Tensorwave memory-
// bound; aimultiple compute-bound; ROCm framework support). No new claims.
//
// VISUALLY DISTINCT FROM SILICON SCORECARDS (critical honesty point):
//   · Whole table wrapped in DASHED border (not solid)
//   · Column header reads "DIRECTION — NOT SCORED" (vs silicon "WINNER")
//   · Direction cells use arrow + state label + DIRECTIONAL pill
//   · Table background subtly tinted to differentiate
//
// The visual distinction prevents the moat table from being misread as
// equally hard-scored as the silicon tables. Same discipline as the
// heat-map's DIRECTIONAL framing for synthesis judgments.

type Direction = 'widening' | 'mild-widening' | 'flat'

interface MoatRow {
  layerId: string
  layerName: string
  nvidiaCell: string
  amdCell: string
  direction: Direction
  stateLabel: string
}

const ROWS: MoatRow[] = [
  {
    layerId: 'L5',
    layerName: 'Ecosystem',
    nvidiaCell:
      'Widening: ~20-year CUDA depth (cuDNN, cuBLAS, TensorRT, Triton, NeMo, NIM) · CUDA-exclusive libraries — TensorRT-LLM + FlashAttention 3 (Spheron 2026: missing FA3 costs ~30-40% training throughput on 7B+ models) · agentic stack NIM / Nemotron / Dynamo / NeMo Guardrails NVIDIA-proprietary · NVAIE consolidation',
    amdCell:
      'Pressuring: ROCm closes on mainstream inference — workload-dependent (memory-bound MI300X often beats H100 ~40% lower latency on Llama-2-70B per Clarifai / Tensorwave 2026; compute-bound H100 leads per aimultiple 2026 vLLM ROCm 37-75% higher latency) · UEC open-standards extends openness rhetoric',
    direction: 'widening',
    stateLabel: 'WIDENING-BUT-CONTESTED',
  },
  {
    layerId: 'L4',
    layerName: 'Software',
    nvidiaCell:
      'Widening: NVAIE microservices (NIM, Nemotron, Dynamo, NeMo Guardrails) NVIDIA-proprietary · CUDA-tuned framework optimization (TensorRT-LLM, Triton inference server) · integrated PyTorch + Triton tuning depth',
    amdCell:
      'Pressuring: open-framework portability — PyTorch, vLLM, SGLang, FlashInfer, llama.cpp all have official ROCm support (per seeded amd_rocm.software_framework_support CITED) · Triton ecosystem opening · mainstream inference abstraction increases over time',
    direction: 'mild-widening',
    stateLabel: 'STABLE-TO-MILD-WIDENING',
  },
  {
    layerId: 'L3',
    layerName: 'Orchestration',
    nvidiaCell:
      '(deliberately neutral — Red Hat OpenShift AI / VMware Private AI Foundation / Nutanix Enterprise AI / VAST Data are vendor-agnostic by ISV design choice, not by NVIDIA effort)',
    amdCell: '(same — same ISVs, same neutrality)',
    direction: 'flat',
    stateLabel: 'DELIBERATELY FLAT · flat-by-design',
  },
]

export function MoatTrajectoryTable() {
  return (
    <section className="overflow-hidden rounded-md border-2 border-dashed border-amber-500/30 bg-amber-500/[0.02]">
      <header className="border-b border-dashed border-amber-500/30 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-amber-300">
          MOAT TRAJECTORY  ·  L5 / L4 / L3 · direction, not scored
        </div>
        <div className="mt-1 text-xs leading-relaxed text-gray-400">
          The moat half of Act 2. L3-L5 have no clean ship dates — the honest
          form is{' '}
          <span className="font-mono text-amber-300">direction</span> (widening
          / mild-widening / flat), NOT scored winners. Every row carries{' '}
          <span className="font-mono text-amber-300">DIRECTIONAL</span> —
          synthesis judgment on verified current-state. The dashed border is
          deliberate: this table is{' '}
          <span className="italic">not</span> hard-scored like the silicon
          tables above.
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="bg-gray-950/40 text-left">
              <th className="w-[18%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                LAYER
              </th>
              <th className="w-[33%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                NVIDIA
              </th>
              <th className="w-[33%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                AMD
              </th>
              <th className="w-[16%] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                DIRECTION — NOT SCORED
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <MoatRowView key={row.layerId} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <ContrastFooter />
    </section>
  )
}

function MoatRowView({ row }: { row: MoatRow }) {
  return (
    <tr className="border-t border-dashed border-amber-500/20 align-top">
      <td className="bg-gray-900/30 px-4 py-3">
        <div className="font-mono text-[10px] font-semibold tracking-widest text-gray-400">
          {row.layerId}
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-100">
          {row.layerName}
        </div>
      </td>
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="text-[11px] leading-relaxed text-gray-300">
          {row.nvidiaCell}
        </div>
      </td>
      <td className="bg-gray-900/40 px-4 py-3">
        <div className="text-[11px] leading-relaxed text-gray-300">
          {row.amdCell}
        </div>
      </td>
      <td className="bg-gray-900/30 px-4 py-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <DirectionArrow direction={row.direction} />
            <span className={`text-xs font-semibold ${stateLabelColor(row.direction)}`}>
              {row.stateLabel}
            </span>
          </div>
          <span className="inline-block whitespace-nowrap rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono font-semibold tracking-widest text-amber-300">
            DIRECTIONAL
          </span>
        </div>
      </td>
    </tr>
  )
}

function DirectionArrow({ direction }: { direction: Direction }) {
  const cls = stateLabelColor(direction)
  const sym = direction === 'flat' ? '━' : '▲'
  return (
    <span className={`font-mono text-base font-bold ${cls}`} aria-hidden="true">
      {sym}
    </span>
  )
}

function stateLabelColor(direction: Direction): string {
  if (direction === 'widening') return 'text-[#9FD848]'
  if (direction === 'mild-widening') return 'text-[#9FD848]/80'
  return 'text-gray-400'
}

function ContrastFooter() {
  return (
    <div className="border-t border-dashed border-amber-500/30 bg-gray-950/40 px-5 py-4">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        SILICON vs MOAT  ·  the contrast in one eyeful
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-300">
        <span className="font-mono text-gray-400">
          Silicon races and resets every generation
        </span>{' '}
        (the silicon tables above): current-gen patterns repeat at the
        roadmap pair, the moat locus is stable, and the cadence is annual
        lockstep.{' '}
        <span className="font-mono text-[#9FD848]">
          The moat compounds and doesn&apos;t reset
        </span>{' '}
        (this table): L5 widens with real pressure; L4 stable-to-mild-
        widening; L3 deliberately flat by ISV design choice. That&apos;s
        why the moat isn&apos;t silicon.
      </p>
    </div>
  )
}
