import { squareClient, getDefaultLocationId, dollarsToCents, isSquareSandbox } from './client'
import { randomUUID } from 'crypto'

// Development email for sandbox testing - prevents sending to real clients
const DEV_EMAIL = process.env.SQUARE_DEV_EMAIL || 'dev-testing@example.com'

// Re-export for convenience
export { isSquareSandbox }

interface SquareServiceCharge {
  name: string
  type: 'FIXED_AMOUNT' | 'PERCENTAGE'
  amount?: number       // dollars (for FIXED_AMOUNT)
  percentage?: string   // e.g., "2.9" (for PERCENTAGE)
}

interface CreateSquareInvoiceParams {
  clientName: string
  clientEmail: string
  amount: number // in dollars
  description: string
  dueDate: string // ISO date string
  invoiceNumber: string
  note?: string
  serviceCharge?: SquareServiceCharge
}

interface SquareInvoiceResult {
  invoiceId: string
  invoiceUrl: string | null
  status: string
  customerId: string
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
  // In sandbox mode, redirect all emails to dev email
  const customerEmail = isSquareSandbox() ? DEV_EMAIL : params.clientEmail
  const customerName = isSquareSandbox() ? `[TEST] ${params.clientName}` : params.clientName

  if (isSquareSandbox()) {
    console.log(`[Square Sandbox] Redirecting invoice from ${params.clientEmail} to ${DEV_EMAIL}`)
  }

  // Get location ID
  let locationId: string
  try {
    locationId = await getDefaultLocationId()
  } catch (error) {
    console.error('[MCA] Failed to get Square location')
    throw new Error(`Square location error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Find or create customer in Square
  let customerId: string
  try {
    customerId = await findOrCreateCustomer(customerEmail, customerName)
  } catch (error) {
    console.error('[MCA] Failed to find/create Square customer')
    throw new Error(`Square customer error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Create an order first (required for invoices with amounts)
  let orderId: string
  try {
    // Build optional service charges (e.g., online processing fee)
    const serviceCharges = params.serviceCharge
      ? [
          {
            name: params.serviceCharge.name,
            calculationPhase: 'SUBTOTAL_PHASE' as const,
            ...(params.serviceCharge.type === 'FIXED_AMOUNT'
              ? {
                  amountMoney: {
                    amount: dollarsToCents(params.serviceCharge.amount!),
                    currency: 'USD' as const,
                  },
                }
              : {
                  percentage: params.serviceCharge.percentage!,
                }),
          },
        ]
      : undefined

    const orderResult = await squareClient.orders.create({
      order: {
        locationId,
        customerId,
        lineItems: [
          {
            name: params.description,
            quantity: '1',
            basePriceMoney: {
              amount: dollarsToCents(params.amount),
              currency: 'USD',
            },
            note: params.note || undefined,
          },
        ],
        serviceCharges,
        state: 'OPEN',
      },
      idempotencyKey: randomUUID(),
    })

    if (!orderResult?.order?.id) {
      throw new Error('Square returned empty order response')
    }
    orderId = orderResult.order.id
  } catch (error) {
    console.error('[MCA] Failed to create Square order')
    throw new Error(`Square order creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Create the invoice linked to the order
  let invoiceResult
  try {
    invoiceResult = await squareClient.invoices.create({
      invoice: {
        locationId,
        orderId,
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
  } catch (error) {
    console.error('[MCA] Failed to create Square invoice')
    throw new Error(`Square invoice creation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (!invoiceResult?.invoice?.id) {
    throw new Error('Square returned empty invoice response')
  }

  const invoiceId = invoiceResult.invoice.id

  // Publish the invoice (sends it to the customer)
  let publishResult
  try {
    publishResult = await squareClient.invoices.publish({
      invoiceId,
      version: invoiceResult.invoice.version!,
      idempotencyKey: randomUUID(),
    })
  } catch (error) {
    console.error('[MCA] Failed to publish Square invoice')
    throw new Error(`Square invoice publish error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    invoiceId,
    invoiceUrl: publishResult?.invoice?.publicUrl || null,
    status: publishResult?.invoice?.status || 'UNKNOWN',
    customerId,
  }
}

/**
 * Build a Square service charge from organization pricing settings.
 * For percentage + fixed cents, computes total as a fixed amount (Square doesn't support combined natively).
 */
export function buildSquareProcessingFee(
  pricingSettings: { square_processing_fee_enabled?: boolean; square_processing_fee_type?: string; square_processing_fee_amount?: number; square_processing_fee_percentage?: number; square_processing_fee_fixed_cents?: number } | undefined,
  invoiceAmount: number
): SquareServiceCharge | undefined {
  if (!pricingSettings?.square_processing_fee_enabled) return undefined

  const feeType = pricingSettings.square_processing_fee_type || 'fixed'

  if (feeType === 'fixed') {
    const amount = pricingSettings.square_processing_fee_amount || 0
    if (amount <= 0) return undefined
    return { name: 'Online Processing Fee', type: 'FIXED_AMOUNT', amount }
  }

  if (feeType === 'percentage') {
    const pct = pricingSettings.square_processing_fee_percentage || 0
    const fixedCents = pricingSettings.square_processing_fee_fixed_cents || 0

    if (pct <= 0 && fixedCents <= 0) return undefined

    if (fixedCents > 0) {
      // Percentage + fixed: compute total as fixed dollar amount
      const computedFee = (invoiceAmount * pct / 100) + (fixedCents / 100)
      return {
        name: 'Online Processing Fee',
        type: 'FIXED_AMOUNT',
        amount: Math.round(computedFee * 100) / 100,
      }
    }

    if (pct > 0) {
      return { name: 'Online Processing Fee', type: 'PERCENTAGE', percentage: pct.toString() }
    }
  }

  return undefined
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
