'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  CommitmentRegisterEntry,
  CommitmentStatus,
} from '@/lib/director/types'

const EXTERNAL_BADGE_LABEL: Record<CommitmentStatus, string> = {
  on_track: 'On Plan',
  at_risk: 'In Active Development',
  slip: 'Under Active Program Management',
}

const EXTERNAL_BADGE_CLASS: Record<CommitmentStatus, string> = {
  on_track: 'bg-[#5B8C5A]/20 text-[#9AC49A] border-[#5B8C5A]/40',
  at_risk: 'bg-[#3F6B91]/20 text-[#9AB7D4] border-[#3F6B91]/40',
  slip: 'bg-[#3F6B91]/20 text-[#9AB7D4] border-[#3F6B91]/40',
}

type RequestState = { kind: 'idle' } | { kind: 'generating'; key: string } | { kind: 'error'; message: string }

function entryKey(e: CommitmentRegisterEntry): string {
  return `${e.customer}::${e.commitment}`
}

function customerFilenameSlug(customer: string): string {
  return customer
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function dateSlug(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function RoadmapExportButton({
  entries,
}: {
  entries: CommitmentRegisterEntry[]
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<RequestState>({ kind: 'idle' })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (ev: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(ev.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    return () => {
      ctrlRef.current?.abort()
    }
  }, [])

  const handleSelect = async (entry: CommitmentRegisterEntry) => {
    if (state.kind === 'generating') return

    const key = entryKey(entry)
    const ctrl = new AbortController()
    ctrlRef.current?.abort()
    ctrlRef.current = ctrl
    let cancelled = false

    setState({ kind: 'generating', key })

    try {
      const res = await fetch('/api/director/roadmap-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: entry.customer,
          commitment: entry.commitment,
        }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      if (cancelled) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cornelis_CN6000_Roadmap_${customerFilenameSlug(entry.customer)}_${dateSlug()}.pptx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setState({ kind: 'idle' })
      setOpen(false)
    } catch (e) {
      if (cancelled) return
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.toLowerCase().includes('abort')) {
        setState({ kind: 'idle' })
        return
      }
      setState({ kind: 'error', message: msg })
    }

    return () => {
      cancelled = true
    }
  }

  const generatingKey = state.kind === 'generating' ? state.key : null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded border border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 fill-current"
        >
          <path d="M8 1.5a.5.5 0 0 1 .5.5v7.293l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 9.293V2a.5.5 0 0 1 .5-.5zM3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" />
        </svg>
        Export for Customer Review
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 z-20 w-[420px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-gray-800">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Customer
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Generates a 4-slide PPT (cover · timeline · status · lifecycle) tailored to the selected customer.
            </p>
          </div>

          <ul className="max-h-[420px] overflow-y-auto">
            {entries.map((e) => {
              const key = entryKey(e)
              const isGenerating = generatingKey === key
              const disabled = state.kind === 'generating'
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handleSelect(e)}
                    disabled={disabled}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-800 last:border-b-0 transition-colors ${
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-800/60 focus:bg-gray-800/60 focus:outline-none'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-blue-400">
                          {e.customer}
                        </div>
                        <div className="text-[11px] text-gray-300 mt-0.5 truncate">
                          {e.commitment}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {e.date}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${EXTERNAL_BADGE_CLASS[e.status]}`}
                        >
                          {EXTERNAL_BADGE_LABEL[e.status]}
                        </span>
                        {isGenerating && (
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                            Generating…
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          {state.kind === 'error' && (
            <div className="px-3 py-2 bg-[#A85D5D]/15 border-t border-[#A85D5D]/40 text-[11px] text-[#E6B5B5]">
              <span className="font-bold uppercase tracking-wider mr-1">Export failed:</span>
              {state.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
