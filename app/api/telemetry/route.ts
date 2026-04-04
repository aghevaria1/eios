import { NextRequest } from 'next/server'
import { startSimulator, getAllMetrics } from '../../../lib/simulator'
import { initRAG } from '../../../lib/rag'
import { getDB } from '../../../lib/db'

let started = false

export async function GET(req: NextRequest) {
  if (!started) {
    getDB()
    initRAG()
    startSimulator()
    started = true
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const metrics = getAllMetrics()
        const data = `data: ${JSON.stringify(metrics)}\n\n`
        controller.enqueue(encoder.encode(data))
      }, 5000)

      const initial = getAllMetrics()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`))

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
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