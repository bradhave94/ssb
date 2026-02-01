/**
 * Format cents to display as currency (e.g., 12345 -> "$123.45")
 */
export function formatMoney(amountCents: number): string {
  const dollars = amountCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}

/**
 * Parse user input like "$54.13" or "54.13" to cents (integer)
 */
export function parseMoney(input: string): number {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[$,\s]/g, '')
  const amount = parseFloat(cleaned)

  if (isNaN(amount)) {
    throw new Error('Invalid money amount')
  }

  // Convert to cents and round to avoid floating point issues
  return Math.round(amount * 100)
}
