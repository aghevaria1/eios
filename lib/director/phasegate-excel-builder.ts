import ExcelJS from 'exceljs'
import { loadPhaseGate } from './load-target'
import type {
  PhaseGateCellState,
  PhaseGateLane,
  PhaseGatePhase,
  PhaseGateStatus,
} from './types'

const LANE_LABEL: Record<PhaseGateLane, string> = {
  architecture: 'Architecture',
  silicon_design: 'Silicon Design',
  validation: 'Validation',
  isv_certification: 'ISV Certification',
  manufacturing: 'Manufacturing',
  supply_chain: 'Supply Chain',
  program: 'Program',
}

const PHASE_LABEL: Record<PhaseGatePhase, string> = {
  concept: 'Concept',
  plan: 'Plan',
  development: 'Development',
  sampling: 'Sampling',
  production: 'Production',
  sustaining: 'Sustaining',
}

const STATUS_LABEL: Record<PhaseGateStatus | 'slip', string> = {
  closed: 'CLOSED',
  in_progress: 'IN PROGRESS',
  at_risk: 'AT RISK',
  future: 'FUTURE',
  slip: 'SLIP',
}

interface StatusStyle {
  fillArgb: string
  fontArgb: string
}

const STATUS_STYLE: Record<PhaseGateStatus | 'slip', StatusStyle> = {
  closed: { fillArgb: 'FF5B6B7A', fontArgb: 'FFFFFFFF' },
  in_progress: { fillArgb: 'FF4A7C98', fontArgb: 'FFFFFFFF' },
  at_risk: { fillArgb: 'FFC9A352', fontArgb: 'FF1F2937' },
  slip: { fillArgb: 'FFA85D5D', fontArgb: 'FFFFFFFF' },
  future: { fillArgb: 'FFE5E7EB', fontArgb: 'FF6B7280' },
}

const HEADER_FILL_ARGB = 'FF1F2937'
const HEADER_FONT_ARGB = 'FFFFFFFF'
const SHEET_BG_FILL_ARGB = 'FFFFFFFF'
const FOOTER_FONT_ARGB = 'FF6B7280'
const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

const STOPWORDS = new Set([
  'phase', 'gate', 'with', 'from', 'this', 'that', 'mode', 'slip',
])

function findStateForDecision(
  title: string,
  states: PhaseGateCellState[],
): PhaseGateCellState | null {
  const t = title.toLowerCase()
  const titleWords = t
    .split(/[\s—,.()\-/]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))

  for (const s of states) {
    if (s.status === 'closed' || s.status === 'future') continue
    if (!s.detail) continue
    const detailLower = s.detail.toLowerCase()
    if (titleWords.some((w) => detailLower.includes(w))) return s
  }

  for (const s of states) {
    if (s.status !== 'at_risk' && s.status !== 'in_progress') continue
    const laneFirstWord = s.lane.split('_')[0].toLowerCase()
    const phaseToken = s.phase.toLowerCase()
    if (t.includes(laneFirstWord) || t.includes(phaseToken)) return s
  }
  return null
}

function buildStatusGridSheet(
  wb: ExcelJS.Workbook,
  phaseGate: ReturnType<typeof loadPhaseGate>,
): void {
  const sheet = wb.addWorksheet('Status Grid', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  })

  sheet.getColumn(1).width = 22
  for (let i = 0; i < phaseGate.phases.length; i++) {
    sheet.getColumn(i + 2).width = 28
  }

  const headerRow = sheet.getRow(1)
  headerRow.height = 24
  headerRow.getCell(1).value = 'Lane \\ Phase'
  phaseGate.phases.forEach((phase, i) => {
    headerRow.getCell(i + 2).value = PHASE_LABEL[phase].toUpperCase()
  })
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL_ARGB },
    }
    cell.font = { bold: true, color: { argb: HEADER_FONT_ARGB }, size: 11 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = CELL_BORDER
  })

  const stateMap = new Map<string, PhaseGateCellState>()
  for (const s of phaseGate.states) {
    stateMap.set(`${s.lane}::${s.phase}`, s)
  }

  phaseGate.lanes.forEach((lane, laneIdx) => {
    const rowNum = laneIdx + 2
    const row = sheet.getRow(rowNum)
    row.height = 64

    const laneCell = row.getCell(1)
    laneCell.value = LANE_LABEL[lane]
    laneCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL_ARGB },
    }
    laneCell.font = { bold: true, color: { argb: HEADER_FONT_ARGB }, size: 11 }
    laneCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    laneCell.border = CELL_BORDER

    phaseGate.phases.forEach((phase, phaseIdx) => {
      const cell = row.getCell(phaseIdx + 2)
      const state = stateMap.get(`${lane}::${phase}`)
      if (!state) {
        cell.value = ''
        cell.border = CELL_BORDER
        return
      }

      const style = STATUS_STYLE[state.status]
      const label = STATUS_LABEL[state.status]
      const lines: string[] = [label]
      if (state.target_date) lines.push(state.target_date)
      if (state.detail) lines.push(state.detail)

      cell.value = lines.join('\n')
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: style.fillArgb },
      }
      cell.font = {
        color: { argb: style.fontArgb },
        size: 10,
      }
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
      cell.border = CELL_BORDER
    })
  })

  const footerRowNum = phaseGate.lanes.length + 3
  const footerCell = sheet.getRow(footerRowNum).getCell(1)
  footerCell.value =
    'Cornelis Networks Internal — Engineering Leadership Review'
  sheet.mergeCells(footerRowNum, 1, footerRowNum, phaseGate.phases.length + 1)
  footerCell.font = {
    italic: true,
    color: { argb: FOOTER_FONT_ARGB },
    size: 9,
  }
  footerCell.alignment = { horizontal: 'left', vertical: 'middle' }
}

function severityOrder(status: PhaseGateStatus | 'slip'): number {
  switch (status) {
    case 'slip':
      return 0
    case 'at_risk':
      return 1
    case 'in_progress':
      return 2
    case 'future':
      return 3
    case 'closed':
      return 4
  }
}

function buildExecDecisionsSheet(
  wb: ExcelJS.Workbook,
  phaseGate: ReturnType<typeof loadPhaseGate>,
): void {
  const sheet = wb.addWorksheet('Exec Decisions Needed', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  const columns = [
    { header: 'Title', key: 'title', width: 38 },
    { header: 'Affected Lane', key: 'lane', width: 16 },
    { header: 'Affected Phase', key: 'phase', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Target Date', key: 'target_date', width: 14 },
    { header: 'Owner', key: 'owner', width: 18 },
    { header: 'Escalate To', key: 'escalate_to', width: 14 },
    { header: 'Detail', key: 'detail', width: 72 },
  ]
  sheet.columns = columns

  const headerRow = sheet.getRow(1)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL_ARGB },
    }
    cell.font = { bold: true, color: { argb: HEADER_FONT_ARGB }, size: 11 }
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    cell.border = CELL_BORDER
  })

  const rows = phaseGate.exec_decisions_needed.map((d) => {
    const matchedState = findStateForDecision(d.title, phaseGate.states)
    const status: PhaseGateStatus | 'slip' = matchedState?.status ?? 'at_risk'
    return {
      title: d.title,
      lane: matchedState ? LANE_LABEL[matchedState.lane] : '—',
      phase: matchedState ? PHASE_LABEL[matchedState.phase] : '—',
      status,
      target_date: d.target_date,
      owner: d.owner,
      escalate_to: d.escalate_to,
      detail: d.detail,
    }
  })

  rows.sort((a, b) => severityOrder(a.status) - severityOrder(b.status))

  rows.forEach((r, i) => {
    const row = sheet.getRow(i + 2)
    row.height = 72
    row.getCell(1).value = r.title
    row.getCell(2).value = r.lane
    row.getCell(3).value = r.phase
    row.getCell(4).value = STATUS_LABEL[r.status]
    row.getCell(5).value = r.target_date
    row.getCell(6).value = r.owner
    row.getCell(7).value = r.escalate_to
    row.getCell(8).value = r.detail

    row.eachCell((cell, colNumber) => {
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
      cell.font = { size: 10 }
      cell.border = CELL_BORDER
      if (colNumber === 4) {
        const style = STATUS_STYLE[r.status]
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: style.fillArgb },
        }
        cell.font = {
          color: { argb: style.fontArgb },
          bold: true,
          size: 10,
        }
        cell.alignment = { ...cell.alignment, horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  const footerRowNum = rows.length + 3
  const footerCell = sheet.getRow(footerRowNum).getCell(1)
  footerCell.value =
    'Cornelis Networks Internal — Engineering Leadership Review'
  sheet.mergeCells(footerRowNum, 1, footerRowNum, columns.length)
  footerCell.font = {
    italic: true,
    color: { argb: FOOTER_FONT_ARGB },
    size: 9,
  }
  footerCell.alignment = { horizontal: 'left', vertical: 'middle' }
}

export async function buildPhaseGateExcel(): Promise<Buffer> {
  const phaseGate = loadPhaseGate()

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Cornelis Networks'
  wb.created = new Date()
  wb.company = 'Cornelis Networks'
  wb.title = `CN6000 Phase-Gate Status Grid`

  buildStatusGridSheet(wb, phaseGate)
  buildExecDecisionsSheet(wb, phaseGate)

  const data = await wb.xlsx.writeBuffer()
  return Buffer.from(data as ArrayBuffer)
}
