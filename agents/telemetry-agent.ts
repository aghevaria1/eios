import Anthropic from '@anthropic-ai/sdk'
import { bus } from '../lib/bus'
import { mcpTools } from '../lib/mcp-tools'
import { retrieveIncidents } from '../lib/rag'
import { NodeMetrics, AnomalyEvent } from '../lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function detectAnomalies(metrics: NodeMetrics, slaThresholds: any): string[] {
  const anomalies: string[] = []
  if (metrics.util > 90) anomalies.push(`GPU utilization critical: ${metrics.util.toFixed(1)}%`)
  if (metrics.tempC > 82) anomalies.push(`Temperature high: ${metrics.tempC.toFixed(1)}C`)
  if (metrics.tokensPerSec < 200) anomalies.push(`Throughput degraded: ${metrics.tokensPerSec.toFixed(0)} tokens/sec`)
  const memPct = (metrics.memUsedGB / metrics.memTotalGB) * 100
  if (memPct > 88) anomalies.push(`Memory pressure: ${memPct.toFixed(1)}% used`)
  if (slaThresholds) {
    if (metrics.tempC > slaThresholds.maxTempC) anomalies.push(`SLA temp threshold breached: ${metrics.tempC.toFixed(1)}C > ${slaThresholds.maxTempC}C`)
    if (metrics.tokensPerSec < slaThresholds.minTokensPerSec) anomalies.push(`SLA throughput threshold breached: ${metrics.tokensPerSec.toFixed(0)} < ${slaThresholds.minTokensPerSec} tokens/sec`)
  }
  return anomalies
}

function getSeverity(anomalies: string[]): AnomalyEvent['severity'] {
  if (anomalies.some(a => a.includes('critical') || a.includes('breached'))) return 'CRITICAL'
  if (anomalies.length >= 3) return 'HIGH'
  if (anomalies.length === 2) return 'MEDIUM'
  return 'LOW'
}

export async function runTelemetryAgent(
  metrics: NodeMetrics,
  onStream?: (token: string) => void
): Promise<AnomalyEvent | null> {
  const nodeData = mcpTools.get_node_metrics(metrics.nodeId)
  const slaData = mcpTools.get_sla_contract(metrics.nodeId.includes('alpha') || metrics.nodeId.includes('beta') ? 'cisco' :
    metrics.nodeId.includes('gamma') || metrics.nodeId.includes('delta') ? 'hippocratic' : 'opencolo')

  const slaThresholds = 'sla' in slaData ? slaData.sla : null
  const anomalies = detectAnomalies(metrics, slaThresholds)

  if (anomalies.length === 0) return null

  const similarIncidents = retrieveIncidents(
    `${metrics.nodeId} ${anomalies.join(' ')} util temp memory throughput`
  )

  const prompt = `You are the Telemetry Agent in EIOS — EdgeInferenceOS, an AI reasoning layer for edge inference infrastructure.

LIVE NODE METRICS:
Node: ${metrics.nodeId}
GPU Utilization: ${metrics.util.toFixed(1)}%
Temperature: ${metrics.tempC.toFixed(1)}C
Tokens/sec: ${metrics.tokensPerSec.toFixed(0)}
Memory: ${metrics.memUsedGB.toFixed(1)}GB / ${metrics.memTotalGB}GB (${((metrics.memUsedGB/metrics.memTotalGB)*100).toFixed(1)}%)
Power: ${metrics.powerW.toFixed(0)}W

DETECTED ANOMALIES:
${anomalies.map(a => `- ${a}`).join('\n')}

TREND DATA (1hr):
${nodeData && 'trend' in nodeData && nodeData.trend ? JSON.stringify(nodeData.trend, null, 2) : 'No trend data yet'}

SIMILAR HISTORICAL INCIDENTS:
${similarIncidents.length > 0 ? similarIncidents.map(r => `[${r.source}]\n${r.content}`).join('\n\n') : 'No similar incidents found'}

SLA CONTRACT:
${JSON.stringify(slaData, null, 2)}

Analyze this situation. Explain:
1. What is happening on this node right now
2. How it matches or differs from historical patterns
3. Severity assessment and urgency
4. What the downstream agents should know

Be concise and technical. 3-4 sentences max.`

  let reasoning = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      reasoning += chunk.delta.text
      onStream?.(chunk.delta.text)
    }
  }

  const event: AnomalyEvent = {
    nodeId: metrics.nodeId,
    customerId: 'sla' in slaData ? slaData.customerId : 'unknown',
    metrics,
    anomalies,
    severity: getSeverity(anomalies),
    similarIncidents: similarIncidents.map(r => r.source),
    timestamp: Date.now()
  }

  bus.emitAnomaly(event)
  return event
}