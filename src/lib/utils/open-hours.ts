import { OpeningHour, Table, Order } from '@/types/database'

export function isShopOpen(
  hours: OpeningHour[], 
  manualOpen: boolean, 
  lastUpdate?: string | null,
  type: 'general' | 'delivery' = 'general',
  cutoffMinutes: number = 0
): boolean {
  const now = new Date()
  let isManualOverride = !manualOpen

  // 1. Check for day-change reset
  if (lastUpdate) {
    const updateDate = new Date(lastUpdate)
    const isDifferentDay = 
      updateDate.getDate() !== now.getDate() ||
      updateDate.getMonth() !== now.getMonth() ||
      updateDate.getFullYear() !== now.getFullYear()
    
    if (isDifferentDay) {
      // Manual status from a previous day expires
      isManualOverride = false
    }
  }

  const originalIndex = now.getDay()
  const dayOfWeek = (originalIndex + 6) % 7 // Transform 0=Sun to 6=Sun, 1=Mon to 0=Mon
  const currentTimeInt = now.getHours() * 100 + now.getMinutes()
  
  // Filter by type (defaulting to general if no type provided in data)
  const todayHours = hours.filter(h => 
    Number(h.day_of_week) === dayOfWeek && 
    ((h as any).type === type || (!(h as any).type && type === 'general'))
  )

  // 3. Find if we are currently in an opening slot
  const currentSlot = todayHours.find(slot => {
    const start = parseInt(slot.start_time.replace(/:/g, '').substring(0, 4))
    let end = parseInt(slot.end_time.replace(/:/g, '').substring(0, 4))

    // Apply cutoff if this is a general/delivery check (not for reservations usually)
    if (cutoffMinutes > 0) {
      const parts = slot.end_time.split(':')
      const endH = parseInt(parts[0])
      const endM = parseInt(parts[1])
      
      const dateWithCutoff = new Date(now)
      dateWithCutoff.setHours(endH, endM, 0, 0)
      dateWithCutoff.setMinutes(dateWithCutoff.getMinutes() - cutoffMinutes)
      
      const cutoffTimeInt = dateWithCutoff.getHours() * 100 + dateWithCutoff.getMinutes()
      end = cutoffTimeInt
    }

    return currentTimeInt >= start && currentTimeInt < end
  })

  // 4. Handle Manual Closure expiration logic (Slot-based)
  // If the shop is forced closed manually, check if that closure was for a previous slot
  if (isManualOverride && lastUpdate && currentSlot) {
    const updateDate = new Date(lastUpdate)
    const slotStartParts = currentSlot.start_time.split(':')
    const slotStartDate = new Date(now)
    slotStartDate.setHours(parseInt(slotStartParts[0]), parseInt(slotStartParts[1]), 0, 0)

    // If the manual "Close" happened BEFORE the current slot started, it was for a previous period
    // The shop should now follow the schedule again (which is currently "Open" as we are in a currentSlot)
    if (updateDate < slotStartDate) {
      isManualOverride = false
    }
  }

  // 5. Final decision
  if (isManualOverride) return false // Manually closed and override is still active
  
  // Follow schedule
  if (hours.length === 0) return true
  if (todayHours.length === 0) return false
  return !!currentSlot
}

export function generateAvailableSlots(
  hours: OpeningHour[], 
  targetDate: Date = new Date(),
  type: 'general' | 'delivery' = 'general'
): string[] {
  const originalIndex = targetDate.getDay()
  const dayOfWeek = (originalIndex + 6) % 7
  
  const now = new Date()
  const isToday = targetDate.toDateString() === now.toDateString()

  const todayHours = hours.filter(h => 
    Number(h.day_of_week) === dayOfWeek && 
    ((h as any).type === type || (!(h as any).type && type === 'general'))
  )
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
