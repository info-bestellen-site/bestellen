'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shop, Table, OpeningHour, Order } from '@/types/database'
import { getAvailableReservationSlots } from '@/lib/utils/open-hours'
import { Loader2, Users, Calendar, Clock, CheckCircle2, ChevronLeft, Store } from 'lucide-react'
import Link from 'next/link'

interface ReservePageProps {
  params: Promise<{ 'shop-slug': string }>
}

export default function ReservePage({ params }: ReservePageProps) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()

  const [shop, setShop] = useState<Shop | null>(null)
  const [hours, setHours] = useState<OpeningHour[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [existingOrders, setExistingOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [guestCount, setGuestCount] = useState(2)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: shopData } = await supabase.from('shops').select('*').eq('slug', shopSlug).single()
      if (!shopData) return
      setShop(shopData)

      const [hoursRes, tablesRes, ordersRes] = await Promise.all([
        supabase.from('opening_hours').select('*').eq('shop_id', shopData.id),
        supabase.from('tables').select('*').eq('shop_id', shopData.id),
        supabase.from('orders').select('*').eq('shop_id', shopData.id).eq('fulfillment_type', 'dine_in')
      ])

      if (hoursRes.data) setHours(hoursRes.data)
      if (tablesRes.data) setTables(tablesRes.data)
      if (ordersRes.data) setExistingOrders(ordersRes.data)
      
      setLoading(false)
    }
    init()
  }, [shopSlug, supabase])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 flex-shrink-0 text-primary animate-spin" />
    </div>
  )

  if (!shop) return <div>Shop nicht gefunden</div>

  const availableSlots = getAvailableReservationSlots(hours, tables, existingOrders, guestCount)

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !name || !phone) return

    setIsSubmitting(true)

    const targetDate = new Date()
    const [h, m] = selectedSlot.split(':')
    targetDate.setHours(parseInt(h), parseInt(m), 0, 0)

    const orderPayload = {
      shop_id: shop.id,
      customer_name: name,
      customer_phone: phone,
      fulfillment_type: 'dine_in' as const,
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
      status: 'pending' as const,
      estimated_ready_at: targetDate.toISOString(),
      guest_count: guestCount,
      notes: 'Online Tischreservierung (Ohne Speisen)'
    }

    const { error } = await supabase.from('orders').insert(orderPayload)
    if (!error) {
      setSuccess(true)
    } else {
      alert('Reservierung fehlgeschlagen. Bitte rufen Sie uns an.')
    }
    setIsSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease_infinite]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Tisch reserviert!</h1>
        <p className="text-lg text-on-surface-variant max-w-md mx-auto mb-10">
          Wir haben Ihren Tisch für {guestCount} Personen um {selectedSlot} Uhr unter dem Namen "{name}" verbucht.
        </p>
        <Link 
          href={`/${shop.slug}`}
          className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          Zurück zur Speisekarte
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header */}
      <div className="bg-surface-container-low pt-20 pb-12 px-6 rounded-b-[3rem] mb-10 shadow-sm border-b border-outline-variant/10">
        <div className="max-w-2xl mx-auto text-center">
          <Link href={`/${shop.slug}`} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold uppercase mb-6 bg-white px-4 py-2 rounded-full shadow-sm">
            <ChevronLeft className="w-4 h-4" /> Zurück Menu
          </Link>
          <div className="w-16 h-16 bg-primary rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6 rotate-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">Tisch reservieren</h1>
          <p className="text-lg text-on-surface-variant font-medium">Buchen Sie Ihren Tisch bei {shop.name} in Sekunden.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6">
        <form onSubmit={handleReserve} className="space-y-10">
          
          {/* Step 1: Guest Count */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/10">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">1</span> 
              Wie viele Personen?
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => { setGuestCount(num); setSelectedSlot(null); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    guestCount === num 
                      ? 'border-primary bg-primary/5 text-primary scale-105' 
                      : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-black">{num}</span>
                </button>
              ))}
            </div>
            {guestCount > 10 && (
              <p className="text-xs text-on-surface-variant mt-2 text-center bg-surface-container-low p-3 rounded-xl">
                Für Reservierungen über 10 Personen, rufen Sie uns bitte an.
              </p>
            )}
          </div>

          {/* Step 2: Time Selection */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/10">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">2</span> 
              Wann möchten Sie kommen?
            </h2>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3.5 rounded-2xl text-sm font-black border-2 transition-all ${
                      selectedSlot === slot 
                        ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface hover:border-primary/30'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-error/10 text-error rounded-2xl text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold">Keine freien Tische für {guestCount} Personen mehr verfügbar heute.</p>
              </div>
            )}
          </div>

          {/* Step 3: Contact */}
          <div className={`transition-all duration-300 ${selectedSlot ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/10">
              <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">3</span> 
                Ihre Daten
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Vollständiger Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-surface-container-lowest focus:bg-white border-2 border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl font-bold transition-all placeholder:font-medium placeholder:text-on-surface-variant/40" placeholder="Max Mustermann" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Telefonnummer (Für Rückfragen)</label>
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-5 py-4 bg-surface-container-lowest focus:bg-white border-2 border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl font-bold transition-all placeholder:font-medium placeholder:text-on-surface-variant/40" placeholder="0171 1234567" />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <button 
                  disabled={isSubmitting || !selectedSlot} 
                  type="submit" 
                  className="w-full py-5 bg-on-surface text-surface disabled:bg-surface-container-high disabled:text-on-surface-variant/50 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl disabled:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                  Tisch kostenfrei reservieren
                </button>
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  )
}
