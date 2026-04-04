import fs from 'fs'
import path from 'path'
import { RAGResult } from './types'

interface Document {
  content: string
  source: string
  tokens: string[]
}

let corpus: Document[] = []
let initialized = false

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

function cosineSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  if (setA.size === 0 || setB.size === 0) return 0
  return intersection.size / Math.sqrt(setA.size * setB.size)
}

function loadDirectory(dirPath: string, label: string) {
  if (!fs.existsSync(dirPath)) return
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    if (!file.endsWith('.txt') && !file.endsWith('.json')) continue
    const fullPath = path.join(dirPath, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    corpus.push({
      content,
      source: `${label}/${file}`,
      tokens: tokenize(content)
    })
  }
}

export function initRAG() {
  if (initialized) return
  const incidentsPath = path.join(process.cwd(), 'data', 'incidents')
  const runbooksPath = path.join(process.cwd(), 'data', 'runbooks')
  const slaPath = path.join(process.cwd(), 'data', 'sla-contracts')
  loadDirectory(incidentsPath, 'incidents')
  loadDirectory(runbooksPath, 'runbooks')
  loadDirectory(slaPath, 'sla-contracts')
  initialized = true
  console.log(`[RAG] Loaded ${corpus.length} documents`)
}

export function retrieve(query: string, topK = 3): RAGResult[] {
  if (!initialized) initRAG()
  const queryTokens = tokenize(query)
  const scored = corpus.map(doc => ({
    content: doc.content,
    source: doc.source,
    similarity: cosineSimilarity(queryTokens, doc.tokens)
  }))
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(r => r.similarity > 0)
}

export function retrieveIncidents(query: string, topK = 2): RAGResult[] {
  if (!initialized) initRAG()
  const queryTokens = tokenize(query)
  const incidents = corpus.filter(d => d.source.startsWith('incidents'))
  const scored = incidents.map(doc => ({
    content: doc.content,
    source: doc.source,
    similarity: cosineSimilarity(queryTokens, doc.tokens)
  }))
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(r => r.similarity > 0)
}

export function retrieveRunbooks(query: string, topK = 2): RAGResult[] {
  if (!initialized) initRAG()
  const queryTokens = tokenize(query)
  const runbooks = corpus.filter(d => d.source.startsWith('runbooks'))
  const scored = runbooks.map(doc => ({
    content: doc.content,
    source: doc.source,
    similarity: cosineSimilarity(queryTokens, doc.tokens)
  }))
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(r => r.similarity > 0)
}