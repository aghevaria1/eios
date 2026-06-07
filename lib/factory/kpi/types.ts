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

// Component-level descriptive metadata — NOT a KPI. Used by fabric components
// (and any others where useful) to attach a generation-jump claim or a
// protocol-stack capability description with its own provenance tag, without
// polluting the KPI catalog (which is reserved for comparable metrics that
// ripple through the dependency graph in applySwap).
export interface ComponentNote {
  text: string
  provenance: Provenance
}

export type ComponentGeneration = 'current' | 'prior' | 'roadmap'

export interface Component {
  id: string
  name: string
  slot?: string
  layer?: string
  vendor?: string
  // Optional sub-classification. Currently used by ISV components to split
  // storage ISVs (VAST Data) from orchestration ISVs (Red Hat OpenShift AI,
  // VMware Private AI Foundation, Nutanix Enterprise AI). Other slots may
  // adopt category-style grouping later.
  category?: IsvCategory
  // Generational marker — currently shipping vs prior-gen reference vs roadmap.
  // 'roadmap' is reserved for not-yet-announced products (CN7000, Vera Rubin)
  // and is unused in current seedings.
  generation?: ComponentGeneration
  // Component-level descriptive metadata fields (each with its own provenance).
  // Currently used by Cornelis CN6000 to surface its "2x prior-gen" vendor
  // claim and its multi-protocol product spec without making either a KPI.
  performance_vs_prior?: ComponentNote
  protocol?: ComponentNote
  kpi_values?: Record<string, KpiValue>
}

export type IsvCategory = 'storage' | 'orchestration'

export interface Layer {
  id: string
  name: string
  description: string
}

// Per-segment L1 (Land/Power/Shell) facility profile. The RA blend at L2
// drives the facility requirement — NVL72 mandates liquid cooling at ~120 kW/
// rack; HGX runs air or hybrid; RTX PRO/edge stays air-cooled at lower
// density. `text` is the verbatim per-segment facility description. The
// optional `trajectory_note` carries a forward-looking density projection
// (currently the Vera Rubin NVL144 ~600 kW/rack note for Frontier and
// Hyperscaler) with its OWN provenance tag — roadmap, not current shipping.
export interface L1Profile {
  text: string
  provenance: Provenance
  trajectory_note?: {
    text: string
    provenance: Provenance
  }
}

// Per-segment reference-architecture blend. Most NVIDIA segments deploy more
// than one RA (e.g., HGX for training + RTX PRO for inference). The blend is
// the honest description of that reality; single-RA segments use a one-item ras.
//
// The FIRST entry in `ras` is the lead RA (used as the cake's primary reference
// and for buildConfig fallback). Per-RA `role` is set ONLY where the matrix
// specifies one (FT500: training/inference; Verticals: specialized
// training/edge inference). For segments whose matrix gives a segment-level
// descriptor ("co-engineered", "full-spectrum"), `role` stays absent and the
// rationale lives entirely in `note`.
export interface ArchitectureBlend {
  ras: { id: string; role?: string }[]
  note: string
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
  // Per-segment RA blend — ordered list of architectures the segment deploys.
  architecture_blend?: ArchitectureBlend
  // Per-segment ISV blend — ordered list of ISV component ids, lead-first.
  // Wins over architecture.default_components.isv when present (segment-first
  // resolution, same pattern as delivered_kpis). The engine's buildConfig
  // resolves the LEAD (isv_blend[0]); the cake renders the full list at L3.
  isv_blend?: string[]
  isv_rationale?: string
  // Per-segment L1 (Land/Power/Shell) facility profile. Replaces the uniform
  // stack.json L1 description with segment-specific facility physics driven
  // by the RA blend (liquid-mandatory for NVL72, air-cooled ceiling for HGX,
  // edge constraints for RTX PRO).
  l1_profile?: L1Profile
  // Partner-PM battleground flag. Marks segments where flawless multi-OEM
  // execution (Dell / HPE / Lenovo / Cisco / Supermicro) is the critical
  // commercial axis. Currently: Fortune 500 + Sovereign AI.
  is_battleground?: boolean
  battleground_note?: string
  // Partner-channel intensity gradient — finer-grained companion to
  // is_battleground. The binary flag marks the matrix's two headline
  // battlegrounds; this gradient ranks ALL segments by how partner-served
  // they are (hyperscaler direct ↔ channel-saturated enterprise).
  partner_intensity?: PartnerIntensity
  partner_intensity_rationale?: string
  // Grounding fields — make each segment concrete and vivid without making
  // any claim about a specific customer's actual infrastructure. All three
  // are framed illustratively (the framing words "e.g.", "-class", and
  // "representative build:" / "~" do the honesty work). They add SEGMENT
  // CONTEXT, not KPI provenance — no KPI is touched by these fields, no
  // provenance is changed, and no deployment is tied to a named exemplar.
  archetype?: string
  buying_behavior?: string
  representative_deployment?: string
  // Customer-AND-competitor duality note — currently seeded only for the
  // hyperscaler segment, which is structurally distinct: the same companies
  // are NVIDIA's largest customers AND its self-supply competitors via
  // their custom silicon programs (TPU, Maia, etc.). Cross-references the
  // CUSTOMER SELF-SUPPLY competitive view. Generic field shape so other
  // segments could acquire similar duality framing later if appropriate.
  customer_competitor_note?: string
  // Customer-AND-channel duality note — currently seeded only for the
  // neocloud segment: pure-play GPU-rental clouds are simultaneously
  // NVIDIA's massive customers AND a go-to-market channel for NVIDIA
  // (cf. Jan 2026 CoreWeave SUNK + Mission Control integration into
  // NVIDIA reference architectures). Distinct from customer_competitor_note
  // — different dual-role flavor (channel/partner, not competitor).
  customer_channel_note?: string
  provenance: Provenance
}

export type PartnerIntensity =
  | 'low'
  | 'low-medium'
  | 'medium'
  | 'medium-high'
  | 'high'

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
