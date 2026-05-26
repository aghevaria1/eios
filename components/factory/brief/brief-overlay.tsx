'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Brief Overlay — shared container for the 3 audience-targeted briefs
// (Customer / Sales / Partner).
//
// MECHANICS:
//   · React-Portals to document.body, so the overlay is a DIRECT child of
//     <body> with class .brief-overlay-container — flattens the DOM for
//     print CSS (no deep ancestor chain to wrangle)
//   · Fixed-position overlay covers viewport on screen (z-50)
//   · Top toolbar: Print + Close buttons + title — print-hidden
//   · Brief body in a .brief-print-area container
//   · window.print() triggers browser native print-to-PDF
//   · Esc key closes; body scroll locked while open
//
// PRINT DISCIPLINE (global rules in app/globals.css):
//   · body > *:not(.brief-overlay-container) → display: none
//   · .brief-overlay-container → position: static so body height = brief
//     height (one page, no multi-page repeat)
//   · .print-hidden class explicitly removes elements (toolbar/buttons)
//   · @page margin compresses browser-default header/footer area
//   · Provenance pill colors preserved via print-color-adjust

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
}

export function BriefOverlay({ title, subtitle, children, onClose }: Props) {
  const [mounted, setMounted] = useState(false)

  // Portal target is document.body — mount only after hydration to avoid
  // SSR mismatch on portals (document doesn't exist server-side).
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while overlay open; Esc-to-close
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!mounted) return null

  const overlay = (
    <div className="brief-overlay-container fixed inset-0 z-50 overflow-y-auto bg-gray-950">
      {/* Toolbar — print-hidden */}
      <div className="print-hidden sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-gray-500">
              BRIEF · printable snapshot
            </div>
            <div className="mt-0.5 text-sm font-semibold text-gray-100">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded border border-[#76B900]/40 bg-[#76B900]/10 px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-widest text-[#9FD848] transition-colors hover:bg-[#76B900]/20"
            >
              Print → PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-widest text-gray-300 transition-colors hover:bg-gray-800"
            >
              Close (Esc)
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-2 text-[10px] italic leading-relaxed text-gray-500">
          tip · in browser print dialog, uncheck &quot;Headers and footers&quot;
          to remove the page-URL / page-number chrome
        </div>
      </div>

      {/* Brief body — the only thing that prints */}
      <div className="brief-print-area mx-auto max-w-4xl px-6 py-8">
        {children}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

// ─── Shared brief building blocks ──────────────────────────────────
// Use these in each brief body for consistent typography + section
// boundaries + page-break behavior.

export function BriefHeader({
  title,
  subtitle,
  sourceLabel,
}: {
  title: string
  subtitle?: string
  sourceLabel: string
}) {
  const ts = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  return (
    <header className="brief-section mb-6 border-b border-gray-700 pb-4 print:border-b print:border-gray-400">
      <div className="text-[10px] font-mono tracking-widest text-gray-500">
        {sourceLabel}  ·  snapshot {ts}
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-gray-100 print:text-black">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-400 print:text-gray-700">
          {subtitle}
        </p>
      )}
    </header>
  )
}

export function BriefSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="brief-section mb-5">
      <div className="mb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#9FD848] print:text-[#5a8c00]">
        {label}
      </div>
      <div className="rounded border border-gray-800 bg-gray-900/30 p-4 text-xs leading-relaxed text-gray-200 print:border print:border-gray-300 print:bg-white print:text-black">
        {children}
      </div>
    </section>
  )
}

export function BriefFooter({ note }: { note: string }) {
  return (
    <footer className="brief-section mt-6 border-t border-gray-700 pt-3 text-[10px] italic leading-relaxed text-gray-500 print:border-t print:border-gray-400 print:text-gray-600">
      {note}
    </footer>
  )
}
