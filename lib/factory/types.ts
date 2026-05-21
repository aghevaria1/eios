// EdgeInferenceOS v2 — Director PM Operating Framework
// Data schemas for target-driven configuration.
// All target JSON in data/targets/<targetId>/ must conform to these types.

export interface Target {
  id: string
  name: string
  tagline: string
  products: string[]
  primary_product: string
}

export type SegmentId =
  | 'federal-hpc'
  | 'academic-hpc'
  | 'enterprise-ai'
  | 'neoclouds'
  | 'sovereign-ai'

export interface Workload {
  primary_mix: string | string[]
  typical_scale: string
  critical_characteristics: string | string[]
  latency_budget: string
  bottleneck_profile: string
  buying_criteria: string | string[]
}

export interface ReferenceArchitecture {
  products: string[]
  descriptions: string[]
  protocol_reasoning: string
}

export interface ChannelEcosystem {
  oem_odm: Array<{ name: string; role: string }>
  hpc_isvs?: string[]
  hpc_isvs_note?: string
  ai_ml_isvs: string[]
  day1_isv_priority: string | string[]
}

export interface TCOModel {
  deployment_scenario: string
  baseline_size: number
  default_horizon_years: 3 | 5
  cornelis_3yr_tco_M: number
  nvidia_3yr_tco_M: number
  broadcom_3yr_tco_M: number
  advantage_drivers: string[]
  sensitivity_inputs: {
    supply_lead_time_weeks: { default: number; min: number; max: number }
    deployment_size: { default: number; min: number; max: number }
  }
}

export interface ValueProposition {
  statement: string
  competitive_position: Array<{ vs: string; angle: string }>
}

export interface SourceRef {
  id: number
  section: string
  description: string
}

export interface Segment {
  id: SegmentId
  name: string
  subtitle: string
  badge?: string
  is_stub?: boolean
  workload: Workload
  architecture: ReferenceArchitecture
  channel: ChannelEcosystem
  tco: TCOModel
  value_proposition: ValueProposition
  sources: SourceRef[]
  inferences_flagged: string[]
  open_questions: string[]
}

export interface ProductGeneration {
  id: string
  name: string
  tagline: string
  bandwidth_gbps: number
  protocols: string[]
  lifecycle_phase: string
  shipping_since: string
  shipping_to: string | null
}

export interface ProductsFile {
  generations: ProductGeneration[]
}

export type CommitmentStatus = 'on_track' | 'at_risk' | 'slip'

export interface CommitmentRegisterEntry {
  customer: string
  commitment: string
  date: string
  status: CommitmentStatus
}

export interface EOLPhase {
  phase_number: number
  name: string
  trigger_criteria: string
  decision_dependencies: string
}

export interface RoadmapFile {
  timeline_start_year: number
  timeline_end_year: number
  generation_phases: Array<{
    generation: string
    phases: Array<{ phase: string; start: string; end: string }>
  }>
  eol_framework: {
    target_product: string
    methodology_only: boolean
    phases: EOLPhase[]
  }
  commitment_register: CommitmentRegisterEntry[]
}

export type PhaseGateLane =
  | 'architecture'
  | 'silicon_design'
  | 'validation'
  | 'isv_certification'
  | 'manufacturing'
  | 'supply_chain'
  | 'program'

export type PhaseGatePhase =
  | 'concept'
  | 'plan'
  | 'development'
  | 'sampling'
  | 'production'
  | 'sustaining'

export type PhaseGateStatus = 'closed' | 'in_progress' | 'at_risk' | 'future'

export interface PhaseGateCellState {
  lane: PhaseGateLane
  phase: PhaseGatePhase
  status: PhaseGateStatus
  target_date: string | null
  detail: string | null
}

export interface ExecDecision {
  title: string
  detail: string
  owner: string
  escalate_to: string
  target_date: string
}

export interface WhatIfScenario {
  id: string
  name: string
  slider_label: string
  slider_default: number
  slider_min: number
  slider_max: number
  impact_template: string
}

export interface PhaseGateFile {
  program: string
  methodology_framework_note: string
  lanes: PhaseGateLane[]
  phases: PhaseGatePhase[]
  states: PhaseGateCellState[]
  exec_decisions_needed: ExecDecision[]
  what_if_scenarios: WhatIfScenario[]
}

export interface TargetConfig {
  active_target: string
}
