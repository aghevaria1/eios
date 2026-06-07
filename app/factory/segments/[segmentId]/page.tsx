import { notFound } from 'next/navigation'
import { loadSegments } from '@/lib/factory/load-target'
import { SegmentTabs } from '@/components/factory/segment-tabs'
import { StubBanner } from '@/components/factory/stub-banner'
import { WorkloadCard } from '@/components/factory/workload-card'
import { ArchitectureCard } from '@/components/factory/architecture-card'
import { ChannelEcosystemCard } from '@/components/factory/channel-ecosystem-card'
import { TCOCard } from '@/components/factory/tco-card'
import { ValuePropCard } from '@/components/factory/value-prop-card'
import { SourcesSidebar } from '@/components/factory/sources-sidebar'
import { SegmentBriefExportButton } from '@/components/factory/segment-brief-export-button'

const UNIT_BY_SEGMENT: Record<string, string> = {
  'federal-hpc': 'nodes',
  'academic-hpc': 'nodes',
  'enterprise-ai': 'GPUs',
  neoclouds: 'GPUs',
  'sovereign-ai': 'NICs',
}

export function generateStaticParams() {
  return loadSegments().map((s) => ({ segmentId: s.id }))
}

export default function SegmentPage({ params }: { params: { segmentId: string } }) {
  const segments = loadSegments()
  const segment = segments.find((s) => s.id === params.segmentId)
  if (!segment) notFound()

  const tabs = segments.map((s) => ({ id: s.id, name: s.name, badge: s.badge }))
  const unit = UNIT_BY_SEGMENT[segment.id] ?? 'nodes'

  return (
    <>
      <SegmentTabs tabs={tabs} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {segment.is_stub && <StubBanner />}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{segment.name}</h1>
            <p className="text-sm text-gray-400 mt-1">{segment.subtitle}</p>
          </div>
          <SegmentBriefExportButton segmentId={segment.id} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <WorkloadCard workload={segment.workload} />
            <ArchitectureCard architecture={segment.architecture} />
            <ChannelEcosystemCard channel={segment.channel} />
            <TCOCard tco={segment.tco} unit={unit} />
            <ValuePropCard valueProposition={segment.value_proposition} />
          </div>
          <div className="col-span-1">
            <SourcesSidebar
              sources={segment.sources}
              inferences={segment.inferences_flagged}
              openQuestions={segment.open_questions}
            />
          </div>
        </div>
      </div>
    </>
  )
}
