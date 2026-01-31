import { SquareClient, SquareEnvironment } from 'square'

// Check if Square is configured
export function isSquareConfigured(): boolean {
  return !!process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_ACCESS_TOKEN !== 'your_square_access_token_here'
}

// Check if Square is in sandbox/test mode
export function isSquareSandbox(): boolean {
  return process.env.SQUARE_ENVIRONMENT !== 'production'
}

// Get current Square environment for display
export function getSquareEnvironment(): 'sandbox' | 'production' {
  return process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
}

// Initialize Square client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
})

export { squareClient }

// Helper to get the default location ID
let cachedLocationId: string | null = null

export async function getDefaultLocationId(): Promise<string> {
  if (cachedLocationId) return cachedLocationId

  const response = await squareClient.locations.list()
  const location = response.locations?.[0]

  if (!location?.id) {
    throw new Error('No Square location found. Please set up a location in your Square dashboard.')
  }

  cachedLocationId = location.id
  return cachedLocationId
}

// Convert dollars to cents (Square uses cents)
export function dollarsToCents(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100))
}

// Convert cents to dollars
export function centsToDollars(cents: bigint): number {
  return Number(cents) / 100
}
