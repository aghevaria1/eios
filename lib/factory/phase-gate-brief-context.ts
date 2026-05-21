'use client'

import { createContext, useContext } from 'react'

export type OpenBriefFn = (lane: string, phase: string) => void

export const BriefContext = createContext<OpenBriefFn | null>(null)

export function useOpenBrief(): OpenBriefFn | null {
  return useContext(BriefContext)
}
