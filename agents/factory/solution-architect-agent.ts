// Solution Architect agent for the v3 NVIDIA AI Factory Advisor.
//
// HONESTY DIVISION (enforced in code, not just prompt):
//   - The KPI ENGINE (lib/factory/kpi) produces every number and every provenance tag.
//   - The AGENT only produces prose (CONFIG_SUMMARY + RATIONALE). It is told the engine
//     output is authoritative; the parser does not look for numbers in the model output.
//   - Numbers + provenance live in the returned `delivered_kpis` / `unverified_flags`
//     fields, which are engine-sourced. Agent prose lives in `config_summary` /
//     `rationale`, which are LLM-sourced.
//
// The agent reads — never computes — KPI values. The test script verifies that the
// agent's prose contains no numeric KPI values (digit + unit patterns).

import Anthropic from '@anthropic-ai/sdk'
import {
  applySwap as _applySwap, // re-export-only; not used here
  buildConfig,
  KPI_DEFINITIONS,
  loadKnowledge,
} from '@/lib/factory/kpi'
import type {
  Architecture,
  ConfigState,
  KpiDefinition,
  KpiValue,
  Segment,
  UnverifiedFlag,
} from '@/lib/factory/kpi'
import { retrieveChunks, chunksToSources, type RagChunk, type RagSource } from '@/lib/factory/rag'
import { parseAgentProse, type SolutionArchitectProse } from '@/lib/factory/solution-architect-parser'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL_PRIMARY = 'claude-sonnet-4-5'
const MODEL_FALLBACK = 'claude-sonnet-4-20250514'
const TARGET_ID = 'nvidia'

export interface KpiResult {
  kpi: KpiDefinition
  value: KpiValue | null
}

export interface ComponentKpiResult {
  component_id: string
  component_name: string
  kpi: KpiDefinition
  value: KpiValue
}

export interface SolutionArchitectInput {
  segment_id: string
  architecture_id: string
}

export interface SolutionArchitectReport {
  // ── ENGINE-SOURCED ──
  config: ConfigState
  segment: Segment
  architecture: Architecture
  delivered_kpis: {
    north_star: KpiResult[]
    supporting: KpiResult[]
    component_kpis: ComponentKpiResult[]
  }
  unverified_flags: UnverifiedFlag[]

  // ── RAG-SOURCED ──
  grounding_chunks: RagChunk[]
  grounding_sources: RagSource[]

  // ── LLM-SOURCED (prose only) ──
  config_summary: string
  rationale: string
  raw: string
}

// ──────────────────────────────────────────────────────────────────
// Engine-side helpers — produce KPI rows with values + provenance.
// The agent does not compute or modify any of these.
// ──────────────────────────────────────────────────────────────────

function lookupKpiValue(
  kpi: KpiDefinition,
  config: ConfigState,
): KpiValue | null {
  const knowledge = loadKnowledge()
  const primarySlot = kpi.dependencies[0]
  const componentId = config[primarySlot as keyof ConfigState] as string
  const component = knowledge.components.get(componentId)
  return component?.kpi_values?.[kpi.id] ?? null
}

function collectSegmentKpis(
  segment: Segment,
  config: ConfigState,
): { north_star: KpiResult[]; supporting: KpiResult[] } {
  const lookup = (id: string): KpiResult | null => {
    const kpi = KPI_DEFINITIONS.find((k) => k.id === id)
    if (!kpi) return null
    return { kpi, value: lookupKpiValue(kpi, config) }
  }
  return {
    north_star: segment.north_star_kpis
      .map(lookup)
      .filter((r): r is KpiResult => r !== null),
    supporting: segment.supporting_kpis
      .map(lookup)
      .filter((r): r is KpiResult => r !== null),
  }
}

function collectComponentKpis(config: ConfigState): ComponentKpiResult[] {
  const knowledge = loadKnowledge()
  const slots: (keyof ConfigState)[] = ['gpu', 'fabric', 'software', 'oem', 'isv']
  const out: ComponentKpiResult[] = []

  for (const slot of slots) {
    const componentId = config[slot] as string
    const component = knowledge.components.get(componentId)
    if (!component?.kpi_values) continue
    for (const [kpiId, value] of Object.entries(component.kpi_values)) {
      const kpi = KPI_DEFINITIONS.find((k) => k.id === kpiId)
      if (!kpi) continue
      out.push({
        component_id: component.id,
        component_name: component.name,
        kpi,
        value,
      })
    }
  }
  return out
}

function collectUnverifiedFlags(
  componentKpis: ComponentKpiResult[],
): UnverifiedFlag[] {
  return componentKpis
    .filter((c) => c.value.provenance.flag === 'verify-needed')
    .map((c) => ({
      component_id: c.component_id,
      kpi_id: c.kpi.id,
      status: c.value.provenance.status,
      notes: c.value.provenance.notes,
    }))
}

// ──────────────────────────────────────────────────────────────────
// Prompt construction — engine output is authoritative; LLM emits prose only.
// ──────────────────────────────────────────────────────────────────

function describeKpiResult(r: KpiResult): string {
  if (!r.value) {
    return `${r.kpi.id} (${r.kpi.name}): no value seeded in the knowledge layer yet — agent should reference KPI by name only, do not invent a value`
  }
  return `${r.kpi.id} (${r.kpi.name}): value provided by engine, provenance tag [${r.value.provenance.status}]${r.value.provenance.flag ? ' ⚑ verify-needed' : ''}`
}

function describeComponentKpi(c: ComponentKpiResult): string {
  return `${c.component_id}::${c.kpi.id}: provenance tag [${c.value.provenance.status}]${c.value.provenance.flag ? ' ⚑ verify-needed' : ''}`
}

function buildPrompt(
  segment: Segment,
  architecture: Architecture,
  config: ConfigState,
  north_star: KpiResult[],
  supporting: KpiResult[],
  componentKpis: ComponentKpiResult[],
  unverified: UnverifiedFlag[],
  chunks: RagChunk[],
): string {
  const chunkContext =
    chunks.length === 0
      ? '(no grounding chunks retrieved — proceed with engine output only)'
      : chunks
          .map(
            (c, i) =>
              `[${i + 1}] ${c.title} — ${c.section ?? 'general'} (source: ${c.source})\n${c.text}`,
          )
          .join('\n\n')

  const unverifiedNote =
    unverified.length === 0
      ? '(no verify-needed flags on the values in this config)'
      : unverified
          .map(
            (u) =>
              `- ${u.kpi_id} @ ${u.component_id} [${u.status}]: ${u.notes ?? '(no note)'}`,
          )
          .join('\n')

  return `You are the Solution Architect for the NVIDIA AI Factory Advisor. A Director PM has asked: "For the ${segment.name} customer segment, what does the ${architecture.name} reference architecture deliver, and why does it fit?"

═══ HONESTY CONTRACT — READ FIRST ═══
The composed config and every KPI value have ALREADY been resolved by a deterministic engine (lib/factory/kpi). The engine output is AUTHORITATIVE. You will reference KPIs BY NAME ONLY in your output. You will NOT include any numeric KPI value, unit, percentage, multiplier, or measurement in your prose. The engine emits the numbers separately with provenance tags; your job is the qualitative framing.

DO NOT write things like "X GB", "Y TB/s", "Z PFLOPS", "N%", "Mx speedup", "N to N range". Reference the KPI by its name (e.g., "memory bandwidth", "FP4 compute throughput", "fabric collective-op performance") and explain its relevance to the segment's north-star. The engine reports the value; you report the meaning.

═══ ENGINE OUTPUT (authoritative — do not modify or restate values) ═══

Composed config:
  segment:      ${segment.id} (${segment.name})
  architecture: ${architecture.id} (${architecture.name})
  gpu:          ${config.gpu}
  fabric:       ${config.fabric}
  software:     ${config.software}
  oem:          ${config.oem}
  isv:          ${config.isv}

Segment north-star KPI(s) — engine has resolved value + provenance:
${north_star.map((r) => '  - ' + describeKpiResult(r)).join('\n')}

Segment supporting KPI(s) — engine has resolved value + provenance:
${supporting.map((r) => '  - ' + describeKpiResult(r)).join('\n')}

Underlying component KPI values the engine reports for this config:
${componentKpis.map((c) => '  - ' + describeComponentKpi(c)).join('\n')}

Unverified flags (values tagged directional with verify-needed — do not overclaim against these):
${unverifiedNote}

═══ GROUNDING CONTEXT (RAG-retrieved chunks for prose framing) ═══
${chunkContext}

═══ OUTPUT FORMAT ═══
Emit exactly two labeled sections. NO numeric KPI values anywhere in the prose. Reference KPIs by name.

CONFIG_SUMMARY:
[Three to four sentences. Name the chosen components by slot (GPU, fabric, software, OEM, ISV). Say WHY this combination fits the ${segment.name} segment's north-star, in qualitative terms. Reference KPIs by name where relevant; never quote their values.]

RATIONALE:
[Three to four sentences. Connect the chosen components to the segment's north-star KPI and one or two supporting KPIs. Explain the architectural logic of the choice in plain English. If any unverified-flag values are in play, acknowledge the caveat in qualitative terms (e.g., "FP8 attribution remains pending verification") without quoting numbers. End with one sentence about a competitive consideration or roadmap risk the Director should be aware of.]`
}

// ──────────────────────────────────────────────────────────────────
// Stream from model with fallback.
// ──────────────────────────────────────────────────────────────────

async function streamFromModel(
  model: string,
  prompt: string,
  onStream?: (token: string) => void,
): Promise<string> {
  let full = ''
  const stream = await client.messages.stream({
    model,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })
  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      full += chunk.delta.text
      onStream?.(chunk.delta.text)
    }
  }
  return full
}

// ──────────────────────────────────────────────────────────────────
// Public entry point.
// ──────────────────────────────────────────────────────────────────

export async function runSolutionArchitectAgent(
  input: SolutionArchitectInput,
  onStream?: (token: string) => void,
): Promise<SolutionArchitectReport> {
  // 1. Engine: resolve config + KPIs deterministically
  const knowledge = loadKnowledge()
  const segment = knowledge.segments.find((s) => s.id === input.segment_id)
  if (!segment) throw new Error(`Unknown segment: ${input.segment_id}`)
  const architecture = knowledge.architectures.find(
    (a) => a.id === input.architecture_id,
  )
  if (!architecture)
    throw new Error(`Unknown architecture: ${input.architecture_id}`)

  const config = buildConfig(input.segment_id, input.architecture_id)
  const { north_star, supporting } = collectSegmentKpis(segment, config)
  const componentKpis = collectComponentKpis(config)
  const unverified_flags = collectUnverifiedFlags(componentKpis)

  // 2. RAG: retrieve grounding chunks from the nvidia corpus explicitly
  const ragQuery = [
    segment.id,
    segment.name,
    architecture.id,
    config.gpu,
    config.fabric,
    config.software,
    'north-star',
    'buying-criteria',
  ].join(' ')
  const grounding_chunks = retrieveChunks(ragQuery, 5, TARGET_ID)
  const grounding_sources = chunksToSources(grounding_chunks)

  // 3. Prompt: engine output is authoritative; LLM emits prose only
  const prompt = buildPrompt(
    segment,
    architecture,
    config,
    north_star,
    supporting,
    componentKpis,
    unverified_flags,
    grounding_chunks,
  )

  // 4. Stream with fallback
  let raw: string
  try {
    raw = await streamFromModel(MODEL_PRIMARY, prompt, onStream)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (
      msg.toLowerCase().includes('model') ||
      msg.includes('400') ||
      msg.includes('404')
    ) {
      raw = await streamFromModel(MODEL_FALLBACK, prompt, onStream)
    } else {
      throw e
    }
  }

  // 5. Parse prose (no numbers expected in the model output)
  const prose: SolutionArchitectProse = parseAgentProse(raw)

  return {
    config,
    segment,
    architecture,
    delivered_kpis: { north_star, supporting, component_kpis: componentKpis },
    unverified_flags,
    grounding_chunks,
    grounding_sources,
    config_summary: prose.config_summary,
    rationale: prose.rationale,
    raw,
  }
}
