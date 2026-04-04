'use client'

import { Order, OrderItem, OrderStatus } from '@/types/database'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Clock, CheckCircle2, Play, Check, XCircle, ShoppingBag, Truck, UtensilsCrossed, AlertCircle, Timer } from 'lucide-react'
import { differenceInMinutes } from 'date-fns'
import { de } from 'date-fns/locale'
import { useEffect, useState, useMemo } from 'react'
import { calculateWaitTime } from '@/lib/utils/calculate-wait-time'

interface OrderCardProps {
  order: Order & { order_items: OrderItem[] }
  onStatusChange: (orderId: string, status: OrderStatus, customMinutes?: number) => void
  activeOrdersCount?: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-error text-white',      // RED: Hot/New
  preparing: 'bg-warning text-white',  // YELLOW: Active
  ready: 'bg-success text-white',      // GREEN: Ready to serve
  completed: 'bg-surface-container-high text-on-surface-variant opacity-60',
  cancelled: 'bg-outline text-white opacity-40',
}

const statusLabels: Record<string, string> = {
  pending: 'Neu',
  preparing: 'Wird zubereitet',
  ready: 'Abholbereit',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

const fulfillmentIcons: Record<string, React.ElementType> = {
  pickup: ShoppingBag,
  delivery: Truck,
  dine_in: UtensilsCrossed
}

const fulfillmentLabels: Record<string, string> = {
  pickup: 'Abholung',
  delivery: 'Lieferung',
  dine_in: 'Vor Ort'
}

export function OrderCard({ order, onStatusChange, activeOrdersCount = 0 }: OrderCardProps) {
  const [now, setNow] = useState(new Date())
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [customTime, setCustomTime] = useState(15)
  const [showSlider, setShowSlider] = useState(false)

  // Use the wait time utility to calculate a "base" suggestion
  const basePrepTime = useMemo(() => {
    const itemsData = order.order_items.map(item => ({
      product: { 
        preparation_time_minutes: (item as any).product?.preparation_time_minutes || 15,
        parallel_capacity: (item as any).product?.parallel_capacity || 1
      },
      quantity: item.quantity
    }))
    return calculateWaitTime(activeOrdersCount, itemsData)
  }, [order.order_items, activeOrdersCount])

  // Initialize custom time when slider is shown
  useEffect(() => {
    if (showSlider && !customTime) {
      setCustomTime(basePrepTime)
    }
  }, [showSlider, basePrepTime, customTime])

  // Force re-render every minute to keep countdowns live
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const isTargetTime = !!order.estimated_ready_at
  const targetTime = isTargetTime ? new Date(order.estimated_ready_at!) : null

  let countdownColor = 'text-on-surface-variant/60'
  let countdownText = ''
  let diffMins = 0

  if (targetTime) {
    diffMins = differenceInMinutes(targetTime, now)

    if (['completed', 'cancelled'].includes(order.status)) {
      countdownColor = 'text-on-surface-variant/40'
      countdownText = 'Abgeschlossen'
    } else if (diffMins > 10) {
      countdownColor = 'text-success'
      countdownText = `In ${diffMins} Min`
    } else if (diffMins > 4) {
      countdownColor = 'text-warning font-black'
      countdownText = `In ${diffMins} Min`
    } else if (diffMins >= 0) {
      countdownColor = 'text-error font-black scale-105'
      countdownText = `In ${diffMins} Min`
    } else {
      countdownColor = 'text-error animate-pulse font-black scale-110'
      countdownText = `Überfällig (${Math.abs(diffMins)} Min)`
    }
  }

  const FulfillmentIcon = fulfillmentIcons[order.fulfillment_type] || ShoppingBag

  return (
    <div className={`bg-white rounded-3xl border shadow-xl p-5 sm:p-8 flex flex-col h-full transition-all ${diffMins < 0 && !['completed', 'cancelled'].includes(order.status) ? 'border-error/30 shadow-error/10' : 'border-outline-variant/10 shadow-primary/5 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/10'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-8 gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-black uppercase tracking-widest shadow-sm">
              <FulfillmentIcon className="w-3.5 h-3.5" />
              {fulfillmentLabels[order.fulfillment_type]}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none mb-1 break-words">{order.customer_name}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium">{order.customer_phone}</p>
        </div>

        {targetTime && (
          <div className="text-right flex flex-col items-end shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">
              Zielzeit: {targetTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2 transition-colors">
              <div className={`flex items-center gap-2 text-xl tracking-tight ${countdownColor}`}>
                <Timer className="w-5 h-5" />
                {countdownText}
              </div>
              {order.status === 'preparing' && (
                <button 
                  onClick={() => setShowTimePicker(true)}
                  className="p-1.5 rounded-full hover:bg-primary/10 text-primary transition-colors border border-primary/10"
                  title="Zeit anpassen"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 space-y-4 mb-6 sm:mb-8">
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-xl bg-surface-container-low flex items-center justify-center text-xs font-black shrink-0">
                {item.quantity}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold leading-tight">{item.product_name}</p>
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="p-4 bg-primary/5 rounded-2xl text-xs font-bold text-primary italic leading-relaxed">
            "{order.notes}"
          </div>
        )}

        {(order.delivery_address || order.table_number) && (
          <div className="pt-4 border-t border-outline-variant/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Lieferung an</p>
            <p className="text-sm font-bold">{order.delivery_address || `Tisch ${order.table_number}`}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="relative mt-auto">
        {showTimePicker && (
          <div className="absolute inset-0 -top-40 bg-white rounded-3xl p-6 border-2 border-primary shadow-2xl flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center">
              <p className="text-xs font-black uppercase tracking-widest text-primary">Wie lange wird es dauern?</p>
              <button onClick={() => { setShowTimePicker(false); setShowSlider(false); }} className="p-1 hover:bg-surface-container-low rounded">
                <XCircle className="w-4 h-4 text-on-surface-variant/40" />
              </button>
            </div>

            {!showSlider ? (
              <div className="grid grid-cols-2 gap-2">
                {[basePrepTime, basePrepTime + 5, basePrepTime + 10, basePrepTime + 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      onStatusChange(order.id, 'preparing', mins)
                      setShowTimePicker(false)
                    }}
                    className="py-3 bg-surface-container-low hover:bg-primary hover:text-white rounded-xl text-sm font-black transition-all"
                  >
                    {mins} Min.
                  </button>
                ))}
                <button
                  onClick={() => setShowSlider(true)}
                  className="col-span-2 py-3 border-2 border-dashed border-primary/20 text-primary hover:bg-primary/5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Individuell anpassen
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-primary">{customTime}<span className="text-sm ml-1 text-primary/60">Min.</span></span>
                  <button 
                     onClick={() => {
                       onStatusChange(order.id, 'preparing', customTime)
                       setShowTimePicker(false)
                       setShowSlider(false)
                     }}
                     className="px-6 py-2 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg"
                  >
                    Übernehmen
                  </button>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={customTime}
                  onChange={(e) => setCustomTime(parseInt(e.target.value))}
                  className="w-full accent-primary h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer"
                />
                <button 
                  onClick={() => setShowSlider(false)}
                  className="w-full text-[10px] font-black uppercase text-on-surface-variant/40 transition-colors hover:text-primary"
                >
                  Zurück zu Vorschlägen
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {order.status === 'pending' && (
            <button 
              onClick={() => setShowTimePicker(true)}
              className="col-span-2 py-5 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Zubereitung Starten
            </button>
          )}

          {order.status === 'preparing' && (
            <button 
              onClick={() => onStatusChange(order.id, 'ready')}
              className="col-span-2 py-5 bg-success text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Fertigstellen
            </button>
          )}

          {order.status === 'ready' && (
            <button 
              onClick={() => onStatusChange(order.id, 'completed')}
              className="col-span-2 py-5 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <Check className="w-5 h-5" />
              Abgeschlossen
            </button>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button 
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="col-span-2 mt-2 py-4 text-on-surface-variant/40 rounded-full font-bold text-[10px] uppercase tracking-widest hover:text-error hover:bg-error/5 transition-all"
            >
              Bestellung stornieren
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
