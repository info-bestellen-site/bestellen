import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatWaitTime } from '@/lib/utils/calculate-wait-time'
import { CheckCircle2, ChevronRight, Clock, MapPin, Phone, ChefHat } from 'lucide-react'
import Link from 'next/link'

interface ConfirmationPageProps {
  params: Promise<{ 'shop-slug': string; 'order-id': string }>
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { 'shop-slug': slug, 'order-id': orderId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, shops(*), order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  const waitTime = Math.max(10, Math.round((new Date(order.estimated_ready_at || '').getTime() - new Date(order.created_at).getTime()) / 60000))

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
        <div className="bg-primary text-on-primary rounded-3xl p-8 shadow-xl shadow-primary/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ChefHat className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-bold">Wartet auf Bestätigung</span>
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
                  <p className="text-base font-bold">{formatWaitTime(waitTime)}</p>
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
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-outline-variant/10">
                <MapPin className="w-4 h-4 text-on-surface-variant" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Abholort</p>
                <p className="text-sm font-semibold">{order.shops.address || 'Im Restaurant vor Ort'}</p>
              </div>
            </div>
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
