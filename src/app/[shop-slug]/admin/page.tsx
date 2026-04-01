'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/types/database'
import { OrderCard } from '@/components/admin/OrderCard'
import { playNewOrderSound } from '@/lib/utils/audio'
import { Loader2, ChefHat, BellOff, Bell, Clock, CalendarClock, CheckCircle } from 'lucide-react'

type OrderWithItems = Order & { order_items: OrderItem[] }
type TabFilter = 'current' | 'future' | 'completed'

export default function KitchenDashboard({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const soundEnabledRef = useRef(soundEnabled)
  
  const [activeTab, setActiveTab] = useState<TabFilter>('current')
  const [prepLeadTime, setPrepLeadTime] = useState(60)
  const [timeTick, setTimeTick] = useState(0)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Refreshes the tabs automatically every 60 seconds
  useEffect(() => {
    const int = setInterval(() => setTimeTick(t => t + 1), 60000)
    return () => clearInterval(int)
  }, [])

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
        .select('id, prep_lead_time_minutes')
        .eq('slug', shopSlug)
        .single()
      
      if (!shop) return
      setPrepLeadTime(shop.prep_lead_time_minutes)

      const todayStr = new Date().toISOString().split('T')[0]
      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .gte('created_at', todayStr + 'T00:00:00Z')
        .neq('status', 'cancelled')
        .order('estimated_ready_at', { ascending: true })
      
      const validOrders = (initialOrders as OrderWithItems[] || []).filter(o => o.total > 0)
      setOrders(validOrders)
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
                
                if (newOrder && newOrder.total > 0) {
                  setOrders(prev => [...prev, newOrder as OrderWithItems])
                  if (soundEnabledRef.current) playNewOrderSound()
                }
              } else if (payload.eventType === 'UPDATE') {
                const updatedOrder = payload.new as Order
                if (updatedOrder.status === 'cancelled') {
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
      if (status === 'cancelled') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      }
    }
  }, [supabase])

  const now = new Date()
  const cutoffTime = new Date(now.getTime() + prepLeadTime * 60000)

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'completed') return o.status === 'completed'
    
    // Status is active for current/future
    if (o.status === 'completed' || o.status === 'cancelled') return false

    if (!o.estimated_ready_at) return activeTab === 'current'
    
    const readyAt = new Date(o.estimated_ready_at)
    
    if (activeTab === 'current') {
      return readyAt <= cutoffTime
    } else {
      return readyAt > cutoffTime
    }
  }).sort((a, b) => {
    if (activeTab === 'completed') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() // newest completed first
    }
    return new Date(a.estimated_ready_at || a.created_at).getTime() - new Date(b.estimated_ready_at || b.created_at).getTime() // soonest target first
  })

  // Tab counts
  const currentCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && (!o.estimated_ready_at || new Date(o.estimated_ready_at) <= cutoffTime)).length
  const futureCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && (o.estimated_ready_at && new Date(o.estimated_ready_at) > cutoffTime)).length
  const completedCount = orders.filter(o => o.status === 'completed').length

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-10 space-y-8">
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-outline-variant/10 pb-4">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === 'current' 
              ? 'bg-primary text-on-primary' 
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aktuell (Bis {prepLeadTime} Min)
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'current' ? 'bg-black/20' : 'bg-black/5'}`}>
            {currentCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('future')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === 'future' 
              ? 'bg-secondary text-on-secondary' 
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Geplant
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'future' ? 'bg-black/20' : 'bg-black/5'}`}>
            {futureCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === 'completed' 
              ? 'bg-success text-on-primary' 
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Abgeschlossen
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'completed' ? 'bg-black/20' : 'bg-black/5'}`}>
            {completedCount}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-surface-container-low rounded-[2rem] flex items-center justify-center mb-6">
              <ChefHat className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h2 className="text-2xl font-black mb-2">Keine Bestellungen in diesem Reiter</h2>
          </div>
        ) : (
          filteredOrders.map(order => (
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
