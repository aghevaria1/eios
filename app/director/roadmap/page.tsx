import { loadRoadmap } from '@/lib/director/load-target'
import { TimelineCard } from '@/components/director/timeline-card'
import { EolMethodologyCard } from '@/components/director/eol-methodology-card'
import { CommitmentRegisterCard } from '@/components/director/commitment-register-card'

export default function RoadmapPage() {
  const data = loadRoadmap()
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Roadmap + Lifecycle</h1>
        <p className="text-sm text-gray-400 mt-1">
          Program horizon {data.timeline_start_year}–{data.timeline_end_year} · CN5000 → CN6000 → CN7000
        </p>
      </div>
      <div className="space-y-4">
        <TimelineCard data={data} />
        <EolMethodologyCard data={data.eol_framework} />
        <CommitmentRegisterCard entries={data.commitment_register} />
      </div>
    </div>
  )
}
