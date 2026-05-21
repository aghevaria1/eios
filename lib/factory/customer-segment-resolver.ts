import type { SegmentId } from './types'

export function resolveSegmentId(customer: string): SegmentId | null {
  const c = customer.toLowerCase()
  if (/neocloud/.test(c)) return 'neoclouds'
  if (/sovereign/.test(c)) return 'sovereign-ai'
  if (/enterprise|automotive|oem/.test(c)) return 'enterprise-ai'
  if (/academic|university|ncsa/.test(c)) return 'academic-hpc'
  if (/doe|llnl|snl|federal|nnsa|lanl/.test(c)) return 'federal-hpc'
  return null
}
