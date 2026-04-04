import { NodeMetrics, NodeConfig } from './types'
import { logMetrics } from './db'
import fs from 'fs'
import path from 'path'

const nodesConfig: { nodes: NodeConfig[] } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'nodes.json'), 'utf-8')
)

interface NodeState {
  config: NodeConfig
  metrics: NodeMetrics
  degrading: boolean
  degradeTimer: number
}

const state: Map<string, NodeState> = new Map()

function initState() {
  for (const node of nodesConfig.nodes) {
    state.set(node.id, {
      config: node,
      metrics: {
        nodeId: node.id,
        util: 45 + Math.random() * 20,
        tempC: 55 + Math.random() * 10,
        tokensPerSec: node.memTotalGB === 96 ? 220 + Math.random() * 60 : 820 + Math.random() * 80,
        memUsedGB: node.memTotalGB * (0.4 + Math.random() * 0.2),
        memTotalGB: node.memTotalGB,
        powerW: node.maxPowerW * (0.5 + Math.random() * 0.2),
        timestamp: Date.now()
      },
      degrading: false,
      degradeTimer: 0
    })
  }
}

function nudge(value: number, delta: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value + (Math.random() - 0.5) * delta))
}

function tickNode(nodeState: NodeState): NodeMetrics {
  const { config, metrics, degrading } = nodeState

  if (degrading) {
    nodeState.degradeTimer--
    if (nodeState.degradeTimer <= 0) {
      nodeState.degrading = false
    }
    return {
      nodeId: config.id,
      util: Math.min(99, metrics.util + 2 + Math.random() * 3),
      tempC: Math.min(config.maxTempC + 2, metrics.tempC + 0.8 + Math.random()),
      tokensPerSec: Math.max(50, metrics.tokensPerSec - 30 - Math.random() * 20),
      memUsedGB: Math.min(config.memTotalGB * 0.98, metrics.memUsedGB + 2 + Math.random() * 3),
      memTotalGB: config.memTotalGB,
      powerW: Math.min(config.maxPowerW * 0.99, metrics.powerW + 15 + Math.random() * 10),
      timestamp: Date.now()
    }
  }

  return {
    nodeId: config.id,
    util: nudge(metrics.util, 8, 30, 85),
    tempC: nudge(metrics.tempC, 3, 50, 78),
    tokensPerSec: nudge(metrics.tokensPerSec, 40, 150, config.memTotalGB === 96 ? 300 : 950),
    memUsedGB: nudge(metrics.memUsedGB, 5, config.memTotalGB * 0.3, config.memTotalGB * 0.82),
    memTotalGB: config.memTotalGB,
    powerW: nudge(metrics.powerW, 30, config.maxPowerW * 0.4, config.maxPowerW * 0.85),
    timestamp: Date.now()
  }
}

function triggerChaos() {
  const nodes = Array.from(state.keys())
  const target = nodes[Math.floor(Math.random() * nodes.length)]
  const nodeState = state.get(target)!
  nodeState.degrading = true
  nodeState.degradeTimer = 6
  console.log(`[CHAOS] Degrading ${target}`)
}

let simulatorInterval: ReturnType<typeof setInterval> | null = null
let chaosInterval: ReturnType<typeof setInterval> | null = null

export function startSimulator() {
  if (simulatorInterval) return
  initState()

  simulatorInterval = setInterval(() => {
    for (const [nodeId, nodeState] of state.entries()) {
      const updated = tickNode(nodeState)
      nodeState.metrics = updated
      logMetrics(updated)
    }
  }, 5000)

  chaosInterval = setInterval(() => {
    triggerChaos()
  }, 45000)

  console.log('[SIMULATOR] Started')
}

export function stopSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval)
  if (chaosInterval) clearInterval(chaosInterval)
  simulatorInterval = null
  chaosInterval = null
}

export function getAllMetrics(): NodeMetrics[] {
  return Array.from(state.values()).map(s => s.metrics)
}

export function getMetrics(nodeId: string): NodeMetrics | null {
  return state.get(nodeId)?.metrics ?? null
}

export function getNodeTrend(nodeId: string) {
  return []
}