// Public exports for the dependency-graph KPI engine.

export { KPI_DEFINITIONS, getKpiById } from './definitions'
export { loadKnowledge, clearKnowledgeCache } from './knowledge'
export { applySwap, buildConfig } from './engine'
export type {
  ProvenanceStatus,
  Provenance,
  DependencyTag,
  Tier,
  KpiValue,
  KpiDefinition,
  Component,
  Layer,
  Segment,
  Architecture,
  ConfigState,
  ComponentSwap,
  SwapImpact,
  UnverifiedFlag,
  SwapReport,
} from './types'
