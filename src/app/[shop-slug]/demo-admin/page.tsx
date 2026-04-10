'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/types/database'
import { OrderCard } from '@/components/admin/OrderCard'
import { playNewOrderSound } from '@/lib/utils/audio'
import { Loader2, ChefHat, BellOff, Bell, Play, CheckCircle2, CheckCircle, Info } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { notFound } from 'next/navigation'

type OrderWithItems = Order & { order_items: OrderItem[] }
type TabFilter = 'all' | 'unprocessed' | 'preparing' | 'ready' | 'completed'

export default function DemoKitchenDashboard({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)

  // STRICT WHITELIST: Only allow sakura-sushi
  if (shopSlug !== 'sakura-sushi') {
    notFound()
  }

  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)

  useEffect(() => {
    const saved = localStorage.getItem('demo-kitchen-sound-enabled')
    if (saved !== null) {
      setSoundEnabled(saved === 'true')
    }
  }, [])
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const { t } = useTranslation()

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
    localStorage.setItem('demo-kitchen-sound-enabled', soundEnabled.toString())
  }, [soundEnabled])

  // Realtime logic (Public Access for Demo)
  useEffect(() => {
    const channelRef = { current: null as any }
    async function init() {
      // 1. Get shop by slug
      const { data: shop } = await supabase.from('shops').select('id').eq('slug', shopSlug).single()
      if (!shop) return

      // 2. Fetch initial orders
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .gte('created_at', todayStr + 'T00:00:00Z')
        .neq('status', 'cancelled')
        .order('estimated_ready_at', { ascending: true })

      setOrders((initialOrders as OrderWithItems[] || []).filter(o => o.total > 0))
      setLoading(false)

      // 3. Subscribe to realtime updates
      const channelName = `demo-shop-orders-${shop.id}`
      const channel = supabase.channel(channelName)
      channelRef.current = channel

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` },
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
          })
        .subscribe()
    }
    init()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [shopSlug, supabase])

  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus, customMinutes?: number) => {
    const updateData: any = { status }
    if (customMinutes !== undefined) {
      updateData.estimated_ready_at = new Date(Date.now() + customMinutes * 60000).toISOString()
    }
    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
    if (error) {
      console.error('Demo update error:', error)
    } else {
      setOrders(prev => (status === 'cancelled'
        ? prev.filter(o => o.id !== orderId)
        : prev.map(o => o.id === orderId ? { ...o, ...updateData } : o)
      ))
    }
  }, [supabase])

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return o.status !== 'completed'
    return o.status === activeTab
  })

  return (
    <div className="h-full bg-white flex flex-col p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-black">{t('kitchen_monitor')}</h1>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-tighter">Demo-Modus</span>
          </div>
          <p className="text-xs text-on-surface-variant">Hier kommen deine Bestellungen live an.</p>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
          {soundEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-on-surface-variant" />}
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {['all', 'unprocessed', 'preparing', 'ready', 'completed'].map(tid => (
          <button 
            key={tid} 
            onClick={() => setActiveTab(tid as TabFilter)} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tid ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
          >
            {tid === 'all' && 'Alle'}
            {tid === 'unprocessed' && 'Neu'}
            {tid === 'preparing' && 'In Zubereitung'}
            {tid === 'ready' && 'Abholbereit'}
            {tid === 'completed' && 'Abgeschlossen'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <ChefHat className="w-12 h-12 text-on-surface-variant/20 mb-4" />
            <p className="text-sm font-bold text-on-surface-variant">Bestelle etwas im Shop-Fenster!</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} activeOrdersCount={1} />
          ))
        )}
      </div>

      <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-[10px] leading-relaxed text-primary/80 font-medium">
          In der Demo kannst du Bestellungen annehmen und abschließen, um den Workflow zu testen. <br />
          <strong>Hinweis:</strong> Dies ist eine öffentliche Demo. Andere Nutzer können deine Test-Order ebenfalls sehen.
        </p>
      </div>
    </div>
  )
}
