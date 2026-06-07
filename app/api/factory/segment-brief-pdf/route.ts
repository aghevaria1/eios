import { NextRequest } from 'next/server'
import { buildSegmentBriefPdf } from '@/lib/factory/segment-brief-pdf-builder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dateSlug(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function filenameSlug(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function POST(req: NextRequest) {
  let body: { segmentId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { segmentId } = body
  if (!segmentId) {
    return new Response('Missing segmentId', { status: 400 })
  }

  try {
    const buf = await buildSegmentBriefPdf(segmentId)
    const blob = new Blob([new Uint8Array(buf)], {
      type: 'application/pdf',
    })
    const filename = `Cornelis_${filenameSlug(segmentId)}_PartnerBrief_${dateSlug()}.pdf`
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return new Response(`PDF generation failed: ${msg}`, { status: 500 })
  }
}
