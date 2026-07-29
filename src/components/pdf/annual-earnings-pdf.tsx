import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/pricing'
import type { AnnualSummary } from '@/lib/payroll/annual-summary'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    maxWidth: 220,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right' as const,
  },
  docSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right' as const,
  },
  disclaimer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    fontSize: 9,
    color: '#374151',
  },
  totalsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  totalBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 12,
  },
  totalBoxFirst: {
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colName: { width: '50%' },
  colSessions: { width: '20%', textAlign: 'center' as const },
  colAmount: { width: '30%', textAlign: 'right' as const },
  totalLine: {
    flexDirection: 'row',
    padding: 8,
  },
  totalLineName: { width: '50%', fontWeight: 'bold' },
  totalLineSessions: { width: '20%', textAlign: 'center' as const, fontWeight: 'bold' },
  totalLineAmount: {
    width: '30%',
    textAlign: 'right' as const,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

export interface AnnualEarningsPDFProps {
  organizationName: string
  contractorName: string
  summary: AnnualSummary
  /** Pre-formatted display date, e.g. "July 28, 2026" */
  generatedOn: string
}

export function AnnualEarningsPDF({
  organizationName,
  contractorName,
  summary,
  generatedOn,
}: AnnualEarningsPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{organizationName}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Annual Earnings Summary</Text>
            <Text style={styles.docSubtitle}>
              {contractorName} — Tax Year {summary.year}
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Informal earnings summary — not an official tax document (not a 1099). Reflects
          contractor payments recorded in this system during calendar year {summary.year},
          on a cash basis (grouped by payment date, not session date).
        </Text>

        <View style={styles.totalsRow}>
          <View style={[styles.totalBox, styles.totalBoxFirst]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Sessions Paid</Text>
            <Text style={styles.totalValue}>{summary.sessionCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By Month</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.tableHeaderText]}>Month</Text>
            <Text style={[styles.colSessions, styles.tableHeaderText]}>Sessions</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          {summary.monthly.map((month) => (
            <View key={month.month} style={styles.tableRow}>
              <Text style={styles.colName}>{month.label}</Text>
              <Text style={styles.colSessions}>{month.sessions}</Text>
              <Text style={styles.colAmount}>{formatCurrency(month.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalLine}>
            <Text style={styles.totalLineName}>Total</Text>
            <Text style={styles.totalLineSessions}>{summary.sessionCount}</Text>
            <Text style={styles.totalLineAmount}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By Service Type</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colName, styles.tableHeaderText]}>Service</Text>
            <Text style={[styles.colSessions, styles.tableHeaderText]}>Sessions</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          {summary.byServiceType.map((service) => (
            <View key={service.name} style={styles.tableRow}>
              <Text style={styles.colName}>{service.name}</Text>
              <Text style={styles.colSessions}>{service.sessions}</Text>
              <Text style={styles.colAmount}>{formatCurrency(service.amount)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {generatedOn} • {organizationName} • Not an official tax document
        </Text>
      </Page>
    </Document>
  )
}
