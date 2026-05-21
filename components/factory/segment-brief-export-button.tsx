'use client'

import { useEffect, useRef, useState } from 'react'

type RequestState =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'error'; message: string }

function dateSlug(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function filenameSlug(s: string): string {
  return s
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function SegmentBriefExportButton({
  segmentId,
}: {
  segmentId: string
}) {
  const [state, setState] = useState<RequestState>({ kind: 'idle' })
  const ctrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      ctrlRef.current?.abort()
    }
  }, [])

  const handleClick = async () => {
    if (state.kind === 'generating') return

    const ctrl = new AbortController()
    ctrlRef.current?.abort()
    ctrlRef.current = ctrl

    setState({ kind: 'generating' })

    try {
      const res = await fetch('/api/factory/segment-brief-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }
      const blob = await res.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cornelis_${filenameSlug(segmentId)}_PartnerBrief_${dateSlug()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setState({ kind: 'idle' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.toLowerCase().includes('abort')) {
        setState({ kind: 'idle' })
        return
      }
      setState({ kind: 'error', message: msg })
    }
  }

  const generating = state.kind === 'generating'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={generating}
        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/60 ${
          generating
            ? 'border-gray-800 bg-gray-900 text-gray-500 cursor-wait'
            : 'border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800 hover:border-gray-600'
        }`}
        aria-label="Export segment partner brief as PDF"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 fill-current"
        >
          <path d="M8 1.5a.5.5 0 0 1 .5.5v7.293l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 9.293V2a.5.5 0 0 1 .5-.5zM3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" />
        </svg>
        {generating ? 'Generating…' : 'Export Partner Brief'}
      </button>
      {state.kind === 'error' && (
        <div className="px-2 py-1 bg-[#A85D5D]/15 border border-[#A85D5D]/40 rounded text-[10px] text-[#E6B5B5] max-w-[300px]">
          <span className="font-bold uppercase tracking-wider mr-1">Failed:</span>
          {state.message}
        </div>
      )}
    </div>
  )
}
