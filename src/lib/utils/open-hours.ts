import { OpeningHour, Table, Order } from '@/types/database'

export function isShopOpen(hours: OpeningHour[], manualOpen: boolean): boolean {
  if (!manualOpen) return false
  if (hours.length === 0) return false // Default to closed if no hours defined

  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const currentTime = now.getHours() * 100 + now.getMinutes()

  const todayHours = hours.filter(h => h.day_of_week === dayOfWeek)
  
  return todayHours.some(slot => {
    const start = parseInt(slot.start_time.replace(/:/g, '').substring(0, 4))
    const end = parseInt(slot.end_time.replace(/:/g, '').substring(0, 4))
    return currentTime >= start && currentTime < end
  })
}

export function generateAvailableSlots(hours: OpeningHour[], dayOffset: number = 0): string[] {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + dayOffset)
  const dayOfWeek = targetDate.getDay()
  
  const todayHours = hours.filter(h => h.day_of_week === dayOfWeek)
  const slots: string[] = []

  todayHours.forEach(slot => {
    const startHour = parseInt(slot.start_time.split(':')[0])
    const endHour = parseInt(slot.end_time.split(':')[0])
    
    for (let h = startHour; h < endHour; h++) {
      // For current day, only show future slots
      if (dayOffset === 0) {
        const now = new Date()
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
  dayOffset: number = 0
): string[] {
  const allSlots = generateAvailableSlots(hours, dayOffset)
  const availableSlots: string[] = []
  
  allSlots.forEach(slot => {
    const slotHour = parseInt(slot.split(':')[0])
    
    // Find all dine-in orders occupying this specific hour
    const ordersInSlot = existingOrders.filter(order => {
      if (order.fulfillment_type !== 'dine_in' || !order.estimated_ready_at) return false
      if (order.status === 'cancelled') return false
      const orderDate = new Date(order.estimated_ready_at)
      return orderDate.getHours() === slotHour
    })
    
    // Greedy table assignment simulation
    // 1. Sort available tables from smallest to largest
    const availableTables = [...tables].sort((a, b) => a.capacity - b.capacity)
    // 2. Sort orders from biggest group to smallest group
    const sortedOrders = [...ordersInSlot].sort((a, b) => (b.guest_count || 1) - (a.guest_count || 1))
    
    // 3. Seat existing orders
    for (const order of sortedOrders) {
      const guests = order.guest_count || 1
      const tableIndex = availableTables.findIndex(t => t.capacity >= guests)
      if (tableIndex !== -1) {
        availableTables.splice(tableIndex, 1) // Remove the occupied table
      }
    }
    
    // 4. See if the remaining tables can accommodate the new guest count
    const canFit = availableTables.some(t => t.capacity >= guestCount)
    if (canFit) {
      availableSlots.push(slot)
    }
  })

  return availableSlots
}

export const DAYS_OF_WEEK = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag'
]
