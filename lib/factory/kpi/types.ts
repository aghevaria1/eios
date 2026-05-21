// Types for the dependency-graph KPI engine.
//
// HONESTY BOUNDARY (enforced in this type system):
// - Every datum carries a Provenance.
// - Numerical KPIs are RANGES or directional bands, never single computed point values.
// - TCO splits into capex/opex, NEVER summed by this module.
// - The engine is pure (no API calls); LLM never computes KPI values, it only reads engine output.

export type ProvenanceStatus = 'cited' | 'claimed' | 'directional'

export interface Provenance {
  status: ProvenanceStatus
  source?: string
  source_url?: string
  source_date?: string
  claimed_by?: string
  notes?: string
  last_verified: string
  flag?: 'verify-needed'
}

export type DependencyTag = 'gpu' | 'fabric' | 'software' | 'oem' | 'isv'

export type Tier = 1 | 2

export interface KpiValue {
  range?: { min: number; max: number; unit?: string }
  band?: 'low' | 'medium' | 'high' | 'wins' | 'loses' | 'parity' | 'tbd'
  text?: string
  scale_conditional?: {
    small_scale: string
    large_scale: string
    breakpoint?: string
  }
  provenance: Provenance
}

export interface KpiDefinition {
  id: string
  name: string
  tier: Tier
  dependencies: DependencyTag[]
  description?: string
  honesty_note?: string
}

export interface Component {
  id: string
  name: string
  slot?: string
  layer?: string
  vendor?: string
  kpi_values?: Record<string, KpiValue>
}

export interface Layer {
  id: string
  name: string
  description: string
}

export interface Segment {
  id: string
  name: string
  subtitle?: string
  north_star_kpis: string[]
  supporting_kpis: string[]
  // Segment-scoped KPI values — outcome KPIs, SLO conventions, and TCO bands
  // that semantically live at the segment level, not on a component.
  // Engine resolution checks here first; falls back to component.kpi_values.
  delivered_kpis?: Record<string, KpiValue>
  provenance: Provenance
}

export interface Architecture {
  id: string
  name: string
  positioning?: string
  default_components: {
    gpu: string
    fabric: string
    software: string
    oem: string
    isv: string
  }
  provenance: Provenance
}

export interface ConfigState {
  segment: string
  architecture: string
  gpu: string
  fabric: string
  software: string
  oem: string
  isv: string
}

export interface ComponentSwap {
  slot: DependencyTag
  from: string
  to: string
}

export interface SwapImpact {
  kpi: KpiDefinition
  status: 'changed' | 'held'
  before: KpiValue | null
  after: KpiValue | null
  why: string
}

export interface UnverifiedFlag {
  component_id: string
  kpi_id: string
  status: ProvenanceStatus
  notes?: string
}

export interface SwapReport {
  config_before: ConfigState
  config_after: ConfigState
  swap: ComponentSwap
  changed: SwapImpact[]
  held: SwapImpact[]
  unverified: UnverifiedFlag[]
}
