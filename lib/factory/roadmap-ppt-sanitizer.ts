import type { CommitmentRegisterEntry, CommitmentStatus } from './types'

export interface SanitizedBadge {
  label: string
  hex: string
}

export const BADGE_BY_STATUS: Record<CommitmentStatus, SanitizedBadge> = {
  on_track: { label: 'On Plan', hex: '5B8C5A' },
  at_risk: { label: 'In Active Development', hex: '3F6B91' },
  slip: { label: 'Under Active Program Management', hex: '3F6B91' },
}

export function sanitizeStatusBadge(status: CommitmentStatus): SanitizedBadge {
  return BADGE_BY_STATUS[status]
}

export function sanitizeStatusFraming(entry: CommitmentRegisterEntry): string {
  if (entry.status === 'on_track') {
    return `Aligned with committed ${entry.date} delivery window.`
  }
  if (entry.status === 'at_risk') {
    return `In active program management against the committed ${entry.date} delivery window; certification milestones tracked weekly.`
  }
  return `Engineering team executing recovery plan against revised delivery target; program management confirmed updated commitment.`
}

export function customerFilenameSlug(customer: string): string {
  return customer
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export const CN5000_LIFECYCLE_BULLETS: readonly string[] = [
  'Production shipments continue through 2027',
  'Sustaining support extends through 2029',
  '12+ months advance notice will be provided before any CN5000 End-of-New-Orders announcement',
  'Cornelis lifecycle decisions are anchored on customer migration readiness, not calendar triggers',
]
