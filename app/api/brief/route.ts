import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDB } from '../../../lib/db'
import { initRAG } from '../../../lib/rag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { incident, decision, alert } = body

    getDB()
    initRAG()

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Brief 1 — Internal Executive
          const internalprompt = `You are the EIOS NOC AI writing an internal executive brief for leadership.

INCIDENT DATA:
Node: ${incident?.nodeId}
Customer: ${incident?.customerId}
Severity: ${incident?.severity}
Action Taken: ${decision?.action} → ${decision?.targetNodeId ?? 'None'}
SLA Breach: ${alert?.breachConfirmed ? 'YES' : 'NO'}
RCA Summary: ${alert?.rca?.slice(0, 500)}

Write a concise internal NOC brief for executives. Format exactly as:

INTERNAL NOC BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━
Incident ID: [id]
Time: [current time]
Severity: [severity]
Customer Affected: [customer]
Node: [node]

WHAT HAPPENED:
[2 sentences — plain English, no jargon]

ACTION TAKEN:
[1 sentence — what EIOS did automatically]

SLA STATUS:
[Breached or Cleared — and financial impact if any]

CUSTOMER NOTIFIED: [Yes/No and how]

NEXT STEPS:
[2 bullet points]

Keep it under 150 words. Executive tone.`

          const internalStream = await client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            messages: [{ role: 'user', content: internalprompt }]
          })

          for await (const chunk of internalStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              send({ type: 'internal', token: chunk.delta.text })
            }
          }

          // Brief 2 — Customer
          const customerName = incident?.customerId === 'cisco' ? 'Cisco Systems' :
            incident?.customerId === 'hippocratic' ? 'Hippocratic AI' : 'OpenColo'

          const customerprompt = `You are the EIOS NOC AI writing a customer-facing service notification for ${customerName}.

INCIDENT DATA:
Node: ${incident?.nodeId}
Severity: ${incident?.severity}
Action Taken: ${decision?.action} → ${decision?.targetNodeId ?? 'None'}
SLA Breach: ${alert?.breachConfirmed ? 'YES' : 'NO'}
RCA Summary: ${alert?.rca?.slice(0, 500)}

Write a professional customer service notification. Format exactly as:

SERVICE NOTIFICATION — ${customerName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━
Reference: [incident id]
Time: [current time]
Impact Level: [High/Medium/Low]

SUMMARY:
[2 sentences — what the customer experienced, no internal jargon]

RESOLUTION:
[1 sentence — what was done to restore service]

SLA IMPACT:
[Breach confirmed or service maintained within SLA]

FINANCIAL SUMMARY:
[Penalty applied or no penalty — specific amount]

We apologize for any disruption. Our AI-powered NOC detected and resolved this incident automatically. Please contact your account team with questions.

Keep it under 150 words. Professional, customer-facing tone.`

          const customerStream = await client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            messages: [{ role: 'user', content: customerprompt }]
          })

          for await (const chunk of customerStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              send({ type: 'customer', token: chunk.delta.text })
            }
          }

          send({ type: 'done' })

        } catch (err: any) {
          send({ type: 'error', message: err.message })
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
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}