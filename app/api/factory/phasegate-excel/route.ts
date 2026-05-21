import { NextRequest } from 'next/server'
import { buildPhaseGateExcel } from '@/lib/factory/phasegate-excel-builder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dateSlug(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST(_req: NextRequest) {
  try {
    const buf = await buildPhaseGateExcel()
    const blob = new Blob([new Uint8Array(buf)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const filename = `Cornelis_CN6000_PhaseGate_StatusGrid_${dateSlug()}.xlsx`
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return new Response(`Excel generation failed: ${msg}`, { status: 500 })
  }
}
