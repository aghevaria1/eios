import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { mcpTools } from '../../../lib/mcp-tools'
import { retrieve } from '../../../lib/rag'
import { initRAG } from '../../../lib/rag'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query) return new Response('Missing query', { status: 400 })

  initRAG()

  const simulation = mcpTools.run_whatif_simulation(query)
  const context = retrieve(query, 4)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const prompt = `You are the EIOS What-If Analysis Engine for edge inference infrastructure.

A user has asked a what-if scenario question. Analyze the simulated impact and give a detailed response.

SCENARIO: ${query}

SIMULATED NODE STATE CHANGES:
${JSON.stringify(simulation.simulatedState, null, 2)}

AFFECTED NODES:
${JSON.stringify(simulation.affectedNodes, null, 2)}

RELEVANT HISTORICAL CONTEXT:
${context.map(r => `[${r.source}]\n${r.content}`).join('\n\n')}

Answer the what-if question directly. Cover:
1. Which nodes are affected and how
2. What cascading effects would occur
3. Which SLA contracts are at risk
4. What the recommended preemptive action would be
5. Estimated financial impact if unaddressed

Be specific, technical, and actionable. Write as if briefing an infrastructure VP.`

      try {
        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`))
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
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