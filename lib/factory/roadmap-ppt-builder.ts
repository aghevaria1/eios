import PptxGenJS from 'pptxgenjs'
import { loadRoadmap, loadSegments } from './load-target'
import { resolveSegmentId } from './customer-segment-resolver'
import {
  CN5000_LIFECYCLE_BULLETS,
  sanitizeStatusBadge,
  sanitizeStatusFraming,
} from './roadmap-ppt-sanitizer'
import type {
  CommitmentRegisterEntry,
  RoadmapFile,
  Segment,
} from './types'

const DECK_THEME = {
  background: 'FFFFFF',
  title: '1F2937',
  body: '374151',
  accent: '1F4E79',
  footer: '6B7280',
  rule: 'D1D5DB',
} as const

const PHASE_COLOR: Record<string, string> = {
  production: '5B8C5A',
  sustaining: '9CA3AF',
  development: '3F6B91',
  sampling: 'C7975B',
  concept: 'E5E7EB',
  eol_phasing: 'A85D5D',
}

export interface RoadmapPptInput {
  customer: string
  commitment: string
}

function findEntry(input: RoadmapPptInput): CommitmentRegisterEntry {
  const roadmap = loadRoadmap()
  const entry = roadmap.commitment_register.find(
    (e) => e.customer === input.customer && e.commitment === input.commitment,
  )
  if (!entry) {
    throw new Error(
      `Commitment not found: ${input.customer} / ${input.commitment}`,
    )
  }
  return entry
}

function findSegment(customer: string): Segment | null {
  const id = resolveSegmentId(customer)
  if (!id) return null
  return loadSegments().find((s) => s.id === id) ?? null
}

function todayLabel(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function addConfidentialityFooter(slide: PptxGenJS.Slide, customer: string) {
  slide.addText(
    `Cornelis Networks Confidential — Prepared for ${customer}`,
    {
      x: 0.4,
      y: 7.05,
      w: 9.2,
      h: 0.3,
      fontSize: 9,
      italic: true,
      color: DECK_THEME.footer,
      align: 'left',
    },
  )
}

function addCoverSlide(
  pres: PptxGenJS,
  entry: CommitmentRegisterEntry,
): void {
  const slide = pres.addSlide()
  slide.background = { color: DECK_THEME.background }

  slide.addText('[Cornelis Networks logo]', {
    x: 0.5,
    y: 0.5,
    w: 4,
    h: 0.4,
    fontSize: 10,
    italic: true,
    color: DECK_THEME.footer,
  })

  slide.addText('CN6000 Roadmap Overview', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addShape('rect', {
    x: 0.5,
    y: 3.55,
    w: 1.2,
    h: 0.04,
    fill: { color: DECK_THEME.accent },
    line: { color: DECK_THEME.accent, width: 0 },
  })

  slide.addText(`Prepared for ${entry.customer}`, {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.6,
    fontSize: 22,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  slide.addText(todayLabel(), {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: DECK_THEME.footer,
    fontFace: 'Calibri',
  })

  addConfidentialityFooter(slide, entry.customer)
}

const CHART_X_LEFT = 1.8
const CHART_X_RIGHT = 13.0
const CHART_WIDTH = CHART_X_RIGHT - CHART_X_LEFT
const YEAR_START = 2024
const YEAR_END = 2029
const YEAR_WIDTH = CHART_WIDTH / (YEAR_END - YEAR_START)
const MIN_PHASE_YEARS = 0.5

const PHASE_LABEL: Record<string, string> = {
  production: 'Production',
  sustaining: 'Sustaining',
  eol_phasing: 'Lifecycle Phasing',
  development: 'Development',
  sampling: 'Sampling',
  concept: 'Concept',
}

const PHASE_LEGEND_ORDER: ReadonlyArray<keyof typeof PHASE_LABEL> = [
  'concept',
  'development',
  'sampling',
  'production',
  'sustaining',
  'eol_phasing',
]

function yearToX(year: number): number {
  return CHART_X_LEFT + (year - YEAR_START) * YEAR_WIDTH
}

function addSegmentContextSlide(
  pres: PptxGenJS,
  entry: CommitmentRegisterEntry,
  segment: Segment | null,
): void {
  if (!segment) return

  const slide = pres.addSlide()
  slide.background = { color: DECK_THEME.background }

  slide.addText('Your Segment Context', {
    x: 0.5,
    y: 0.4,
    w: 12.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addShape('rect', {
    x: 0.5,
    y: 0.95,
    w: 1.2,
    h: 0.04,
    fill: { color: DECK_THEME.accent },
    line: { color: DECK_THEME.accent, width: 0 },
  })

  slide.addText(`${segment.name} — ${segment.subtitle}`, {
    x: 0.5,
    y: 1.15,
    w: 12.5,
    h: 0.5,
    fontSize: 16,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  slide.addText(`"${segment.value_proposition.statement}"`, {
    x: 0.5,
    y: 1.85,
    w: 12.3,
    h: 0.9,
    fontSize: 15,
    italic: true,
    color: DECK_THEME.accent,
    fontFace: 'Calibri',
  })

  slide.addText('Reference Architecture', {
    x: 0.5,
    y: 3.0,
    w: 12.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  const archItems = segment.architecture.products.map((product, i) => ({
    product,
    description: segment.architecture.descriptions[i] ?? '',
  }))

  const archFragments: PptxGenJS.TextProps[] = []
  archItems.forEach((item, i) => {
    archFragments.push({
      text: item.product,
      options: {
        bold: true,
        color: DECK_THEME.title,
        bullet: { code: '2022' },
      },
    })
    archFragments.push({
      text: ` — ${item.description}`,
      options: {
        color: DECK_THEME.body,
        breakLine: i < archItems.length - 1,
      },
    })
  })

  slide.addText(archFragments, {
    x: 0.7,
    y: 3.5,
    w: 12.3,
    h: 2.5,
    fontSize: 13,
    paraSpaceAfter: 8,
    fontFace: 'Calibri',
  })

  slide.addShape('line', {
    x: 0.5,
    y: 6.1,
    w: 12.3,
    h: 0,
    line: { color: DECK_THEME.rule, width: 1 },
  })

  slide.addText(segment.architecture.protocol_reasoning, {
    x: 0.5,
    y: 6.25,
    w: 12.3,
    h: 0.7,
    fontSize: 11,
    italic: true,
    color: DECK_THEME.footer,
    fontFace: 'Calibri',
  })

  addConfidentialityFooter(slide, entry.customer)
}

function addTimelineSlide(pres: PptxGenJS, entry: CommitmentRegisterEntry, roadmap: RoadmapFile): void {
  const slide = pres.addSlide()
  slide.background = { color: DECK_THEME.background }

  slide.addText('CN5000 → CN6000 → CN7000 Generations', {
    x: 0.5,
    y: 0.4,
    w: 12.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addText('Multi-generation product horizon · 2024–2029', {
    x: 0.5,
    y: 0.95,
    w: 12.5,
    h: 0.3,
    fontSize: 13,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  const ROW_Y: Record<string, number> = {
    cn5000: 1.7,
    cn6000: 2.65,
    cn7000: 3.6,
  }
  const ROW_HEIGHT = 0.55

  for (const gen of roadmap.generation_phases) {
    const y = ROW_Y[gen.generation]
    if (y === undefined) continue

    slide.addText(gen.generation.toUpperCase(), {
      x: 0.4,
      y: y - 0.05,
      w: 1.3,
      h: ROW_HEIGHT + 0.1,
      fontSize: 12,
      bold: true,
      color: DECK_THEME.body,
      align: 'left',
      valign: 'middle',
      fontFace: 'Calibri',
    })

    const phasesByWidth = gen.phases
      .map((p, originalIdx) => {
        const start = parseInt(p.start, 10)
        const end = parseInt(p.end, 10)
        const naturalWidth = end - start
        return { p, originalIdx, start, end, naturalWidth }
      })
      .sort((a, b) => {
        const aSmall = a.naturalWidth < MIN_PHASE_YEARS
        const bSmall = b.naturalWidth < MIN_PHASE_YEARS
        if (aSmall && !bSmall) return 1
        if (!aSmall && bSmall) return -1
        return a.originalIdx - b.originalIdx
      })

    for (const { p, start, naturalWidth } of phasesByWidth) {
      const widthYears = Math.max(naturalWidth, MIN_PHASE_YEARS)
      const x = yearToX(start)
      const w = widthYears * YEAR_WIDTH
      const fill = PHASE_COLOR[p.phase] ?? DECK_THEME.rule
      const isConcept = p.phase === 'concept'

      slide.addShape('rect', {
        x,
        y,
        w,
        h: ROW_HEIGHT,
        fill: { color: fill },
        line: isConcept
          ? { color: DECK_THEME.accent, width: 1, dashType: 'dash' }
          : { color: fill, width: 0 },
      })
    }
  }

  const yearTickY = 4.45
  for (let yr = YEAR_START; yr <= YEAR_END; yr++) {
    const x = yearToX(yr)
    slide.addShape('line', {
      x,
      y: yearTickY,
      w: 0,
      h: 0.1,
      line: { color: DECK_THEME.rule, width: 1 },
    })
    slide.addText(String(yr), {
      x: x - 0.4,
      y: yearTickY + 0.15,
      w: 0.8,
      h: 0.3,
      fontSize: 11,
      color: DECK_THEME.body,
      align: 'center',
      fontFace: 'Calibri',
    })
  }

  slide.addShape('line', {
    x: CHART_X_LEFT,
    y: yearTickY,
    w: CHART_WIDTH,
    h: 0,
    line: { color: DECK_THEME.rule, width: 1 },
  })

  const legendY = 5.6
  const legendItemWidth = 2.0
  const legendStartX = (13.333 - legendItemWidth * PHASE_LEGEND_ORDER.length) / 2
  PHASE_LEGEND_ORDER.forEach((phase, i) => {
    const x = legendStartX + i * legendItemWidth
    const isConcept = phase === 'concept'
    slide.addShape('rect', {
      x,
      y: legendY,
      w: 0.25,
      h: 0.2,
      fill: { color: PHASE_COLOR[phase] },
      line: isConcept
        ? { color: DECK_THEME.accent, width: 1, dashType: 'dash' }
        : { color: PHASE_COLOR[phase], width: 0 },
    })
    slide.addText(PHASE_LABEL[phase], {
      x: x + 0.3,
      y: legendY - 0.05,
      w: legendItemWidth - 0.35,
      h: 0.3,
      fontSize: 10,
      color: DECK_THEME.body,
      fontFace: 'Calibri',
    })
  })

  addConfidentialityFooter(slide, entry.customer)
}

function addCustomerStatusSlide(
  pres: PptxGenJS,
  entry: CommitmentRegisterEntry,
  segment: Segment | null,
): void {
  const slide = pres.addSlide()
  slide.background = { color: DECK_THEME.background }

  slide.addText('Your Commitment Status', {
    x: 0.5,
    y: 0.4,
    w: 12.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addShape('rect', {
    x: 0.5,
    y: 0.95,
    w: 1.2,
    h: 0.04,
    fill: { color: DECK_THEME.accent },
    line: { color: DECK_THEME.accent, width: 0 },
  })

  slide.addText(entry.customer, {
    x: 0.5,
    y: 1.2,
    w: 12.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addText(entry.commitment, {
    x: 0.5,
    y: 1.85,
    w: 12.5,
    h: 0.5,
    fontSize: 16,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  slide.addText(`Committed delivery: ${entry.date}`, {
    x: 0.5,
    y: 2.35,
    w: 12.5,
    h: 0.4,
    fontSize: 13,
    italic: true,
    color: DECK_THEME.footer,
    fontFace: 'Calibri',
  })

  const badge = sanitizeStatusBadge(entry.status)
  slide.addShape('rect', {
    x: 0.5,
    y: 3.0,
    w: 4.0,
    h: 0.45,
    fill: { color: badge.hex },
    line: { color: badge.hex, width: 0 },
  })
  slide.addText(badge.label, {
    x: 0.5,
    y: 3.0,
    w: 4.0,
    h: 0.45,
    fontSize: 13,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Calibri',
  })

  slide.addText(sanitizeStatusFraming(entry), {
    x: 0.5,
    y: 3.65,
    w: 12.5,
    h: 0.8,
    fontSize: 14,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  if (segment) {
    slide.addText('Aligned with your priorities:', {
      x: 0.5,
      y: 4.75,
      w: 12.5,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: DECK_THEME.title,
      fontFace: 'Calibri',
    })

    const criteria = Array.isArray(segment.workload.buying_criteria)
      ? segment.workload.buying_criteria.slice(0, 2)
      : [segment.workload.buying_criteria]

    slide.addText(
      criteria.map((c) => ({
        text: c,
        options: { bullet: { code: '2022' } },
      })),
      {
        x: 0.7,
        y: 5.15,
        w: 12.3,
        h: 0.9,
        fontSize: 13,
        color: DECK_THEME.body,
        paraSpaceAfter: 4,
        fontFace: 'Calibri',
      },
    )

    slide.addText(`"${segment.value_proposition.statement}"`, {
      x: 0.5,
      y: 6.2,
      w: 12.5,
      h: 0.7,
      fontSize: 12,
      italic: true,
      color: DECK_THEME.accent,
      fontFace: 'Calibri',
    })
  }

  addConfidentialityFooter(slide, entry.customer)
}

function addLifecycleSlide(
  pres: PptxGenJS,
  entry: CommitmentRegisterEntry,
  segment: Segment | null,
): void {
  const slide = pres.addSlide()
  slide.background = { color: DECK_THEME.background }

  slide.addText('CN5000 Lifecycle & Program Confidence', {
    x: 0.5,
    y: 0.4,
    w: 12.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addShape('rect', {
    x: 0.5,
    y: 0.95,
    w: 1.2,
    h: 0.04,
    fill: { color: DECK_THEME.accent },
    line: { color: DECK_THEME.accent, width: 0 },
  })

  slide.addText('Cornelis CN5000 Delivery and Support Commitment', {
    x: 0.5,
    y: 1.3,
    w: 12.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  slide.addText(
    CN5000_LIFECYCLE_BULLETS.map((b) => ({
      text: b,
      options: { bullet: { code: '2022' } },
    })),
    {
      x: 0.7,
      y: 1.85,
      w: 12.3,
      h: 2.4,
      fontSize: 14,
      color: DECK_THEME.body,
      paraSpaceAfter: 6,
      fontFace: 'Calibri',
    },
  )

  slide.addShape('line', {
    x: 0.5,
    y: 4.5,
    w: 12.3,
    h: 0,
    line: { color: DECK_THEME.rule, width: 1 },
  })

  slide.addText('For Your Program', {
    x: 0.5,
    y: 4.7,
    w: 12.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: DECK_THEME.title,
    fontFace: 'Calibri',
  })

  const programConfidence = segment
    ? `Your ${entry.commitment} commitment for ${entry.date} is anchored on the priorities that matter to ${segment.name}: ${segment.value_proposition.statement}`
    : `Your ${entry.commitment} commitment for ${entry.date} is anchored on the technical priorities established with your program team.`

  slide.addText(programConfidence, {
    x: 0.5,
    y: 5.2,
    w: 12.3,
    h: 1.5,
    fontSize: 13,
    color: DECK_THEME.body,
    fontFace: 'Calibri',
  })

  addConfidentialityFooter(slide, entry.customer)
}

export async function buildRoadmapPpt(input: RoadmapPptInput): Promise<Buffer> {
  const entry = findEntry(input)
  const roadmap = loadRoadmap()
  const segment = findSegment(entry.customer)

  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_WIDE'
  pres.title = `Cornelis CN6000 Roadmap — ${entry.customer}`
  pres.company = 'Cornelis Networks'

  addCoverSlide(pres, entry)
  addSegmentContextSlide(pres, entry, segment)
  addTimelineSlide(pres, entry, roadmap)
  addCustomerStatusSlide(pres, entry, segment)
  addLifecycleSlide(pres, entry, segment)

  const data = await pres.write({ outputType: 'nodebuffer' })
  return data as Buffer
}
