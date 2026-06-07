import { NextRequest } from 'next/server'
import { runPhaseGateBriefAgent } from '@/agents/factory/phasegate-brief-agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { lane?: string; phase?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { lane, phase } = body
  if (!lane || !phase) {
    return new Response('Missing lane or phase', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runPhaseGateBriefAgent({ lane, phase }, (token) => {
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
