import { NextRequest } from 'next/server'
import { getIncidents } from '../../../lib/db'

export async function GET(req: NextRequest) {
  try {
    const incidents = getIncidents(20)
    return Response.json(incidents)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}