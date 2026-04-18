'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, use, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatWaitTime } from '@/lib/utils/calculate-wait-time'
import { CheckCircle2, ChevronRight, Clock, MapPin, Phone, ChefHat, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Order, OrderItem, Shop } from '@/types/database'
import { useTranslation } from '@/lib/i18n/useTranslation'

type OrderWithDetails = Order & { shops: Shop; order_items: OrderItem[] }

export default function ConfirmationPage({ params }: { params: Promise<{ 'shop-slug': string; 'order-id': string }> }) {
  const { 'shop-slug': rawSlug, 'order-id': orderId } = use(params)
  const slug = decodeURIComponent(rawSlug)
  
  const supabase = createClient()
  const { t } = useTranslation()
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    // Validate if orderId is a UUID to avoid Supabase errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(orderId)) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, shops(*), order_items(*)')
      .eq('id', orderId)
      .maybeSingle()
    
    if (data) {
      setOrder(data as OrderWithDetails)
    }
    setLoading(false)
  }, [orderId, supabase])

  useEffect(() => {
    fetchOrder()

    // Realtime subscription
    // We listen to all changes on the orders table and filter on the client
    // This is more robust than server-side filters for specific environments
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          // Check if the updated order is the one we are interested in
          if (payload.new && (payload.new as any).id === orderId) {
            console.log('Order update received via Realtime, refetching...', payload.new)
            await fetchOrder()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: Subscribed to order updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, fetchOrder])

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-center">
      <div className="w-20 h-20 bg-surface-container-low rounded-[2rem] flex items-center justify-center mx-auto mb-8">
        <ChefHat className="w-10 h-10 text-on-surface-variant/20" />
      </div>
      <h1 className="text-3xl font-black tracking-tight mb-4">Bestellung nicht gefunden</h1>
      <p className="text-on-surface-variant font-medium mb-12">Entschuldigung, wir konnten die Details zu dieser Bestellung nicht abrufen.</p>
      <Link 
        href={`/${slug}`} 
        className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-sm hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-primary/20"
      >
        Zurück zum Shop
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )

  const waitTime = Math.max(10, Math.round((new Date(order.estimated_ready_at || '').getTime() - new Date(order.created_at).getTime()) / 60000))

  const getStatusInfo = (status: string) => {
    switch (status) {
        case 'preparing': return { label: t('preparing'), color: 'bg-warning/20 text-white' }
        case 'ready': 
          return { 
            label: order.fulfillment_type === 'delivery' ? t('delivery_on_way') : t('ready'), 
            color: 'bg-success/20 text-white' 
          }
        case 'completed': return { label: t('completed'), color: 'bg-white/20 text-white' }
        case 'cancelled': return { label: t('cancelled'), color: 'bg-error/20 text-white' }
        default: return { label: 'Wartet auf Bestätigung', color: 'bg-white/20 text-white' }
    }
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">Vielen Dank!</h1>
        <p className="text-lg text-on-surface-variant font-medium">Deine Bestellung wurde erfolgreich aufgegeben.</p>
      </div>

      <div className="space-y-6">
        {/* Order Status Card */}
        <div className={`rounded-3xl p-8 shadow-xl shadow-primary/15 relative overflow-hidden transition-colors duration-500 ${order.status === 'cancelled' ? 'bg-error text-white' : 'bg-primary text-on-primary'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ChefHat className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Status</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.color} backdrop-blur-sm border border-white/10`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-white ${['pending', 'preparing'].includes(order.status) ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-black uppercase tracking-tight">{statusInfo.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Bestellnummer</p>
                <p className="text-xl font-black">#{order.order_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">Wartezeit</p>
                  <p className="text-base font-bold">
                    {order.status === 'pending' ? 'Warten auf Bestätigung...' : formatWaitTime(waitTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">Fulfillment</p>
                  <p className="text-base font-bold">
                    {order.fulfillment_type === 'pickup' ? 'Abholung' : order.fulfillment_type === 'delivery' ? 'Lieferung' : 'Dine-In'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Info & Items */}
        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Bestellung bei {order.shops.name}</h3>
            
            <div className="space-y-4">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-surface-container-low flex items-center justify-center text-xs font-bold">
                      {item.quantity}×
                    </div>
                    <span className="text-sm font-semibold">{item.product_name}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-outline-variant/5 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Zwischensumme</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Liefergebühr</span>
                  <span className="font-semibold">{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">Gesamtbetrag</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-surface-container-low/30 space-y-6">
            {order.fulfillment_type !== 'delivery' && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-outline-variant/10">
                  <MapPin className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Abholort</p>
                  <p className="text-sm font-semibold">{order.shops.address || 'Im Restaurant vor Ort'}</p>
                </div>
              </div>
            )}
            {order.shops.phone && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-outline-variant/10">
                  <Phone className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Rückfragen</p>
                  <a href={`tel:${order.shops.phone}`} className="text-sm font-semibold hover:text-primary transition-colors">{order.shops.phone}</a>
                </div>
              </div>
            )}
          </div>
        </div>

        <Link 
          href={`/${slug}`} 
          className="w-full py-5 bg-surface-container-lowest border border-outline-variant/15 text-on-surface rounded-full font-bold text-sm flex items-center justify-center gap-3 hover:bg-surface-container-low transition-all"
        >
          Zurück zur Speisekarte
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
