export interface NodeMetrics {
  nodeId: string
  util: number
  tempC: number
  tokensPerSec: number
  memUsedGB: number
  memTotalGB: number
  powerW: number
  timestamp: number
}

export interface NodeConfig {
  id: string
  name: string
  gpu: string
  memTotalGB: number
  maxTempC: number
  maxPowerW: number
  customerId: string
}

export interface SLAContract {
  customerId: string
  companyName: string
  tier: string
  sla: {
    maxLatencyMs: number
    minUptimePct: number
    maxCostPerTokenK: number
    maxTempC: number
    minTokensPerSec: number
    maxMemUsedPct: number
  }
  penalties: {
    perHourDowntime: number
    perLatencyBreach: number
  }
  nodes: string[]
}

export interface AnomalyEvent {
  nodeId: string
  customerId: string
  metrics: NodeMetrics
  anomalies: string[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  similarIncidents: string[]
  timestamp: number
}

export interface PlacementDecision {
  sourceNodeId: string
  customerId: string
  action: 'REROUTE' | 'SCALE' | 'HOLD' | 'FAILOVER'
  targetNodeId: string | null
  reasoning: string
  slaImpact: string
  timestamp: number
}

export interface SLAAlert {
  nodeId: string
  customerId: string
  breachConfirmed: boolean
  rca: string
  action: string
  incidentId: string
  timestamp: number
}

export interface RAGResult {
  content: string
  source: string
  similarity: number
}