'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// v2-cornelis chrome (existing). Renders on /factory/segments, /factory/phase-gate,
// /factory/roadmap, /factory/about — the v2 demo routes that the Cornelis Director-
// PM persona was built for.
const V2_NAV = [
  { label: 'Segments', href: '/factory/segments' },
  { label: 'Phase-Gate', href: '/factory/phase-gate' },
  { label: 'Roadmap', href: '/factory/roadmap' },
  { label: 'About', href: '/factory/about' },
]

// v3-nvidia chrome — pathname-conditional on /factory/architect and
// /factory/competitive. Distinct brand + sub-text + nav items so the AI
// Factory Advisor demo doesn't inherit v2's Director-PM / Target:Cornelis
// self-description. The v2 chrome is preserved for v2 routes unchanged.
const V3_NAV = [
  { label: 'Architect', href: '/factory/architect' },
  { label: 'Competitive', href: '/factory/competitive' },
  { label: 'Partner', href: '/factory/partner' },
  { label: 'Prioritization', href: '/factory/prioritization' },
]

function isV3Route(pathname: string): boolean {
  return (
    pathname.startsWith('/factory/architect') ||
    pathname.startsWith('/factory/competitive') ||
    pathname.startsWith('/factory/partner') ||
    pathname.startsWith('/factory/prioritization')
  )
}

export function TopNav({ targetName }: { targetName: string }) {
  const pathname = usePathname()
  const v3 = isV3Route(pathname)
  const navItems = v3 ? V3_NAV : V2_NAV

  return (
    <div className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-white">
            {v3 ? 'AI Factory Advisor' : 'EdgeInferenceOS v2'}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            {v3
              ? 'NVIDIA partner-PM context'
              : `Director PM Operating Framework · Target: ${targetName}`}
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
