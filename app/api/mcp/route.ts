// Hand-rolled MCP server (JSON-RPC 2.0 over HTTP) exposing the NVIDIA knowledge
// layer: products (the L1-L5 stack), customer segments, customer archetypes, and
// competition. Read-only. POST-only Streamable-HTTP subset — no server-initiated
// SSE, no session state — which is all a read-only tool surface needs.
//
// Transport: a single POST handler parses a JSON-RPC request (or batch) and
// dispatches `initialize`, `tools/list`, `tools/call`. Notifications (no `id`)
// get a 202. tools/call returns MCP content blocks: content[0].text is a JSON
// string of the result, and `structuredContent` carries the same object parsed.
//
// Auth: Authorization: Bearer <MCP_TOKEN>. If MCP_TOKEN is unset the endpoint
// refuses every request (locked by default) rather than serving unauthenticated.
//
// Data: reuses loadKnowledge() (segments + merged component map) and reads
// competitors.json once to recover the product/competitor split + categories.

import fs from 'node:fs'
import path from 'node:path'
import { loadKnowledge } from '@/lib/factory/kpi/knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// MCP protocol revision we default to when the client doesn't pin one.
const DEFAULT_PROTOCOL_VERSION = '2025-06-18'
const SERVER_INFO = { name: 'eios-nvidia-mcp', version: '0.1.0' }

const KNOWLEDGE_DIR = path.join(
  process.cwd(),
  'data',
  'targets',
  'nvidia',
  'knowledge',
)

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

interface CompetitorsFile {
  categories: Record<string, unknown>
  components: Array<Record<string, unknown>>
}

interface CompetitionView {
  categories: Record<string, unknown>
  competitorIds: Set<string>
}

let competitionCache: CompetitionView | null = null

function loadCompetition(): CompetitionView {
  if (competitionCache) return competitionCache
  const file = JSON.parse(
    fs.readFileSync(path.join(KNOWLEDGE_DIR, 'competitors.json'), 'utf-8'),
  ) as CompetitorsFile
  competitionCache = {
    categories: file.categories ?? {},
    competitorIds: new Set(file.components.map((c) => String(c.id))),
  }
  return competitionCache
}

// Partition the merged component map (stack + competitors) back into the
// NVIDIA stack ("products") and everyone else ("competitors").
function partitionedComponents() {
  const kb = loadKnowledge()
  const { competitorIds } = loadCompetition()
  const all = Array.from(kb.components.values()) as unknown as Array<
    Record<string, unknown>
  >
  return {
    products: all.filter((c) => !competitorIds.has(String(c.id))),
    competitors: all.filter((c) => competitorIds.has(String(c.id))),
  }
}

// ---------------------------------------------------------------------------
// Tool definitions (advertised by tools/list)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'list_segments',
    description:
      'List NVIDIA customer segments (id, name, subtitle, archetype, buying behavior, north-star KPIs, partner intensity, battleground flag). Call this first to discover segment ids before get_segment.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_segment',
    description:
      'Return the full profile for one customer segment id: workload/buying behavior, KPIs with provenance, architecture blend, ISV blend, L1 facility profile, partner intensity.',
    inputSchema: {
      type: 'object',
      properties: {
        segment_id: {
          type: 'string',
          description:
            'Segment id from list_segments, e.g. frontier-ai-labs, hyperscalers, fortune-500, sovereign-ai, industry-verticals, neocloud.',
        },
      },
      required: ['segment_id'],
    },
  },
  {
    name: 'list_products',
    description:
      'List the NVIDIA AI-factory stack components (the L1-L5 "cake"): GPUs, fabric, NICs, OEM servers, ISV platforms, NVAIE software. Returns id, name, layer, slot, vendor, generation. Call before get_product.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_product',
    description:
      'Return the full record for one NVIDIA stack component id, including KPI values with provenance (cited / claimed / directional) where present.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description:
            'Component id from list_products, e.g. blackwell_b200, gb200, vera_rubin_vr200, nvidia_spectrum_x, nvidia_quantum_x800, nvaie.',
        },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'list_competitors',
    description:
      'List the competitive landscape: the category taxonomy (full-cake replacement, fabric alternatives, software alternatives, customer self-supply, paradigm alternative) plus each competitor (id, name, category, slot, vendor, generation). Call before get_competitor.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_competitor',
    description:
      'Return the full record for one competitor id, including moat framing and KPI values with provenance.',
    inputSchema: {
      type: 'object',
      properties: {
        competitor_id: {
          type: 'string',
          description:
            'Competitor id from list_competitors, e.g. amd_mi355x, amd_helios_mi455x, cornelis_cn6000, broadcom_jericho_tomahawk, arista_ethernet, google_tpu, cerebras_wse3.',
        },
      },
      required: ['competitor_id'],
    },
  },
  {
    name: 'list_customers',
    description:
      'List customer archetypes derived from the segments (named example accounts live in prose on each segment). Returns segment_id, archetype, named_examples, buying_behavior, representative_deployment, partner_intensity. For full detail call get_segment with the segment_id.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
] as const

// ---------------------------------------------------------------------------
// Tool handlers — each returns a plain object that becomes the tool result.
// Throw McpToolError for caller-facing failures (rendered as isError content).
// ---------------------------------------------------------------------------

class McpToolError extends Error {}

const handlers: Record<string, (args: Record<string, unknown>) => unknown> = {
  list_segments() {
    const kb = loadKnowledge()
    const segments = kb.segments as unknown as Array<Record<string, unknown>>
    return {
      segments: segments.map((s) => ({
        id: s.id,
        name: s.name,
        subtitle: s.subtitle,
        archetype: s.archetype,
        buying_behavior: s.buying_behavior,
        north_star_kpis: s.north_star_kpis,
        partner_intensity: s.partner_intensity,
        is_battleground: Boolean(s.is_battleground),
      })),
    }
  },

  get_segment(args) {
    const id = String(args.segment_id ?? '')
    const segments = loadKnowledge().segments as unknown as Array<
      Record<string, unknown>
    >
    const seg = segments.find((s) => s.id === id)
    if (!seg) throw new McpToolError(`segment not found: ${id || '(empty)'}`)
    return seg
  },

  list_products() {
    const { products } = partitionedComponents()
    return {
      products: products.map((c) => ({
        id: c.id,
        name: c.name,
        layer: c.layer,
        slot: c.slot,
        vendor: c.vendor,
        generation: c.generation,
      })),
    }
  },

  get_product(args) {
    const id = String(args.product_id ?? '')
    const { products } = partitionedComponents()
    const c = products.find((p) => String(p.id) === id)
    if (!c) throw new McpToolError(`product not found: ${id || '(empty)'}`)
    return c
  },

  list_competitors() {
    const { competitors } = partitionedComponents()
    const { categories } = loadCompetition()
    return {
      categories,
      competitors: competitors.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        slot: c.slot,
        vendor: c.vendor,
        generation: c.generation,
      })),
    }
  },

  get_competitor(args) {
    const id = String(args.competitor_id ?? '')
    const { competitors } = partitionedComponents()
    const c = competitors.find((p) => String(p.id) === id)
    if (!c) throw new McpToolError(`competitor not found: ${id || '(empty)'}`)
    return c
  },

  list_customers() {
    const segments = loadKnowledge().segments as unknown as Array<
      Record<string, unknown>
    >
    return {
      customers: segments.map((s) => ({
        segment_id: s.id,
        archetype: s.archetype,
        named_examples: s.subtitle,
        buying_behavior: s.buying_behavior,
        representative_deployment: s.representative_deployment,
        partner_intensity: s.partner_intensity,
      })),
    }
  },
}

// ---------------------------------------------------------------------------
// JSON-RPC plumbing
// ---------------------------------------------------------------------------

type JsonRpcId = string | number | null

interface JsonRpcRequest {
  jsonrpc?: string
  id?: JsonRpcId
  method?: string
  params?: Record<string, unknown>
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function handleRpc(req: JsonRpcRequest): object | null {
  const id: JsonRpcId = req.id ?? null
  const method = req.method
  const params = req.params ?? {}

  // Notification (no id): acknowledge with no body.
  if (req.id === undefined || req.id === null) {
    if (typeof method === 'string' && method.startsWith('notifications/')) {
      return null
    }
  }

  switch (method) {
    case 'initialize': {
      const requested = (params.protocolVersion as string) || undefined
      return rpcResult(id, {
        protocolVersion: requested ?? DEFAULT_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      })
    }

    case 'ping':
      return rpcResult(id, {})

    case 'tools/list':
      return rpcResult(id, { tools: TOOLS })

    case 'tools/call': {
      const name = String(params.name ?? '')
      const args = (params.arguments as Record<string, unknown>) ?? {}
      const handler = handlers[name]
      if (!handler) {
        return rpcError(id, -32602, `unknown tool: ${name || '(empty)'}`)
      }
      try {
        const data = handler(args)
        return rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(data) }],
          structuredContent: data,
          isError: false,
        })
      } catch (err) {
        // Tool-execution failures are returned as a normal result with
        // isError:true (MCP convention), not as a JSON-RPC protocol error.
        const message =
          err instanceof McpToolError
            ? err.message
            : `internal tool error: ${String(err)}`
        return rpcResult(id, {
          content: [{ type: 'text', text: message }],
          isError: true,
        })
      }
    }

    default:
      return rpcError(id, -32601, `method not found: ${method ?? '(none)'}`)
  }
}

// ---------------------------------------------------------------------------
// Auth + HTTP handlers
// ---------------------------------------------------------------------------

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function authError(request: Request): Response | null {
  const expected = process.env.MCP_TOKEN
  if (!expected) {
    return new Response(
      JSON.stringify({ error: 'MCP endpoint is not configured (MCP_TOKEN unset)' }),
      { status: 500, headers: JSON_HEADERS },
    )
  }
  const header = request.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match || match[1] !== expected) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      {
        status: 401,
        headers: { ...JSON_HEADERS, 'WWW-Authenticate': 'Bearer' },
      },
    )
  }
  return null
}

export async function POST(request: Request): Promise<Response> {
  const denied = authError(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, -32700, 'parse error')),
      { status: 400, headers: JSON_HEADERS },
    )
  }

  // Support a single request or a JSON-RPC batch (array).
  if (Array.isArray(body)) {
    const responses = body
      .map((r) => handleRpc(r as JsonRpcRequest))
      .filter((r): r is object => r !== null)
    // All-notification batch → 202 with no body.
    if (responses.length === 0) {
      return new Response(null, { status: 202 })
    }
    return new Response(JSON.stringify(responses), {
      status: 200,
      headers: JSON_HEADERS,
    })
  }

  const response = handleRpc(body as JsonRpcRequest)
  if (response === null) {
    return new Response(null, { status: 202 })
  }
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: JSON_HEADERS,
  })
}

// Unauthenticated liveness probe — no token, no data — so the route can be
// confirmed live in a browser. JSON-RPC traffic still goes over POST + Bearer.
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ status: 'ok', server: SERVER_INFO.name }),
    { status: 200, headers: JSON_HEADERS },
  )
}
