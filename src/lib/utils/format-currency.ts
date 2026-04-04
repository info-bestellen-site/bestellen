export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}
