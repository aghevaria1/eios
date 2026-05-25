import {
  applySwap,
  buildConfig,
  loadKnowledge,
} from '@/lib/factory/kpi'
import {
  FabricSwapView,
  type SwapTarget,
} from '@/components/factory/fabric-swap-view'

const SEGMENT_ID = 'fortune-500'
const ARCHITECTURE_ID = 'HGX'
const BASELINE_FABRIC_ID = 'nvidia_spectrum_x'
const DEFAULT_TARGET_ID = 'cornelis_cn6000'

const TARGET_IDS = [
  'cornelis_cn6000',
  'broadcom_jericho_tomahawk',
  'arista_ethernet',
  'nvidia_quantum_x800',
]

export default function CompetitivePage() {
  const knowledge = loadKnowledge()
  const baseline = buildConfig(SEGMENT_ID, ARCHITECTURE_ID)

  const segment = knowledge.segments.find((s) => s.id === SEGMENT_ID)
  const architecture = knowledge.architectures.find(
    (a) => a.id === ARCHITECTURE_ID,
  )
  const baselineFabric = knowledge.components.get(BASELINE_FABRIC_ID)
  if (!segment || !architecture || !baselineFabric) {
    throw new Error(
      `competitive: missing segment/architecture/baseline-fabric for ${SEGMENT_ID}/${ARCHITECTURE_ID}/${BASELINE_FABRIC_ID}`,
    )
  }

  const targets: SwapTarget[] = TARGET_IDS.map((targetId) => {
    const targetFabric = knowledge.components.get(targetId)
    if (!targetFabric) {
      throw new Error(
        `competitive: target fabric '${targetId}' not in knowledge`,
      )
    }
    const report = applySwap(baseline, {
      slot: 'fabric',
      from: BASELINE_FABRIC_ID,
      to: targetId,
    })
    return { component: targetFabric, report }
  })

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          AI FACTORY · COMPETITIVE VIEW · FABRIC SWAP
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">
          Fabric swap analysis
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Baseline:{' '}
          <span className="font-mono text-[#76B900]">
            {baselineFabric.name}
          </span>
          <span className="text-gray-500"> · {segment.name} / {architecture.id} default fabric</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Select a target fabric. The dependency-graph engine recomposes the
          KPI report — CHANGED rows are fabric-dependent; HELD rows are
          insulated; UNVERIFIED flags are surfaced from both sides of the
          swap. Engine output is deterministic; no LLM call on selection.
        </p>
      </header>

      <FabricSwapView
        baseline={baselineFabric}
        targets={targets}
        defaultTargetId={DEFAULT_TARGET_ID}
      />
    </div>
  )
}
