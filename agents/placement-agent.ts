import Anthropic from '@anthropic-ai/sdk'
import { bus } from '../lib/bus'
import { mcpTools } from '../lib/mcp-tools'
import { retrieveRunbooks } from '../lib/rag'
import { AnomalyEvent, PlacementDecision } from '../lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runPlacementAgent(
  anomaly: AnomalyEvent,
  onStream?: (token: string) => void
): Promise<PlacementDecision> {
  const allNodeData = mcpTools.get_node_metrics(anomaly.nodeId)
  const slaData = mcpTools.get_sla_contract(anomaly.customerId)

  const runbooks = retrieveRunbooks(
    `${anomaly.anomalies.join(' ')} ${anomaly.severity} failover reroute`
  )

  const allNodes = 'allNodes' in allNodeData ? allNodeData.allNodes : []
  const candidateNodes = allNodes.filter((n: any) => 
    n.nodeId !== anomaly.nodeId && n.util < 85
  )

  const prompt = `You are the Placement Agent in EIOS — EdgeInferenceOS.

You have received an anomaly event from the Telemetry Agent and must decide the best placement action.

ANOMALY EVENT:
Node: ${anomaly.nodeId}
Customer: ${anomaly.customerId}
Severity: ${anomaly.severity}
Anomalies detected:
${anomaly.anomalies.map(a => `- ${a}`).join('\n')}

ALL NODE STATUS:
${JSON.stringify(allNodes, null, 2)}

CANDIDATE FAILOVER NODES (util < 85%):
${candidateNodes.length > 0 ? JSON.stringify(candidateNodes, null, 2) : 'NO VIABLE CANDIDATES — all nodes at capacity'}

SLA CONTRACT:
${JSON.stringify(slaData, null, 2)}

RELEVANT RUNBOOKS:
${runbooks.length > 0 ? runbooks.map(r => `[${r.source}]\n${r.content}`).join('\n\n') : 'No matching runbooks'}

Decide the placement action. Choose ONE of:
- REROUTE: redirect traffic to a specific target node
- SCALE: hold traffic and scale current node (reduce batch size, shed load)
- HOLD: monitor only, no action yet
- FAILOVER: emergency full failover

State your decision, target node (if REROUTE or FAILOVER), reasoning, and SLA impact.
Be direct. 3-4 sentences.`

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

  const action = reasoning.includes('FAILOVER') ? 'FAILOVER' :
    reasoning.includes('REROUTE') ? 'REROUTE' :
    reasoning.includes('SCALE') ? 'SCALE' : 'HOLD'

  const targetMatch = reasoning.match(/pod-[a-z]+/)
  const targetNodeId = targetMatch ? targetMatch[0] : 
    candidateNodes.length > 0 ? candidateNodes[0].nodeId : null

  const decision: PlacementDecision = {
    sourceNodeId: anomaly.nodeId,
    customerId: anomaly.customerId,
    action,
    targetNodeId: action === 'HOLD' ? null : targetNodeId,
    reasoning,
    slaImpact: reasoning,
    timestamp: Date.now()
  }

  bus.emitPlacement(decision)
  return decision
}