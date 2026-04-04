import { getMetrics, getNodeTrend, getAllMetrics } from './simulator'
import { writeIncident, getRecentMetrics } from './db'
import { NodeMetrics, SLAContract } from './types'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

function loadSLA(customerId: string): SLAContract | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'sla-contracts', `${customerId}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

export const mcpTools = {
  get_node_metrics: (nodeId: string) => {
    const live = getMetrics(nodeId)
    const trend = getNodeTrend(nodeId)

    if (!live) return { error: `Node ${nodeId} not found` }

    const trendSummary = trend.length > 0 ? {
      avgUtil: (trend as any[]).reduce((a, b) => a + b.util, 0) / trend.length,
      avgTemp: (trend as any[]).reduce((a, b) => a + b.tempC, 0) / trend.length,
      avgTokens: (trend as any[]).reduce((a, b) => a + b.tokensPerSec, 0) / trend.length,
      peakUtil: Math.max(...(trend as any[]).map(t => t.util)),
      peakTemp: Math.max(...(trend as any[]).map(t => t.tempC)),
      dataPoints: trend.length
    } : null

    return {
      live,
      trend: trendSummary,
      allNodes: getAllMetrics().map(m => ({
        nodeId: m.nodeId,
        util: m.util,
        tempC: m.tempC,
        tokensPerSec: m.tokensPerSec,
        memUsedPct: (m.memUsedGB / m.memTotalGB) * 100
      }))
    }
  },

  get_sla_contract: (customerId: string) => {
    const sla = loadSLA(customerId)
    if (!sla) return { error: `SLA contract for ${customerId} not found` }
    return sla
  },

  write_incident: (params: {
    nodeId: string
    customerId: string
    severity: string
    anomaly: string
    decision?: string
    rca?: string
  }) => {
    const id = `INC-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`
    writeIncident({ id, ...params })
    return { success: true, incidentId: id }
  },

  run_whatif_simulation: (scenario: string) => {
    const allNodes = getAllMetrics()
    const modified = allNodes.map(node => {
      const scenarioLower = scenario.toLowerCase()
      if (scenarioLower.includes(node.nodeId)) {
        if (scenarioLower.includes('hbm') || scenarioLower.includes('memory')) {
          return { ...node, memUsedGB: node.memTotalGB * 0.97, util: Math.min(99, node.util + 20) }
        }
        if (scenarioLower.includes('temp') || scenarioLower.includes('thermal')) {
          return { ...node, tempC: node.tempC + 15, tokensPerSec: node.tokensPerSec * 0.6 }
        }
        if (scenarioLower.includes('fail') || scenarioLower.includes('down')) {
          return { ...node, util: 0, tokensPerSec: 0, tempC: 0 }
        }
        if (scenarioLower.includes('peak') || scenarioLower.includes('surge')) {
          return { ...node, util: 96, tempC: node.tempC + 8, tokensPerSec: node.tokensPerSec * 0.7 }
        }
      }
      return node
    })
    return {
      scenario,
      originalState: allNodes,
      simulatedState: modified,
      affectedNodes: modified.filter((n, i) => n.util !== allNodes[i].util || n.tempC !== allNodes[i].tempC)
    }
  }
}