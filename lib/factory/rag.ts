import fs from 'node:fs'
import path from 'node:path'
import { loadActiveTargetId } from './load-target'

export interface RagChunk {
  id: string
  source: string
  title: string
  section: string | null
  page: number | null
  text: string
}

export interface RagSource {
  source: string
  title: string
}

interface IndexedChunk extends RagChunk {
  tokens: Set<string>
  tokenCount: number
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was',
  'were', 'will', 'with', 'within', 'into', 'over', 'per', 'via', 'plus', 'across',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
}

const indexCache = new Map<string, IndexedChunk[]>()

function resolveCorpusPath(targetId: string): string {
  // v3 nvidia target keeps corpus.json at the target root.
  // v2 cornelis target keeps corpus.json under rag-corpus/. Resolve either.
  const rootCandidate = path.join(
    process.cwd(),
    'data',
    'targets',
    targetId,
    'corpus.json',
  )
  if (fs.existsSync(rootCandidate)) return rootCandidate
  return path.join(
    process.cwd(),
    'data',
    'targets',
    targetId,
    'rag-corpus',
    'corpus.json',
  )
}

function loadIndex(targetId?: string): IndexedChunk[] {
  const resolvedTarget = targetId ?? loadActiveTargetId()
  const cached = indexCache.get(resolvedTarget)
  if (cached) return cached

  const corpusPath = resolveCorpusPath(resolvedTarget)
  let raw: string
  try {
    raw = fs.readFileSync(corpusPath, 'utf-8')
  } catch {
    indexCache.set(resolvedTarget, [])
    return []
  }

  const chunks = JSON.parse(raw) as RagChunk[]
  const indexed = chunks.map((c) => {
    const tokens = new Set(tokenize(c.text))
    return { ...c, tokens, tokenCount: tokens.size }
  })
  indexCache.set(resolvedTarget, indexed)
  return indexed
}

export function retrieveChunks(query: string, topK = 3, targetId?: string): RagChunk[] {
  const index = loadIndex(targetId)
  if (index.length === 0) return []

  const queryTokens = new Set(tokenize(query))
  if (queryTokens.size === 0) return []

  const scored = index.map((chunk, originalIdx) => {
    let overlap = 0
    queryTokens.forEach((t) => {
      if (chunk.tokens.has(t)) overlap += 1
    })
    const score = chunk.tokenCount > 0 ? overlap / Math.sqrt(chunk.tokenCount) : 0
    return { chunk, score, originalIdx }
  })

  // Source-diversity selection: keep the highest-scoring chunk per source,
  // then take the top-K sources by best-chunk score. Stable tiebreak by insertion order.
  const bestPerSource = new Map<string, (typeof scored)[number]>()
  for (const s of scored) {
    if (s.score <= 0) continue
    const existing = bestPerSource.get(s.chunk.source)
    if (
      !existing ||
      s.score > existing.score ||
      (s.score === existing.score && s.originalIdx < existing.originalIdx)
    ) {
      bestPerSource.set(s.chunk.source, s)
    }
  }

  const perSource = Array.from(bestPerSource.values())
  perSource.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.originalIdx - b.originalIdx
  })

  return perSource.slice(0, topK).map((s) => {
    const { tokens: _t, tokenCount: _tc, ...rest } = s.chunk as IndexedChunk
    return rest
  })
}

export function chunksToSources(chunks: RagChunk[]): RagSource[] {
  const seen = new Set<string>()
  const out: RagSource[] = []
  for (const c of chunks) {
    if (seen.has(c.source)) continue
    seen.add(c.source)
    out.push({ source: c.source, title: c.title })
  }
  return out
}
