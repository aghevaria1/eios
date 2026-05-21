// KPI catalog — dependency-graph backbone.
//
// Each KPI declares its dependencies (which component slot(s) it depends on).
// The engine uses this to classify KPIs as CHANGED vs HELD when a component is swapped.
//
// Tier 1: compute / fabric / north-star KPIs (architecture-set, OEM/ISV-invariant for the compute layer).
// Tier 2: operational / commercial KPIs (lead-time, service, deployment, portability, skills, compliance).

import type { KpiDefinition } from './types'

export const KPI_DEFINITIONS: KpiDefinition[] = [
  // ─────────────────────────────────────────────────────────
  // Tier 1 — compute KPIs (gpu-dependent only)
  // ─────────────────────────────────────────────────────────
  {
    id: 'compute_memory_capacity_per_gpu',
    name: 'GPU memory capacity (per GPU)',
    tier: 1,
    dependencies: ['gpu'],
    description: 'HBM capacity per GPU. gpu-set; fabric/oem/isv-invariant.',
  },
  {
    id: 'compute_memory_bandwidth_per_gpu',
    name: 'GPU memory bandwidth (per GPU)',
    tier: 1,
    dependencies: ['gpu'],
    description: 'HBM bandwidth per GPU in TB/s. gpu-set.',
  },
  {
    id: 'compute_flops_fp4_per_gpu_dense',
    name: 'GPU FP4 FLOPS (per GPU, dense)',
    tier: 1,
    dependencies: ['gpu'],
    description: 'Dense FP4 Tensor Core throughput per GPU. gpu-set.',
    honesty_note: 'Dense vs sparse footnoted by vendor; treat sparse as ~2x dense.',
  },
  {
    id: 'compute_flops_fp8_per_gpu_dense',
    name: 'GPU FP8 FLOPS (per GPU, dense)',
    tier: 1,
    dependencies: ['gpu'],
    description: 'Dense FP8 Tensor Core throughput per GPU. gpu-set.',
  },

  // ─────────────────────────────────────────────────────────
  // Tier 1 — fabric KPIs (fabric-dependent only)
  // ─────────────────────────────────────────────────────────
  {
    id: 'fabric_throughput',
    name: 'Fabric throughput (per port)',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Per-port line rate.',
  },
  {
    id: 'fabric_latency',
    name: 'Fabric latency',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Switch latency / fabric tail latency. Vendor benchmarks differ on what they measure — treat with care.',
    honesty_note: 'NVIDIA does not publish a single latency number for Spectrum-X. Cornelis publishes a relative-latency claim vs NDR. Cited values are scarce; most are claimed or directional.',
  },
  {
    id: 'fabric_message_rate',
    name: 'Fabric message rate',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Messages per second across the fabric. Vendor-specific test methodology.',
  },
  {
    id: 'fabric_collective_op',
    name: 'Collective-operation performance',
    tier: 1,
    dependencies: ['fabric'],
    description: 'AllReduce / AllGather / reduce-scatter performance.',
    honesty_note: 'SCALE-CONDITIONAL — winner depends on node count. Cornelis wins small-node HPC. NVIDIA wins large-scale via SHARP / NCCL.',
  },
  {
    id: 'fabric_cost_capex_directional',
    name: 'Fabric CapEx (directional)',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Directional band only. NEVER a point dollar figure.',
    honesty_note: 'No published per-port CapEx from most vendors. Directional bands reflect analyst characterization.',
  },
  {
    id: 'fabric_buying_philosophy',
    name: 'Fabric buying philosophy (customer archetype)',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Customer-archetype framing: NVIDIA = integration / risk-mitigation; Broadcom/Arista = disaggregation / flexibility; Cornelis = extreme-performance-tuning.',
  },

  // ─────────────────────────────────────────────────────────
  // Tier 1 — composite / north-star KPIs (multi-dependency)
  // ─────────────────────────────────────────────────────────
  {
    id: 'compute_mfu',
    name: 'Model FLOPS Utilization (MFU)',
    tier: 1,
    dependencies: ['gpu', 'fabric', 'software'],
    description: 'North-star for Frontier AI Labs. Compute throughput as fraction of theoretical peak.',
    honesty_note: 'Directional only — published MFU depends on workload, parallelism strategy, fabric, software stack.',
  },
  {
    id: 'compute_time_to_train',
    name: 'Time-to-Train (TTT)',
    tier: 1,
    dependencies: ['gpu', 'fabric', 'software'],
    description: 'North-star for Frontier AI Labs. Wall-clock time to train a target model size.',
  },
  {
    id: 'compute_tco_per_token',
    name: 'TCO per token',
    tier: 1,
    dependencies: ['gpu', 'fabric', 'software', 'oem'],
    description: 'North-star for Hyperscalers. $ per million tokens generated (inference) or trained (training).',
    honesty_note: 'Always directional. NEVER a summed point value — capex and opex tracked separately.',
  },
  {
    id: 'compute_production_roi',
    name: 'Production ROI',
    tier: 1,
    dependencies: ['gpu', 'software', 'isv', 'oem'],
    description: 'North-star for Fortune 500 Enterprise. Realized ROI on production AI deployments.',
    honesty_note: 'Multi-dependency. Fabric NOT in direct deps — fabric affects inference p99 (supporting), not the headline ROI.',
  },
  {
    id: 'compute_domain_accuracy',
    name: 'Domain accuracy',
    tier: 1,
    dependencies: ['gpu', 'software', 'isv'],
    description: 'North-star for Industry Verticals. Domain-specific model accuracy (healthcare, manufacturing).',
  },
  {
    id: 'compute_safety_latency',
    name: 'Safety latency',
    tier: 1,
    dependencies: ['gpu', 'fabric', 'software'],
    description: 'North-star for Industry Verticals (safety-critical paths). End-to-end inference latency for safety responses.',
  },
  {
    id: 'compute_inference_p99',
    name: 'Inference latency p99',
    tier: 1,
    dependencies: ['gpu', 'fabric', 'software'],
    description: 'Supporting KPI for Fortune 500 + Industry Verticals. p99 inference latency including fabric round-trip.',
  },
  {
    id: 'compute_checkpoint_resume_latency',
    name: 'Checkpoint / resume latency',
    tier: 1,
    dependencies: ['gpu', 'fabric'],
    description: 'Supporting KPI for Frontier. Time to checkpoint and resume — fabric-bound at large scale.',
  },
  {
    id: 'compute_hardware_density',
    name: 'Hardware density (GPUs per rack)',
    tier: 1,
    dependencies: ['gpu', 'oem'],
    description: 'Supporting KPI for Hyperscalers. Rack physical density.',
  },
  {
    id: 'compute_edge_efficiency',
    name: 'Edge compute efficiency',
    tier: 1,
    dependencies: ['gpu'],
    description: 'Supporting KPI for Industry Verticals. Performance / watt at the edge.',
  },
  {
    id: 'compute_digital_twin_sync',
    name: 'Digital twin sync latency',
    tier: 1,
    dependencies: ['gpu', 'fabric'],
    description: 'Supporting KPI for Industry Verticals. Real-world → simulation update latency.',
  },
  {
    id: 'fabric_interconnect_throughput',
    name: 'Interconnect throughput (supporting)',
    tier: 1,
    dependencies: ['fabric'],
    description: 'Supporting KPI for Frontier AI Labs. Effective bisection bandwidth across the cluster.',
  },

  // ─────────────────────────────────────────────────────────
  // Tier 2 — operational / commercial KPIs
  // ─────────────────────────────────────────────────────────
  {
    id: 'ops_lead_time',
    name: 'Procurement lead time',
    tier: 2,
    dependencies: ['gpu', 'oem'],
    description: 'Time from order to rack-power-up.',
  },
  {
    id: 'ops_service_footprint',
    name: 'Service / support footprint',
    tier: 2,
    dependencies: ['oem'],
    description: 'Regional service coverage, SLA tier.',
  },
  {
    id: 'ops_deployment_cycle_time',
    name: 'Deployment cycle time',
    tier: 2,
    dependencies: ['isv', 'oem'],
    description: 'Time from hardware-ready to production traffic.',
  },
  {
    id: 'ops_portability_index',
    name: 'Portability index',
    tier: 2,
    dependencies: ['isv'],
    description: 'How portable is the workload across hardware/cloud (Kubernetes, OCI containers, model packaging).',
  },
  {
    id: 'ops_skills_fit',
    name: 'Skills-fit (existing team alignment)',
    tier: 2,
    dependencies: ['software', 'isv'],
    description: 'Does the existing engineering team already have the skills (CUDA vs ROCm vs vendor-stack)?',
  },
  {
    id: 'ops_compliance_path',
    name: 'Compliance path',
    tier: 2,
    dependencies: ['isv', 'oem'],
    description: 'Audit / certification readiness (SOC2, HIPAA, FedRAMP).',
  },
  {
    id: 'ops_compliance_audit_time',
    name: 'Compliance audit time',
    tier: 2,
    dependencies: ['isv', 'oem'],
    description: 'Supporting KPI for Fortune 500. Hours to clear an audit cycle.',
  },
  {
    id: 'ops_pue',
    name: 'Power Usage Effectiveness (PUE)',
    tier: 2,
    dependencies: ['oem'],
    description: 'Supporting KPI for Hyperscalers. Datacenter-design metric.',
  },
  {
    id: 'ops_fleet_availability',
    name: 'Fleet availability',
    tier: 2,
    dependencies: ['oem'],
    description: 'Supporting KPI for Hyperscalers. Realized uptime across the fleet.',
  },
  {
    id: 'ops_data_residency_pct',
    name: 'Data residency (% in-region)',
    tier: 2,
    dependencies: ['oem', 'isv'],
    description: 'North-star for Sovereign AI. % of data + computation that stays within sovereign boundary.',
  },
  {
    id: 'ops_air_gap_capability',
    name: 'Air-gap capability',
    tier: 2,
    dependencies: ['oem', 'isv'],
    description: 'Supporting KPI for Sovereign AI. Can the stack operate fully disconnected from the public internet?',
  },
  {
    id: 'ops_security_perimeter',
    name: 'Security perimeter (band)',
    tier: 2,
    dependencies: ['isv', 'oem'],
    description: 'Supporting KPI for Sovereign AI. Defense-in-depth posture.',
  },
  {
    id: 'ops_safety_certification',
    name: 'Safety certification (path)',
    tier: 2,
    dependencies: ['isv'],
    description: 'Supporting KPI for Industry Verticals. FDA, IEC 61508, ISO 26262 readiness paths.',
  },
  {
    id: 'ops_tco_capex_directional',
    name: 'TCO CapEx (directional band)',
    tier: 2,
    dependencies: ['gpu', 'fabric', 'oem'],
    description: 'CapEx component of TCO. ALWAYS directional band, NEVER point value, NEVER summed with OpEx by this module.',
  },
  {
    id: 'ops_tco_opex_directional',
    name: 'TCO OpEx (directional band)',
    tier: 2,
    dependencies: ['oem', 'isv'],
    description: 'OpEx component of TCO. ALWAYS directional band, NEVER point value, NEVER summed with CapEx by this module.',
  },
]

export function getKpiById(id: string): KpiDefinition | undefined {
  return KPI_DEFINITIONS.find((k) => k.id === id)
}
