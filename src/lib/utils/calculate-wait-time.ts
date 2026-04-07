export function calculateWaitTime(
  activeOrders: number,
  items: { product: { preparation_time_minutes: number }; quantity: number }[]
): number {
  if (items.length === 0) return 0

  // Calculate prep time for each item type
  const itemPrepTimes = items.map(item => {
    // Default to 5 minutes if no prep time is set
    const baseTime = item.product.preparation_time_minutes || 5
    return baseTime * item.quantity
  })

  // Start with the longest item time
  const maxPrepTime = Math.max(...itemPrepTimes)

  // Add 1 minute per active order as a realistic delay
  const overhead = activeOrders * 1

  return maxPrepTime + overhead
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} Min.`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `~${h} Std.` : `~${h} Std. ${m} Min.`
}
