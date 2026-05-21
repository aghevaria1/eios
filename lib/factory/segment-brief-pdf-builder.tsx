import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { loadSegment } from './load-target'
import type { Segment, SegmentId } from './types'

const COLORS = {
  bg: '#FFFFFF',
  title: '#1F2937',
  body: '#374151',
  accent: '#1F4E79',
  footer: '#6B7280',
  rule: '#D1D5DB',
  sectionLabel: '#6B7280',
  tcoHighlightBg: '#F0F4F9',
} as const

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: COLORS.bg,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.body,
  },
  headerBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 8,
    marginBottom: 12,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  logoPlaceholder: {
    fontSize: 8,
    fontStyle: 'italic',
    color: COLORS.footer,
    marginBottom: 4,
  },
  segmentName: {
    fontSize: 18,
    color: COLORS.title,
    fontFamily: 'Helvetica-Bold',
  },
  segmentSubtitle: {
    fontSize: 10,
    color: COLORS.body,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.accent,
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  section: { marginBottom: 9 },
  sectionLabel: {
    fontSize: 8,
    color: COLORS.sectionLabel,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  valuePropQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.accent,
    lineHeight: 1.4,
  },
  bulletList: { marginLeft: 0 },
  bulletItem: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 10, color: COLORS.accent },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.35 },
  prefixedLine: { fontSize: 9, lineHeight: 1.35, marginBottom: 2 },
  bold: { fontFamily: 'Helvetica-Bold', color: COLORS.title },
  archItem: { marginBottom: 3 },
  archProductLine: { fontSize: 9, lineHeight: 1.35 },
  posTable: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  posRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
    paddingVertical: 4,
  },
  posVs: {
    width: 165,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.title,
    paddingRight: 6,
  },
  posAngle: { flex: 1, fontSize: 9, lineHeight: 1.35 },
  tcoTable: { flexDirection: 'row', marginTop: 2, marginBottom: 4 },
  tcoCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.rule,
    padding: 6,
    marginRight: 4,
    alignItems: 'center',
  },
  tcoCellLast: { marginRight: 0 },
  tcoCellWinner: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.tcoHighlightBg,
  },
  tcoVendor: {
    fontSize: 8,
    color: COLORS.sectionLabel,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tcoValue: {
    fontSize: 15,
    color: COLORS.title,
    fontFamily: 'Helvetica-Bold',
  },
  tcoUnit: { fontSize: 8, color: COLORS.footer, marginTop: 1 },
  channelBand: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    paddingTop: 8,
    marginTop: 4,
  },
  channelLeft: { flex: 1.5, paddingRight: 12 },
  channelRight: { flex: 1 },
  confidentialityFooter: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    fontStyle: 'italic',
    color: COLORS.footer,
    textAlign: 'left',
  },
})

function todayLabel(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

function fmtMoney(m: number): string {
  return `$${m.toFixed(1)}M`
}

function pdfSafeString(s: string): string {
  return s.replace(/→/g, ' -> ')
}

function sanitizeForPdf<T>(value: T): T {
  if (typeof value === 'string') {
    return pdfSafeString(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForPdf(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeForPdf(v)
    }
    return out as unknown as T
  }
  return value
}

function SegmentBriefDocument({ segment }: { segment: Segment }) {
  const top3BuyingCriteria = asArray(segment.workload.buying_criteria).slice(0, 3)
  const top3Architecture = segment.architecture.products.slice(0, 3).map((p, i) => ({
    product: p,
    description: segment.architecture.descriptions[i] ?? '',
  }))
  const competitivePositions = segment.value_proposition.competitive_position.slice(0, 3)
  const top2Drivers = segment.tco.advantage_drivers.slice(0, 2)
  const oemTop3 = segment.channel.oem_odm.slice(0, 3)

  const tcoValues: Array<{ vendor: string; value: number }> = [
    { vendor: 'Cornelis', value: segment.tco.cornelis_3yr_tco_M },
    { vendor: 'NVIDIA', value: segment.tco.nvidia_3yr_tco_M },
    { vendor: 'Broadcom', value: segment.tco.broadcom_3yr_tco_M },
  ]
  const minTco = Math.min(...tcoValues.map((v) => v.value))

  const primaryMix = asArray(segment.workload.primary_mix)
  const day1Priority = asArray(segment.channel.day1_isv_priority)

  return (
    <Document
      title={`Cornelis ${segment.name} — Partner Brief`}
      author="Cornelis Networks"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoPlaceholder}>[Cornelis Networks logo]</Text>
            <Text style={styles.segmentName}>{segment.name}</Text>
            <Text style={styles.segmentSubtitle}>{segment.subtitle}</Text>
          </View>
          {segment.badge ? (
            <Text style={styles.badge}>{segment.badge}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Value Proposition</Text>
          <Text style={styles.valuePropQuote}>
            &quot;{segment.value_proposition.statement}&quot;
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Market Fit — Top Buying Criteria</Text>
          <View style={styles.bulletList}>
            {top3BuyingCriteria.map((c, i) => (
              <View key={i} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Use Case</Text>
          <Text style={styles.prefixedLine}>
            <Text style={styles.bold}>Workload mix: </Text>
            {primaryMix.join('; ')}
          </Text>
          <Text style={styles.prefixedLine}>
            <Text style={styles.bold}>Scale: </Text>
            {segment.workload.typical_scale}
          </Text>
          <Text style={styles.prefixedLine}>
            <Text style={styles.bold}>Bottleneck: </Text>
            {segment.workload.bottleneck_profile}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reference Architecture</Text>
          <View>
            {top3Architecture.map((a, i) => (
              <View key={i} style={styles.archItem}>
                <Text style={styles.archProductLine}>
                  <Text style={styles.bold}>{a.product}</Text>
                  {' — ' + a.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Competitive Positioning</Text>
          <View style={styles.posTable}>
            {competitivePositions.map((p, i) => (
              <View key={i} style={styles.posRow}>
                <Text style={styles.posVs}>vs {p.vs}</Text>
                <Text style={styles.posAngle}>{p.angle}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            TCO at Scale · {segment.tco.deployment_scenario} · {segment.tco.default_horizon_years}-year horizon
          </Text>
          <View style={styles.tcoTable}>
            {tcoValues.map((v, i) => {
              const isWinner = v.value === minTco
              const isLast = i === tcoValues.length - 1
              return (
                <View
                  key={v.vendor}
                  style={[
                    styles.tcoCell,
                    isWinner ? styles.tcoCellWinner : {},
                    isLast ? styles.tcoCellLast : {},
                  ]}
                >
                  <Text style={styles.tcoVendor}>{v.vendor}</Text>
                  <Text style={styles.tcoValue}>{fmtMoney(v.value)}</Text>
                  <Text style={styles.tcoUnit}>
                    {segment.tco.default_horizon_years}-yr TCO
                  </Text>
                </View>
              )
            })}
          </View>
          <View style={styles.bulletList}>
            {top2Drivers.map((d, i) => (
              <View key={i} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.channelBand}>
          <View style={styles.channelLeft}>
            <Text style={styles.sectionLabel}>OEM / Channel Partners</Text>
            {oemTop3.map((o, i) => (
              <Text key={i} style={styles.prefixedLine}>
                <Text style={styles.bold}>{o.name}: </Text>
                {o.role}
              </Text>
            ))}
          </View>
          <View style={styles.channelRight}>
            <Text style={styles.sectionLabel}>Day-1 ISV Priority</Text>
            <Text style={styles.bulletText}>{day1Priority.join(' · ')}</Text>
          </View>
        </View>

        <Text style={styles.confidentialityFooter} fixed>
          Cornelis Networks · Partner Brief — {segment.name} · {todayLabel()}
        </Text>
      </Page>
    </Document>
  )
}

export async function buildSegmentBriefPdf(
  segmentId: SegmentId | string,
): Promise<Buffer> {
  const segment = loadSegment(segmentId)
  if (!segment) {
    throw new Error(`Segment not found: ${segmentId}`)
  }

  const sanitized = sanitizeForPdf(segment)
  const buf = await renderToBuffer(<SegmentBriefDocument segment={sanitized} />)
  return buf
}
