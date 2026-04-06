import { OpeningHour, Table, Order } from '@/types/database'

export function isShopOpen(hours: OpeningHour[], manualOpen: boolean, lastUpdate?: string | null): boolean {
  const now = new Date()

  // If we have a last manual update, check if it was on a previous day
  if (lastUpdate) {
    const updateDate = new Date(lastUpdate)
    const isDifferentDay = 
      updateDate.getDate() !== now.getDate() ||
      updateDate.getMonth() !== now.getMonth() ||
      updateDate.getFullYear() !== now.getFullYear()
    
    if (isDifferentDay) {
      // Midnight reset: Treat manual closing from a previous day as manualOpen: true (following schedule)
      manualOpen = true
    }
  }

  // If forced closed manually TODAY, it is always closed
  if (!manualOpen) return false

  if (hours.length === 0) return true

  const originalIndex = now.getDay()
  const dayOfWeek = (originalIndex + 6) % 7 // Transform 0=Sun back to 6=Sun, 1=Mon to 0=Mon
  const currentTime = now.getHours() * 100 + now.getMinutes()

  const todayHours = hours.filter(h => Number(h.day_of_week) === dayOfWeek)

  // If no hours are defined for TODAY, it is closed by default according to schedule
  if (todayHours.length === 0) return false

  return todayHours.some(slot => {
    const start = parseInt(slot.start_time.replace(/:/g, '').substring(0, 4))
    const end = parseInt(slot.end_time.replace(/:/g, '').substring(0, 4))
    return currentTime >= start && currentTime < end
  })
}

export function generateAvailableSlots(hours: OpeningHour[], targetDate: Date = new Date()): string[] {
  const originalIndex = targetDate.getDay()
  const dayOfWeek = (originalIndex + 6) % 7
  
  const now = new Date()
  const isToday = targetDate.toDateString() === now.toDateString()

  const todayHours = hours.filter(h => Number(h.day_of_week) === dayOfWeek)
  const slots: string[] = []

  todayHours.forEach(slot => {
    const startHour = parseInt(slot.start_time.split(':')[0])
    const endHour = parseInt(slot.end_time.split(':')[0])

    for (let h = startHour; h < endHour; h++) {
      if (isToday) {
        if (h <= now.getHours()) continue
      }

      const timeString = `${h.toString().padStart(2, '0')}:00`
      slots.push(timeString)
    }
  })

  return slots.sort()
}

export function getAvailableReservationSlots(
  hours: OpeningHour[],
  tables: Table[],
  existingOrders: Order[],
  guestCount: number,
  targetDate: Date = new Date()
): string[] {
  const allSlots = generateAvailableSlots(hours, targetDate)
  const availableSlots: string[] = []

  allSlots.forEach(slot => {
    const slotHour = parseInt(slot.split(':')[0])

    // Find all dine-in orders occupying this specific hour ON THE TARGET DATE
    const ordersInSlot = existingOrders.filter(order => {
      if (order.fulfillment_type !== 'dine_in' || !order.estimated_ready_at) return false
      if (order.status === 'cancelled') return false
      
      const orderDate = new Date(order.estimated_ready_at)
      const sameDay = orderDate.toDateString() === targetDate.toDateString()
      return sameDay && orderDate.getHours() === slotHour
    })

    // Greedy table assignment simulation
    const availableTables = [...tables].sort((a, b) => a.capacity - b.capacity)
    const sortedOrders = [...ordersInSlot].sort((a, b) => (b.guest_count || 1) - (a.guest_count || 1))

    for (const order of sortedOrders) {
      const guests = order.guest_count || 1
      const tableIndex = availableTables.findIndex(t => t.capacity >= guests)
      if (tableIndex !== -1) {
        availableTables.splice(tableIndex, 1)
      }
    }

    const canFit = availableTables.some(t => t.capacity >= guestCount)
    if (canFit) {
      availableSlots.push(slot)
    }
  })

  return availableSlots
}

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type DayKey = typeof DAY_KEYS[number]

export const DAYS_OF_WEEK = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
]
