import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  logoSubtext: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    color: '#111827',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  col1: { width: '50%' },
  col2: { width: '20%', textAlign: 'center' as const },
  col3: { width: '30%', textAlign: 'right' as const },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right' as const,
    color: '#6b7280',
    marginRight: 20,
  },
  totalValue: {
    width: 100,
    textAlign: 'right' as const,
    color: '#111827',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    width: 120,
    textAlign: 'right' as const,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 20,
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right' as const,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
  status: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  statusSent: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.5,
  },
})

interface InvoiceLineItem {
  description: string
  session_date: string
  duration_minutes: number | null
  amount: number
  service_type_name: string | null
  contractor_name: string | null
}

interface InvoiceData {
  id: string
  amount: number
  mca_cut: number
  contractor_pay: number
  status: 'pending' | 'sent' | 'paid'
  payment_method: string
  invoice_type?: string
  billing_period?: string | null
  created_at: string
  due_date?: string
  paid_date?: string
  client: {
    name: string
    contact_email?: string
  }
  session?: {
    date: string
    duration_minutes?: number
    notes?: string
    service_type: {
      name: string
    }
    contractor: {
      name: string
    }
  } | null
  items?: InvoiceLineItem[]
}

interface InvoicePDFProps {
  invoice: InvoiceData
}

const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const invoiceNumber = `INV-${invoice.id.slice(0, 8).toUpperCase()}`
  const isBatch = invoice.invoice_type === 'batch' && invoice.items && invoice.items.length > 0

  const titleText = isBatch && invoice.billing_period
    ? `Monthly Statement - ${new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'INVOICE'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>May Creative Arts</Text>
            <Text style={styles.logoSubtext}>Music Therapy Services</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{titleText}</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={{ flexDirection: 'row', marginBottom: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
              {invoice.client.name}
            </Text>
            {invoice.client.contact_email && (
              <Text style={{ color: '#6b7280' }}>{invoice.client.contact_email}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{formatDate(invoice.created_at)}</Text>
            </View>
            {invoice.due_date && (
              <View style={styles.row}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Payment:</Text>
              <Text style={styles.value}>
                {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[
                styles.status,
                invoice.status === 'paid' ? styles.statusPaid :
                invoice.status === 'sent' ? styles.statusSent :
                styles.statusPending
              ]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Service</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Amount</Text>
          </View>

          {isBatch ? (
            // Batch invoice: render multiple line items
            <>
              {invoice.items!.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.col1}>
                    <Text style={{ fontWeight: 'bold' }}>{item.service_type_name || 'Session'}</Text>
                    {item.contractor_name && (
                      <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                        Therapist: {item.contractor_name}
                      </Text>
                    )}
                    {item.duration_minutes && (
                      <Text style={{ fontSize: 9, color: '#6b7280' }}>
                        Duration: {item.duration_minutes} minutes
                      </Text>
                    )}
                  </View>
                  <Text style={styles.col2}>{formatShortDate(item.session_date)}</Text>
                  <Text style={[styles.col3, { fontWeight: 'bold' }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </>
          ) : invoice.session ? (
            // Single session invoice
            <View style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={{ fontWeight: 'bold' }}>{invoice.session.service_type.name}</Text>
                <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                  Therapist: {invoice.session.contractor.name}
                </Text>
                {invoice.session.duration_minutes && (
                  <Text style={{ fontSize: 9, color: '#6b7280' }}>
                    Duration: {invoice.session.duration_minutes} minutes
                  </Text>
                )}
              </View>
              <Text style={styles.col2}>{formatDate(invoice.session.date)}</Text>
              <Text style={[styles.col3, { fontWeight: 'bold' }]}>
                {formatCurrency(invoice.amount)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          {isBatch && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{invoice.items!.length} sessions</Text>
              <Text style={styles.totalValue}></Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Due:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.amount)}</Text>
          </View>
        </View>

        {/* Session Notes (single-session only) */}
        {!isBatch && invoice.session?.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Session Notes</Text>
            <Text style={styles.notesText}>{invoice.session.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing May Creative Arts!
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            Questions? Contact us at maycreativearts@gmail.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}
