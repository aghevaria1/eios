'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  id: string
  name: string
  badge?: string
}

export function SegmentTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()
  return (
    <div className="border-b border-gray-800 bg-gray-900/40">
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const href = `/director/segments/${tab.id}`
          const active = pathname === href
          return (
            <Link
              key={tab.id}
              href={href}
              className={`px-3 py-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-blue-500 text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.name}
              {tab.badge && (
                <span className="ml-2 text-[10px] bg-amber-700 text-amber-100 px-1.5 py-0.5 rounded font-bold">
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
