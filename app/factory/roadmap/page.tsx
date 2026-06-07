import { loadRoadmap } from '@/lib/factory/load-target'
import { TimelineCard } from '@/components/factory/timeline-card'
import { EolMethodologyCard } from '@/components/factory/eol-methodology-card'
import { CommitmentRegisterCard } from '@/components/factory/commitment-register-card'
import { RoadmapExportButton } from '@/components/factory/roadmap-export-button'

export default function RoadmapPage() {
  const data = loadRoadmap()
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Roadmap + Lifecycle</h1>
          <p className="text-sm text-gray-400 mt-1">
            Program horizon {data.timeline_start_year}–{data.timeline_end_year} · CN5000 → CN6000 → CN7000
          </p>
        </div>
        <RoadmapExportButton entries={data.commitment_register} />
      </div>
      <div className="space-y-4">
        <TimelineCard data={data} />
        <EolMethodologyCard data={data.eol_framework} />
        <CommitmentRegisterCard entries={data.commitment_register} />
      </div>
    </div>
  )
}
