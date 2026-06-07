import { DAY_1_FRAMING } from '@/lib/factory/framing'

export function Day1Banner() {
  return (
    <div className="bg-amber-900/40 border-b border-amber-700/50 px-4 py-2 text-xs text-amber-200 text-center">
      {DAY_1_FRAMING.shortBanner}
    </div>
  )
}
