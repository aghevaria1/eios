/**
 * Build the Cornelis RAG corpus from local source documents.
 *
 * Reads:
 *   - All PDFs in data/targets/cornelis/rag-corpus/pdfs/ (per PDF_TITLES mapping)
 *   - Simulated markdown docs in data/targets/cornelis/rag-corpus/ (per SIMULATED_DOCS list)
 *
 * Writes:
 *   - data/targets/cornelis/rag-corpus/corpus.json — flat array of chunks
 *
 * Run with: npx tsx scripts/build-rag-corpus.ts
 *
 * Hard-stops with exit 1 if any single document fails to extract — never silently skips.
 */

import fs from 'node:fs'
import path from 'node:path'
import { PDFParse } from 'pdf-parse'

interface CorpusChunk {
  id: string
  source: string
  title: string
  section: string | null
  page: number | null
  text: string
}

const RAG_DIR = path.join(
  process.cwd(),
  'data',
  'targets',
  'cornelis',
  'rag-corpus',
)
const PDFS_DIR = path.join(RAG_DIR, 'pdfs')
const CORPUS_PATH = path.join(RAG_DIR, 'corpus.json')

const PDF_TITLES: Record<string, string> = {
  'cn5000_dcs_pb_a00968_v1.0.pdf':
    'CN5000 Omni-Path Director Class Switch — Product Brief',
  'cn5000_supernic_pb_a00963_v1.1.pdf':
    'CN5000 Omni-Path SuperNIC — Product Brief',
  'cn5000_switch_pb_a00922_v1.0.pdf':
    'CN5000 Omni-Path Switch — Product Brief',
}

const SIMULATED_DOCS: Array<{ filename: string; title: string }> = [
  {
    filename: 'CN6000_NPI_Program_Brief_SIMULATED.md',
    title: 'CN6000 NPI Program Brief (Simulated)',
  },
]

const CHUNK_TARGET_CHARS = 600

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function chunkText(text: string, targetChars: number): string[] {
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const chunks: string[] = []
  let current = ''
  const maxBeforeSplit = targetChars * 1.5

  const flush = () => {
    if (current) {
      chunks.push(current.trim())
      current = ''
    }
  }

  for (const para of paragraphs) {
    if (para.length > maxBeforeSplit) {
      flush()
      const sentences = para.split(/(?<=[.!?])\s+/)
      let buf = ''
      for (const s of sentences) {
        if ((buf + ' ' + s).trim().length <= targetChars || !buf) {
          buf = buf ? `${buf} ${s}` : s
        } else {
          chunks.push(buf.trim())
          buf = s
        }
      }
      if (buf) chunks.push(buf.trim())
      continue
    }
    const candidate = current ? `${current}\n\n${para}` : para
    if (candidate.length <= maxBeforeSplit) {
      current = candidate
    } else {
      flush()
      current = para
    }
  }
  flush()

  return chunks.filter((c) => c.length >= 50)
}

function detectSectionHeading(chunk: string): string | null {
  const firstLine = chunk.split(/[\n.]/)[0].trim()
  if (firstLine.length < 4 || firstLine.length > 80) return null
  if (/[.!?,;:]$/.test(firstLine)) return null
  if (!/^[A-Za-z][A-Za-z0-9 \-—/&()®]+$/.test(firstLine)) return null
  return firstLine
}

async function ingestPdf(
  filename: string,
  title: string,
): Promise<CorpusChunk[]> {
  const buf = fs.readFileSync(path.join(PDFS_DIR, filename))
  const parser = new PDFParse({ data: buf })
  const result = await parser.getText()
  const baseId = slugify(filename.replace(/\.pdf$/i, ''))
  const chunks: CorpusChunk[] = []
  for (const pg of result.pages as Array<{ text: string; num: number }>) {
    const pageChunks = chunkText(pg.text, CHUNK_TARGET_CHARS)
    pageChunks.forEach((text, i) => {
      chunks.push({
        id: `${baseId}-p${pg.num}-${i}`,
        source: filename,
        title,
        section: detectSectionHeading(text),
        page: pg.num,
        text,
      })
    })
  }
  return chunks
}

async function ingestMarkdown(
  filename: string,
  title: string,
): Promise<CorpusChunk[]> {
  const raw = fs.readFileSync(path.join(RAG_DIR, filename), 'utf-8')
  const body = raw.replace(/^---[\s\S]*?\n---\s*\n/, '')
  const sections = body.split(/(?=^##\s)/m).filter((s) => s.trim().length > 0)
  const baseId = slugify(filename.replace(/\.\w+$/, ''))
  const chunks: CorpusChunk[] = []
  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(.+)$/m)
    const sectionTitle = headingMatch ? headingMatch[1].trim() : null
    const sectionBody = section.replace(/^##\s+.+$/m, '').replace(/^#\s+.+$/m, '').trim()
    if (!sectionBody) continue
    const sectionChunks = chunkText(sectionBody, CHUNK_TARGET_CHARS)
    sectionChunks.forEach((text, i) => {
      chunks.push({
        id: `${baseId}-${slugify(sectionTitle ?? 'intro')}-${i}`,
        source: filename,
        title,
        section: sectionTitle,
        page: null,
        text,
      })
    })
  }
  return chunks
}

async function main() {
  const allChunks: CorpusChunk[] = []

  for (const [filename, title] of Object.entries(PDF_TITLES)) {
    process.stdout.write(`Ingesting PDF ${filename}... `)
    try {
      const chunks = await ingestPdf(filename, title)
      allChunks.push(...chunks)
      console.log(`${chunks.length} chunks`)
    } catch (e) {
      console.error(
        `\nFAIL ${filename}: ${e instanceof Error ? e.message : String(e)}`,
      )
      process.exit(1)
    }
  }

  for (const { filename, title } of SIMULATED_DOCS) {
    process.stdout.write(`Ingesting MD ${filename}... `)
    try {
      const chunks = await ingestMarkdown(filename, title)
      allChunks.push(...chunks)
      console.log(`${chunks.length} chunks`)
    } catch (e) {
      console.error(
        `\nFAIL ${filename}: ${e instanceof Error ? e.message : String(e)}`,
      )
      process.exit(1)
    }
  }

  fs.writeFileSync(CORPUS_PATH, JSON.stringify(allChunks, null, 2) + '\n')
  console.log(
    `\nWrote ${allChunks.length} chunks across ${
      Object.keys(PDF_TITLES).length + SIMULATED_DOCS.length
    } documents to ${path.relative(process.cwd(), CORPUS_PATH)}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
