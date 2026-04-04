export function calculateWaitTime(
  activeOrders: number, 
  items: { product: { preparation_time_minutes: number; parallel_capacity: number }; quantity: number }[]
): number {
  if (items.length === 0) return 0

  // Calculate prep time for each item type, considering parallel capacity
  const itemPrepTimes = items.map(item => {
    // Default to 5 minutes if no prep time is set
    const baseTime = item.product.preparation_time_minutes || 5
    const capacity = item.product.parallel_capacity || 1
    const batches = Math.ceil(item.quantity / capacity)
    return baseTime * batches
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
