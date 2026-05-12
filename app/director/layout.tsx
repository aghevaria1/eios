import { loadTarget } from '@/lib/director/load-target'
import { Day1Banner } from '@/components/director/day1-banner'
import { Day1Footer } from '@/components/director/day1-footer'
import { TopNav } from '@/components/director/top-nav'

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
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
