import { squareClient, getDefaultLocationId, dollarsToCents } from './client'
import { randomUUID } from 'crypto'

interface CreateSquareInvoiceParams {
  clientName: string
  clientEmail: string
  amount: number // in dollars
  description: string
  dueDate: string // ISO date string
  invoiceNumber: string
  note?: string
}

interface SquareInvoiceResult {
  invoiceId: string
  invoiceUrl: string | null
  status: string
}

// Find or create a Square customer by email
async function findOrCreateCustomer(
  email: string,
  name: string
): Promise<string> {
  // Search for existing customer
  const searchResult = await squareClient.customers.search({
    query: {
      filter: {
        emailAddress: {
          exact: email,
        },
      },
    },
  })

  if (searchResult?.customers && searchResult.customers.length > 0) {
    return searchResult.customers[0].id!
  }

  // Create new customer
  const createResult = await squareClient.customers.create({
    idempotencyKey: randomUUID(),
    emailAddress: email,
    givenName: name.split(' ')[0],
    familyName: name.split(' ').slice(1).join(' ') || undefined,
  })

  if (!createResult?.customer?.id) {
    throw new Error('Failed to create Square customer')
  }

  return createResult.customer.id
}

// Create a Square invoice and send it to the customer
export async function createSquareInvoice(
  params: CreateSquareInvoiceParams
): Promise<SquareInvoiceResult> {
  const locationId = await getDefaultLocationId()

  // Find or create customer in Square
  const customerId = await findOrCreateCustomer(params.clientEmail, params.clientName)

  // Create the invoice
  const invoiceResult = await squareClient.invoices.create({
    invoice: {
      locationId,
      orderId: undefined, // We're not using Square orders
      primaryRecipient: {
        customerId,
      },
      paymentRequests: [
        {
          requestType: 'BALANCE',
          dueDate: params.dueDate.split('T')[0], // YYYY-MM-DD format
          automaticPaymentSource: 'NONE',
          reminders: [
            {
              relativeScheduledDays: -1,
              message: 'Your invoice from May Creative Arts is due tomorrow.',
            },
            {
              relativeScheduledDays: 0,
              message: 'Your invoice from May Creative Arts is due today.',
            },
            {
              relativeScheduledDays: 3,
              message: 'Your invoice from May Creative Arts is past due.',
            },
          ],
        },
      ],
      invoiceNumber: params.invoiceNumber,
      title: 'Music Therapy Services',
      description: params.description,
      customFields: params.note
        ? [
            {
              label: 'Session Notes',
              value: params.note,
              placement: 'ABOVE_LINE_ITEMS',
            },
          ]
        : undefined,
      deliveryMethod: 'EMAIL',
      acceptedPaymentMethods: {
        card: true,
        squareGiftCard: false,
        bankAccount: true,
        buyNowPayLater: false,
        cashAppPay: true,
      },
    },
    idempotencyKey: randomUUID(),
  })

  if (!invoiceResult?.invoice?.id) {
    throw new Error('Failed to create Square invoice')
  }

  const invoiceId = invoiceResult.invoice.id

  // Publish the invoice (sends it to the customer)
  const publishResult = await squareClient.invoices.publish({
    invoiceId,
    version: invoiceResult.invoice.version!,
    idempotencyKey: randomUUID(),
  })

  return {
    invoiceId,
    invoiceUrl: publishResult?.invoice?.publicUrl || null,
    status: publishResult?.invoice?.status || 'UNKNOWN',
  }
}

// Get invoice status from Square
export async function getSquareInvoiceStatus(invoiceId: string): Promise<{
  status: string
  paidAt?: string
  publicUrl?: string
}> {
  const result = await squareClient.invoices.get({ invoiceId })

  return {
    status: result?.invoice?.status || 'UNKNOWN',
    paidAt: result?.invoice?.paymentRequests?.[0]?.computedAmountMoney?.amount === BigInt(0)
      ? new Date().toISOString()
      : undefined,
    publicUrl: result?.invoice?.publicUrl || undefined,
  }
}

// Cancel a Square invoice
export async function cancelSquareInvoice(invoiceId: string, version: number): Promise<void> {
  await squareClient.invoices.cancel({
    invoiceId,
    version,
  })
}
