// Pure loaders for the NVIDIA target structured knowledge layer.
//
// Reads JSON files from data/targets/nvidia/knowledge/.
// No network, no Anthropic SDK, no side effects beyond fs.readFileSync.
//
// Components from stack.json (NVIDIA) and competitors.json (AMD, hyperscaler custom,
// Cornelis, Broadcom, Arista) are flattened into one component map keyed by id.

import fs from 'node:fs'
import path from 'node:path'
import type { Architecture, Component, Segment } from './types'

const KNOWLEDGE_DIR = path.join(
  process.cwd(),
  'data',
  'targets',
  'nvidia',
  'knowledge',
)

export interface KnowledgeBase {
  manifest: {
    corpus_version: string
    last_verified: string
  }
  segments: Segment[]
  architectures: Architecture[]
  components: Map<string, Component>
}

let cache: KnowledgeBase | null = null

function readJson<T>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), 'utf-8'),
  ) as T
}

export function loadKnowledge(): KnowledgeBase {
  if (cache) return cache

  const manifest = readJson<KnowledgeBase['manifest']>('manifest.json')
  const segmentsFile = readJson<{ segments: Segment[] }>('segments.json')
  const architecturesFile = readJson<{ architectures: Architecture[] }>(
    'architectures.json',
  )
  const stackFile = readJson<{ components: Component[] }>('stack.json')
  const competitorsFile = readJson<{ components: Component[] }>(
    'competitors.json',
  )

  const components = new Map<string, Component>()
  for (const c of stackFile.components) components.set(c.id, c)
  for (const c of competitorsFile.components) components.set(c.id, c)

  cache = {
    manifest,
    segments: segmentsFile.segments,
    architectures: architecturesFile.architectures,
    components,
  }
  return cache
}

export function clearKnowledgeCache(): void {
  cache = null
}
