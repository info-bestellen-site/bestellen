'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/types/database'
import { OrderCard } from '@/components/admin/OrderCard'
import { playNewOrderSound } from '@/lib/utils/audio'
import { Loader2, ChefHat, BellOff, Bell, Clock, CalendarClock, CheckCircle, Play, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

type OrderWithItems = Order & { order_items: OrderItem[] }
type TabFilter = 'all' | 'unprocessed' | 'preparing' | 'ready' | 'completed'

export default function KitchenDashboard({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)

  useEffect(() => {
    const saved = localStorage.getItem('kitchen-sound-enabled')
    if (saved !== null) {
      setSoundEnabled(saved === 'true')
    }
  }, [])

  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [timeTick, setTimeTick] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
    localStorage.setItem('kitchen-sound-enabled', soundEnabled.toString())
  }, [soundEnabled])

  // Refreshes the tabs automatically every 60 seconds
  useEffect(() => {
    const int = setInterval(() => setTimeTick(t => t + 1), 60000)
    return () => clearInterval(int)
  }, [])

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

  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus, customMinutes?: number) => {
    const updateData: any = { status }
    
    if (customMinutes !== undefined) {
      updateData.estimated_ready_at = new Date(Date.now() + customMinutes * 60000).toISOString()
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      alert(t('status_update_failed'))
    } else {
      if (status === 'cancelled') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o))
      }
    }
  }, [supabase, t])

  const now = new Date()

  // Improved filtering logic
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return o.status !== 'completed'
    if (activeTab === 'unprocessed') return o.status === 'pending'
    if (activeTab === 'preparing') return o.status === 'preparing'
    if (activeTab === 'ready') return o.status === 'ready'
    if (activeTab === 'completed') return o.status === 'completed'
    return false
  }).sort((a, b) => {
    if (activeTab === 'completed') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
    // Newest first (highest timestamp to lowest)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Tab counts
  const counts = {
    all: orders.filter(o => o.status !== 'completed').length,
    unprocessed: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  const tabs: { id: TabFilter, label: string, icon: any, color?: string }[] = [
    { id: 'all', label: t('filter_all'), icon: ChefHat },
    { id: 'unprocessed', label: t('filter_unprocessed'), icon: Bell, color: 'bg-error text-white' },
    { id: 'preparing', label: t('filter_preparing'), icon: Play, color: 'bg-warning text-white' },
    { id: 'ready', label: t('filter_ready'), icon: CheckCircle2, color: 'bg-success text-white' },
    { id: 'completed', label: t('filter_completed'), icon: CheckCircle },
  ]

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">{t('kitchen_monitor')}</h1>
          <p className="text-sm sm:text-lg text-on-surface-variant font-medium">{t('kitchen_subtitle')}</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${soundEnabled
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/10'
              : 'bg-surface-container-low text-on-surface-variant ring-1 ring-inset ring-outline-variant/10 whitespace-nowrap'
            }`}
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {soundEnabled ? t('sound_on') : t('sound_off')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-outline-variant/10 pb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? (tab.color || 'bg-primary text-on-primary shadow-lg shadow-primary/20')
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-black/20' : 'bg-black/5'}`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-surface-container-low rounded-[2rem] flex items-center justify-center mb-6">
              <ChefHat className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h2 className="text-2xl font-black mb-2">{t('no_orders_in_tab')}</h2>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              activeOrdersCount={orders.filter(o => ['pending', 'preparing'].includes(o.status)).length}
            />
          ))
        )}
      </div>
    </div>
  )
}
