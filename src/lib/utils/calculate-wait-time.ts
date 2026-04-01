export function calculateWaitTime(activeOrders: number, stressFactor: number = 5): number {
  const baseTime = 10
  return Math.max(baseTime, activeOrders * stressFactor)
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} Min.`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `~${h} Std.` : `~${h} Std. ${m} Min.`
}
