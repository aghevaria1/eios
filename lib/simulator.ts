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
    if