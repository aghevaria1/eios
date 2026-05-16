import { NextRequest } from 'next/server'
import { buildRoadmapPpt } from '@/lib/director/roadmap-ppt-builder'
import { customerFilenameSlug } from '@/lib/director/roadmap-ppt-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dateSlug(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST(req: NextRequest) {
  let body: { customer?: string; commitment?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { customer, commitment } = body
  if (!customer || !commitment) {
    return new Response('Missing customer or commitment', { status: 400 })
  }

  try {
    const buf = await buildRoadmapPpt({ customer, commitment })
    const blob = new Blob([new Uint8Array(buf)], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
    const filename = `Cornelis_CN6000_Roadmap_${customerFilenameSlug(customer)}_${dateSlug()}.pptx`
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return new Response(`PPT generation failed: ${msg}`, { status: 500 })
  }
}
