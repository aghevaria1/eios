// Public exports for the dependency-graph KPI engine.

export { KPI_DEFINITIONS, getKpiById } from './definitions'
export { loadKnowledge, clearKnowledgeCache } from './knowledge'
export { applySwap, buildConfig, lookupKpiValue } from './engine'
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
  ArchitectureBlend,
  PartnerIntensity,
  IsvCategory,
  ConfigState,
  ComponentSwap,
  SwapImpact,
  UnverifiedFlag,
  SwapReport,
} from './types'
