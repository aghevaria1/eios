import {
  applySwap,
  buildConfig,
  loadKnowledge,
} from '@/lib/factory/kpi'
import { type SwapTarget } from '@/components/factory/fabric-swap-view'
import { CompetitiveModeSwitcher } from '@/components/factory/competitive-mode-switcher'

const SEGMENT_ID = 'fortune-500'
const ARCHITECTURE_ID = 'HGX'

const BASELINE_FABRIC_ID = 'nvidia_spectrum_x'
const DEFAULT_FABRIC_TARGET_ID = 'cornelis_cn6000'
const FABRIC_TARGET_IDS = [
  'cornelis_cn6000',
  'broadcom_jericho_tomahawk',
  'arista_ethernet',
  'nvidia_quantum_x800',
]

const BASELINE_GPU_ID = 'blackwell_b200'
const AMD_TARGET_GPU_ID = 'amd_mi355x'
const BASELINE_SOFTWARE_ID = 'nvaie'
const AMD_TARGET_SOFTWARE_ID = 'amd_rocm'
const ROADMAP_RUBIN_ID = 'vera_rubin_vr200'
const ROADMAP_MI455X_ID = 'amd_helios_mi455x'
const CEREBRAS_ID = 'cerebras_wse3'
const HYPERSCALER_IDS = {
  google: 'google_tpu',
  aws: 'aws_trainium3',
  meta: 'meta_mtia',
  microsoft: 'microsoft_maia200',
} as const

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

  // ── Fabric slot-swap mode (4 swap targets, existing behavior) ──
  const fabricTargets: SwapTarget[] = FABRIC_TARGET_IDS.map((targetId) => {
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

  // ── AMD full-stack replacement mode (L2 GPU swap quantified via applySwap;
  // L4 + L5 verdicts surfaced qualitatively via LayerFightMap from the
  // software components below — see amd-replacement-view.tsx) ──
  const baselineGpu = knowledge.components.get(BASELINE_GPU_ID)
  const amdTargetGpu = knowledge.components.get(AMD_TARGET_GPU_ID)
  const baselineSoftware = knowledge.components.get(BASELINE_SOFTWARE_ID)
  const amdTargetSoftware = knowledge.components.get(AMD_TARGET_SOFTWARE_ID)
  const amdRoadmapRubin = knowledge.components.get(ROADMAP_RUBIN_ID)
  const amdRoadmapMi455x = knowledge.components.get(ROADMAP_MI455X_ID)
  const cerebras = knowledge.components.get(CEREBRAS_ID)
  const hyperscalerGoogle = knowledge.components.get(HYPERSCALER_IDS.google)
  const hyperscalerAws = knowledge.components.get(HYPERSCALER_IDS.aws)
  const hyperscalerMeta = knowledge.components.get(HYPERSCALER_IDS.meta)
  const hyperscalerMicrosoft = knowledge.components.get(HYPERSCALER_IDS.microsoft)
  if (
    !baselineGpu ||
    !amdTargetGpu ||
    !baselineSoftware ||
    !amdTargetSoftware ||
    !amdRoadmapRubin ||
    !amdRoadmapMi455x ||
    !cerebras ||
    !hyperscalerGoogle ||
    !hyperscalerAws ||
    !hyperscalerMeta ||
    !hyperscalerMicrosoft
  ) {
    throw new Error(
      `competitive: missing baseline GPU '${BASELINE_GPU_ID}' / AMD target '${AMD_TARGET_GPU_ID}' / baseline software '${BASELINE_SOFTWARE_ID}' / AMD target software '${AMD_TARGET_SOFTWARE_ID}' / roadmap '${ROADMAP_RUBIN_ID}' + '${ROADMAP_MI455X_ID}' / cerebras '${CEREBRAS_ID}' / hyperscaler [${Object.values(HYPERSCALER_IDS).join(', ')}]`,
    )
  }
  const amdGpuReport = applySwap(baseline, {
    slot: 'gpu',
    from: BASELINE_GPU_ID,
    to: AMD_TARGET_GPU_ID,
  })

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          AI FACTORY · COMPETITIVE VIEW
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">
          Competitive analysis
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Baseline:{' '}
          <span className="font-mono text-[#76B900]">{segment.name}</span>
          <span className="text-gray-500"> / {architecture.id}</span>
          <span className="text-gray-500"> — </span>
          <span className="font-mono text-[#76B900]">{baselineGpu.name}</span>
          <span className="text-gray-500"> + </span>
          <span className="font-mono text-[#76B900]">
            {baselineFabric.name}
          </span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Two competitive modes encode the switching-cost spectrum: SLOT
          SWAPS (low blast radius — fabric only) vs FULL-STACK REPLACEMENT
          (broader blast radius — GPU now, software in step 2). Engine
          output is deterministic; no LLM call on tab clicks.
        </p>
      </header>

      <CompetitiveModeSwitcher
        fabricBaseline={baselineFabric}
        fabricTargets={fabricTargets}
        fabricDefaultTargetId={DEFAULT_FABRIC_TARGET_ID}
        amdBaselineGpu={baselineGpu}
        amdTargetGpu={amdTargetGpu}
        amdRoadmapRubin={amdRoadmapRubin}
        amdRoadmapMi455x={amdRoadmapMi455x}
        amdReport={amdGpuReport}
        cerebras={cerebras}
        hyperscalerGoogle={hyperscalerGoogle}
        hyperscalerAws={hyperscalerAws}
        hyperscalerMeta={hyperscalerMeta}
        hyperscalerMicrosoft={hyperscalerMicrosoft}
      />
    </div>
  )
}
