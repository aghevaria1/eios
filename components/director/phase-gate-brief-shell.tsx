'use client'

import { useCallback, useState, type ReactNode } from 'react'
import type { ExecDecision } from '@/lib/director/types'
import { BriefContext } from '@/lib/director/phase-gate-brief-context'
import { PhaseGateBriefPanel } from './phase-gate-brief-panel'

export function PhaseGateBriefShell({
  fallbackDecision,
  children,
}: {
  fallbackDecision: ExecDecision | null
  children: ReactNode
}) {
  const [active, setActive] = useState<{ lane: string; phase: string } | null>(null)
  const open = useCallback((lane: string, phase: string) => setActive({ lane, phase }), [])

  return (
    <BriefContext.Provider value={open}>
      {children}
      {active && (
        <PhaseGateBriefPanel
          lane={active.lane}
          phase={active.phase}
          fallback={fallbackDecision}
          onClose={() => setActive(null)}
        />
      )}
    </BriefContext.Provider>
  )
}
