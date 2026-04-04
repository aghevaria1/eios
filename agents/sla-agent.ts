import Anthropic from '@anthropic-ai/sdk'
import { bus } from '../lib/bus'
import { mcpTools } from '../lib/mcp-tools'
import { retrieve } from '../lib/rag'
import { PlacementDecision, SLAAlert } from '../lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runSLAAgent(
  decision: PlacementDecision,
  onStream?: (token: string) => void
): Promise<SLAAlert> {
  const slaData = mcpTools.get_sla_contract(decision.customerId)

  const slaContext = retrieve(
    `${decision.customerId} SLA breach penalty uptime latency throughput`
  )

  const prompt = `You are the SLA Guardian Agent in EIOS — EdgeInferenceOS.

The Placement Agent has made a decision. You must determine if an SLA breach occurred, write the full root cause analysis, and log the incident.

PLACEMENT DECISION:
Source Node: ${decision.sourceNodeId}
Customer: ${decision.customerId}
Action Taken: ${decision.action}
Target Node: ${decision.targetNodeId ?? 'None'}
Reasoning: ${decision.reasoning}
Timestamp: ${new Date(decision.timestamp).toISOString()}

SLA CONTRACT:
${JSON.stringify(slaData, null, 2)}

RELEVANT SLA CONTEXT:
${slaContext.map(r => `[${r.source}]\n${r.content}`).join('\n\n')}

Your job:
1. Determine if the SLA was breached (YES or NO)
2. Write a complete Root Cause Analysis in plain English that a Cisco/Hippocratic/OpenColo executive could read
3. State what action was taken and what the financial impact is
4. State whether the incident is resolved or still active

Format your response as:

BREACH: YES or NO
RCA: [your full root cause analysis — 3-5 sentences]
ACTION: [what was done]
FINANCIAL IMPACT: [estimated penalty or none]
STATUS: RESOLVED or MONITORING`

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullResponse += chunk.delta.text
      onStream?.(chunk.delta.text)
    }
  }

  const breachConfirmed = fullResponse.includes('BREACH: YES')

  const result = mcpTools.write_incident({
    nodeId: decision.sourceNodeId,
    customerId: decision.customerId,
    severity: breachConfirmed ? 'HIGH' : 'MEDIUM',
    anomaly: `Action: ${decision.action} → Target: ${decision.targetNodeId ?? 'None'}`,
    decision: decision.action,
    rca: fullResponse
  })

  const alert: SLAAlert = {
    nodeId: decision.sourceNodeId,
    customerId: decision.customerId,
    breachConfirmed,
    rca: fullResponse,
    action: decision.action,
    incidentId: 'incidentId' in result ? result.incidentId : 'unknown',
    timestamp: Date.now()
  }

  bus.emitSLAAlert(alert)
  return alert
}