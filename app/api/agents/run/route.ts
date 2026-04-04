import { NextRequest } from 'next/server'
import { getAllMetrics, startSimulator } from '../../../../lib/simulator'
import { runTelemetryAgent } from '../../../../agents/telemetry-agent'
import { runPlacementAgent } from '../../../../agents/placement-agent'
import { runSLAAgent } from '../../../../agents/sla-agent'
import { AnomalyEvent } from '../../../../lib/types'
import { initRAG } from '../../../../lib/rag'
import { getDB } from '../../../../lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController
  let closed = false

  const stream = new ReadableStream({
    start(c) {
      controller = c
    }
  })

  const send = (type: string, payload: any) => {
    if (closed) return
    try {
      const data = `data: ${JSON.stringify({ type, payload })}\n\n`
      controller!.enqueue(encoder.encode(data))
    } catch {}
  }

  ;(async () => {
    try {
   console.log('[AGENTS] Pipeline starting...')
      getDB()
      initRAG()
      startSimulator()
      await new Promise(resolve => setTimeout(resolve, 2000))
      const allMetrics = getAllMetrics()
      console.log('[AGENTS] Metrics count:', allMetrics.length)
      if (allMetrics.length === 0) {
        send('error', { message: 'No metrics available.' })
        return
      }

      const sorted = [...allMetrics].sort((a, b) => {
        const scoreA = (a.util / 100) + (a.tempC / 90) + (1 - a.tokensPerSec / 1000)
        const scoreB = (b.util / 100) + (b.tempC / 90) + (1 - b.tokensPerSec / 1000)
        return scoreB - scoreA
      })

      const target = sorted[0]
      send('status', { message: `Analyzing ${target.nodeId}...`, agent: 'telemetry' })

      let anomaly = await runTelemetryAgent(target, (token) => {
        send('stream', { agent: 'telemetry', token })
      })

      if (!anomaly) {
        const customerId = target.nodeId.includes('alpha') || target.nodeId.includes('beta') ? 'cisco' :
          target.nodeId.includes('gamma') || target.nodeId.includes('delta') ? 'hippocratic' : 'opencolo'

        anomaly = {
          nodeId: target.nodeId,
          customerId,
          metrics: target,
          anomalies: [
            `GPU utilization at ${target.util.toFixed(1)}% — monitoring for escalation`,
            `Temperature at ${target.tempC.toFixed(1)}C — within range but trending`,
            `Throughput at ${target.tokensPerSec.toFixed(0)} tok/s — baseline check`
          ],
          severity: 'MEDIUM' as AnomalyEvent['severity'],
          similarIncidents: [],
          timestamp: Date.now()
        }
        send('status', { message: `Proactive analysis of ${target.nodeId}...`, agent: 'telemetry' })

        const { runTelemetryAgent: runAgent } = await import('../../../../agents/telemetry-agent')
        await runAgent(target, (token) => {
          send('stream', { agent: 'telemetry', token })
        })
      }

      send('anomaly', anomaly)
      send('status', { message: 'Running Placement Agent...', agent: 'placement' })

      const decision = await runPlacementAgent(anomaly, (token) => {
        send('stream', { agent: 'placement', token })
      })

      send('decision', decision)
      send('status', { message: 'Running SLA Guardian...', agent: 'sla' })

      const alert = await runSLAAgent(decision, (token) => {
        send('stream', { agent: 'sla', token })
      })

      send('alert', alert)
      send('status', { message: 'Pipeline complete.', agent: 'complete' })

   } catch (err: any) {
      console.error('[AGENTS] ERROR:', err)
      send('error', { message: err.message })
    } finally {
      closed = true
      try { controller!.close() } catch {}
    }
  })()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}