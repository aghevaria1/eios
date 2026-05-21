import { loadTarget } from '@/lib/factory/load-target'
import { Day1Banner } from '@/components/factory/day1-banner'
import { Day1Footer } from '@/components/factory/day1-footer'
import { TopNav } from '@/components/factory/top-nav'

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  const target = loadTarget()
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">
      <Day1Banner />
      <TopNav targetName={target.name} />
      <main className="flex-1">{children}</main>
      <Day1Footer />
    </div>
  )
}
