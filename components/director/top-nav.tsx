'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Segments', href: '/director/segments' },
  { label: 'Phase-Gate', href: '/director/phase-gate' },
  { label: 'Roadmap', href: '/director/roadmap' },
  { label: 'About', href: '/director/about' },
]

export function TopNav({ targetName }: { targetName: string }) {
  const pathname = usePathname()
  return (
    <div className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-white">EdgeInferenceOS v2</span>
          <span className="text-xs text-gray-400 ml-2">
            Director PM Operating Framework · Target: {targetName}
          </span>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  active
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
