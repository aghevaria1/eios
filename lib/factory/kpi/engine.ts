// Dependency-graph KPI engine — the deterministic backbone.
//
// CONTRACT:
//   applySwap(config, swap) → SwapReport
//   For each KPI definition:
//     - if any of its dependency tags matches the swap's slot → CHANGED
//     - else → HELD
//   Each KPI's `why` explanation is derived from its dependency tags + the swap shape.
//
// HONESTY GUARANTEES:
//   - Engine never produces a number that isn't already in the knowledge layer.
//   - Engine never sums TCO components (capex + opex are exposed separately).
//   - Engine surfaces every value's provenance — including `verify-needed` flags for
//     values that should NOT be presented as "cited" without human confirmation.
//   - Engine never calls the network, never calls an LLM.
//
// The output of this engine is what an LLM (or UI) is allowed to READ and present.
// The LLM must never compute KPI values itself.

import { KPI_DEFINITIONS } from './definitions'
import { loadKnowledge } from './knowledge'
import type {
  Architecture,
  ConfigState,
  ComponentSwap,
  DependencyTag,
  KpiDefinition,
  KpiValue,
  Segment,
  SwapImpact,
  SwapReport,
  UnverifiedFlag,
} from './types'

const COMPONENT_SLOTS: DependencyTag[] = ['gpu', 'fabric', 'software', 'oem', 'isv']

function getSegment(segmentId: string): Segment | undefined {
  return loadKnowledge().segments.find((s) => s.id === segmentId)
}

function getArchitecture(architectureId: string): Architecture | undefined {
  return loadKnowledge().architectures.find((a) => a.id === architectureId)
}

/**
 * Build a starting ConfigState from a segment + architecture.
 * Architecture supplies default_components for gpu/fabric/software/oem/isv.
 */
export function buildConfig(
  segmentId: string,
  architectureId: string,
  overrides?: Partial<Omit<ConfigState, 'segment' | 'architecture'>>,
): ConfigState {
  const seg = getSegment(segmentId)
  if (!seg) throw new Error(`Unknown segment: ${segmentId}`)
  const arch = getArchitecture(architectureId)
  if (!arch) throw new Error(`Unknown architecture: ${architectureId}`)

  return {
    segment: segmentId,
    architecture: architectureId,
    gpu: overrides?.gpu ?? arch.default_components.gpu,
    fabric: overrides?.fabric ?? arch.default_components.fabric,
    software: overrides?.software ?? arch.default_components.software,
    oem: overrides?.oem ?? arch.default_components.oem,
    isv: overrides?.isv ?? arch.default_components.isv,
  }
}

/**
 * Look up the KPI value for a given KPI in the current config.
 *
 * Resolution: the KPI value is read from the component occupying the KPI's
 * PRIMARY (first) dependency slot. Multi-dependency KPIs are resolved by their
 * first declared dependency for now; richer composition is a later phase.
 */
function lookupKpiValue(
  kpi: KpiDefinition,
  config: ConfigState,
): KpiValue | undefined {
  const knowledge = loadKnowledge()
  const primarySlot = kpi.dependencies[0]
  const componentId = config[primarySlot as keyof ConfigState] as string
  const component = knowledge.components.get(componentId)
  return component?.kpi_values?.[kpi.id]
}

/**
 * Build a one-line "why" explanation for a KPI's classification.
 */
function buildWhy(
  kpi: KpiDefinition,
  swap: ComponentSwap,
  status: 'changed' | 'held',
): string {
  const deps = kpi.dependencies.join(', ')
  if (status === 'changed') {
    return `Depends on ${deps}; swap touches '${swap.slot}' (${swap.from} → ${swap.to})`
  }
  return `Depends on ${deps}; swap touches '${swap.slot}', which is NOT in the dependency set`
}

/**
 * Collect any KpiValue carrying a `verify-needed` flag — these are the values
 * the user must confirm before they can be promoted from `directional` to `cited`.
 */
function collectUnverified(
  config: ConfigState,
  kpi: KpiDefinition,
  value: KpiValue | undefined,
): UnverifiedFlag | null {
  if (!value) return null
  if (value.provenance.flag !== 'verify-needed') return null

  const primarySlot = kpi.dependencies[0]
  const componentId = config[primarySlot as keyof ConfigState] as string

  return {
    component_id: componentId,
    kpi_id: kpi.id,
    status: value.provenance.status,
    notes: value.provenance.notes,
  }
}

/**
 * The main engine entry point.
 * Pure function: same input → same output. No I/O beyond the JSON loaders.
 */
export function applySwap(
  config: ConfigState,
  swap: ComponentSwap,
): SwapReport {
  if (!COMPONENT_SLOTS.includes(swap.slot)) {
    throw new Error(
      `Invalid swap slot '${swap.slot}'. Must be one of: ${COMPONENT_SLOTS.join(', ')}`,
    )
  }
  if ((config[swap.slot as keyof ConfigState] as string) !== swap.from) {
    throw new Error(
      `Swap.from='${swap.from}' does not match config.${swap.slot}='${config[swap.slot as keyof ConfigState]}'`,
    )
  }

  const config_after: ConfigState = { ...config, [swap.slot]: swap.to }

  const changed: SwapImpact[] = []
  const held: SwapImpact[] = []
  const unverified: UnverifiedFlag[] = []
  const seenUnverified = new Set<string>()

  for (const kpi of KPI_DEFINITIONS) {
    const isAffected = kpi.dependencies.includes(swap.slot)

    const before = lookupKpiValue(kpi, config)
    const after = isAffected ? lookupKpiValue(kpi, config_after) : before
    const why = buildWhy(kpi, swap, isAffected ? 'changed' : 'held')

    if (isAffected) {
      changed.push({ kpi, status: 'changed', before, after, why })
    } else {
      held.push({ kpi, status: 'held', before, after, why })
    }

    // Surface any verify-needed flags on values touched by this swap.
    // Attribute each flag to the config it came from (before's value → before config;
    // after's value → after config). For HELD KPIs, before === after, so only one flag fires.
    const beforeFlag = before ? collectUnverified(config, kpi, before) : null
    const afterFlag =
      isAffected && after ? collectUnverified(config_after, kpi, after) : null
    for (const flag of [beforeFlag, afterFlag]) {
      if (!flag) continue
      const key = `${flag.component_id}::${flag.kpi_id}`
      if (!seenUnverified.has(key)) {
        seenUnverified.add(key)
        unverified.push(flag)
      }
    }
  }

  return {
    config_before: config,
    config_after,
    swap,
    changed,
    held,
    unverified,
  }
}
