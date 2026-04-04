import { NextRequest } from 'next/server'
import { getAllMetrics } from '../../../../lib/simulator'
import { runTelemetryAgent } from '../../../../agents/telemetry-agent'
import { runPlacementAgent } from '../../../../agents/placement-agent'
import { runSLAAgent } from '../../../../agents/sla-agent'

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: any) => {
        const data = `data: ${JSON.stringify({ type, payload })}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      try {
        const allMetrics = getAllMetrics()
        if (allMetrics.length === 0) {
          send('error', { message: 'Simulator not started. Visit /api/telemetry first.' })
          controller.close()
          return
        }

        const sorted = [...allMetrics].sort((a, b) => {
          const scoreA = (a.util / 100) + (a.tempC / 90) + (1 - a.tokensPerSec / 1000)
          const scoreB = (b.util / 100) + (b.tempC / 90) + (1 - b.tokensPerSec / 1000)
          return scoreB - scoreA
        })

        const target = sorted[0]
        send('status', { message: `Analyzing ${target.nodeId}...`, agent: 'telemetry' })

        const anomaly = await runTelemetryAgent(target, (token) => {
          send('stream', { agent: 'telemetry', token })
        })

        if (!anomaly) {
          send('status', { message: 'No anomalies detected. All nodes healthy.', agent: 'telemetry' })
          controller.close()
          return
        }

        send('anomaly', anomaly)
        send('status', { message: 'Anomaly confirmed. Running Placement Agent...', agent: 'placement' })

        const decision = await runPlacementAgent(anomaly, (token) => {
          send('stream', { agent: 'placement', token })
        })

        send('decision', decision)
        send('status', { message: 'Decision made. Running SLA Guardian...', agent: 'sla' })

        const alert = await runSLAAgent(decision, (token) => {
          send('stream', { agent: 'sla', token })
        })

        send('alert', alert)
        send('status', { message: 'Incident logged. Pipeline complete.', agent: 'complete' })

      } catch (err: any) {
        send('error', { message: err.message })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}