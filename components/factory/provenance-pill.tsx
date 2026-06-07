import type { Provenance } from '@/lib/factory/kpi'

export function ProvenancePill({ provenance }: { provenance: Provenance }) {
  const { label, classes } = pillFromProvenance(provenance)
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-mono font-semibold tracking-widest ${classes}`}
    >
      {label}
    </span>
  )
}

function pillFromProvenance(
  p: Provenance,
): { label: string; classes: string } {
  if (p.flag === 'verify-needed') {
    return {
      label: 'VERIFY-NEEDED',
      classes: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
    }
  }
  switch (p.status) {
    case 'cited':
      return {
        label: 'CITED',
        classes: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
      }
    case 'claimed':
      return {
        label: 'CLAIMED',
        classes: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
      }
    default:
      return {
        label: 'DIRECTIONAL',
        classes: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
      }
  }
}
