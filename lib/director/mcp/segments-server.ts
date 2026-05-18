// Lightweight MCP-shaped server for customer segments data.
//
// Tool definitions follow MCP protocol shape (name, description, JSON schema input).
// Invocation is in-process for demo simplicity — no stdio/SSE transport, no subprocess.
// In production this would be a real MCP server fronting a Salesforce or ERP system.

import { loadSegment, loadSegments } from '../load-target'
import type { Segment } from '../types'

export interface MCPTool<Args, Result> {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
  invoke(args: Args): Promise<Result>
}

export interface ListSegmentsResult {
  segments: Array<{ id: string; name: string; subtitle: string }>
}

export interface GetSegmentArgs {
  segment_id: string
}

function logInvocation(tool: string, args: unknown, resultSummary: string): void {
  console.log(
    `[MCP] ${tool}(${JSON.stringify(args)}) → ${resultSummary}`,
  )
}

export const listSegmentsTool: MCPTool<Record<string, never>, ListSegmentsResult> = {
  name: 'list_segments',
  description:
    'List all available customer segment IDs, names, and one-line subtitles. Use this first to discover segments before calling get_segment.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  async invoke() {
    const segments = loadSegments()
    const result = {
      segments: segments.map((s) => ({
        id: s.id,
        name: s.name,
        subtitle: s.subtitle,
      })),
    }
    logInvocation('list_segments', {}, `${result.segments.length} segments`)
    return result
  },
}

export const getSegmentTool: MCPTool<GetSegmentArgs, Segment> = {
  name: 'get_segment',
  description:
    'Return the full profile for a given customer segment ID (workload, architecture, channel, TCO, value proposition, sources). The segment_id matches one of the IDs returned by list_segments.',
  inputSchema: {
    type: 'object',
    properties: {
      segment_id: {
        type: 'string',
        description:
          'The segment ID, e.g., federal-hpc, academic-hpc, enterprise-ai, neoclouds, sovereign-ai',
      },
    },
    required: ['segment_id'],
  },
  async invoke({ segment_id }) {
    const seg = loadSegment(segment_id)
    if (!seg) {
      logInvocation('get_segment', { segment_id }, 'NOT FOUND')
      throw new Error(`segment not found: ${segment_id}`)
    }
    logInvocation('get_segment', { segment_id }, `${seg.name}`)
    return seg
  },
}

export const tools = [listSegmentsTool, getSegmentTool] as const
