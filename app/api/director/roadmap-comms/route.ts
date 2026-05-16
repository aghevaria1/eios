import { NextRequest } from 'next/server'
import { runRoadmapCommsAgent } from '@/agents/director/roadmap-comms-agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { customer?: string; commitment?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { customer, commitment } = body
  if (!customer || !commitment) {
    return new Response('Missing customer or commitment', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runRoadmapCommsAgent({ customer, commitment }, (token) => {
          controller.enqueue(encoder.encode(token))
        })
        controller.close()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown'
        controller.enqueue(encoder.encode(`\n\n[ERROR: ${msg}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  })
}
