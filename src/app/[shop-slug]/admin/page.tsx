'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/types/database'
import { OrderCard } from '@/components/admin/OrderCard'
import { playNewOrderSound } from '@/lib/utils/audio'
import { Loader2, ChefHat, BellOff, Bell } from 'lucide-react'

type OrderWithItems = Order & { order_items: OrderItem[] }

export default function KitchenDashboard({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const soundEnabledRef = useRef(soundEnabled)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    const channelRef = { current: null as any }
    let isSubscribing = false

    async function init() {
      if (isSubscribing) return
      isSubscribing = true
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .single()
      
      if (!shop) return

      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true })
      
      setOrders(initialOrders as OrderWithItems[] || [])
      setLoading(false)

      const channelName = `shop-orders-${shop.id}`
      
      // Remove any existing channel with this name to prevent double-subscribe errors in React Strict Mode
      supabase.getChannels().forEach(c => {
        if (c.topic === `realtime:${channelName}`) {
          supabase.removeChannel(c)
        }
      })

      const channel = supabase.channel(channelName)
      channelRef.current = channel

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `shop_id=eq.${shop.id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
                const { data: newOrder } = await supabase
                  .from('orders')
                  .select('*, order_items(*)')
                  .eq('id', payload.new.id)
                  .single()
                
                if (newOrder) {
                  setOrders(prev => [...prev, newOrder as OrderWithItems])
                  if (soundEnabledRef.current) playNewOrderSound()
                }
              } else if (payload.eventType === 'UPDATE') {
                const updatedOrder = payload.new as Order
                if (['completed', 'cancelled'].includes(updatedOrder.status)) {
                  setOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
                } else {
                  setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
                }
              }
            }
          )
          .subscribe()
    }
    init()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [shopSlug, supabase])

  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    
    if (error) {
      alert('Status konnte nicht geändert werden.')
    } else {
      if (['completed', 'cancelled'].includes(status)) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      }
    }
  }, [supabase])

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Küchen-Monitor</h1>
          <p className="text-lg text-on-surface-variant font-medium">Aktive Bestellungen in Echtzeit verwalten.</p>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            soundEnabled 
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/10' 
              : 'bg-surface-container-low text-on-surface-variant ring-1 ring-inset ring-outline-variant/10'
          }`}
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {soundEnabled ? 'Ton Aktiv' : 'Ton Aus'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {orders.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-surface-container-low rounded-[2rem] flex items-center justify-center mb-6">
              <ChefHat className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h2 className="text-2xl font-black mb-2">Keine aktiven Bestellungen</h2>
            <p className="text-on-surface-variant text-sm font-medium">Neue Bestellungen erscheinen hier automatisch.</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onStatusChange={handleStatusChange} 
            />
          ))
        )}
      </div>
    </div>
  )
}
