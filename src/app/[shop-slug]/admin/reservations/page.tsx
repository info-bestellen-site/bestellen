'use client'

import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Loader2, User, Phone, Users, Clock, Plus, MonitorCheck, Save, UtensilsCrossed } from 'lucide-react'
import { useState, useEffect, use } from 'react'
import { Shop, Order, OrderStatus } from '@/types/database'
import Link from 'next/link'

interface ReservationPageProps {
  params: Promise<{ 'shop-slug': string }>
}

export default function ReservationsPage({ params }: ReservationPageProps) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Order[]>([])
  
  // Manual Reservation Form State
  const [showForm, setShowForm] = useState(false)
  const [newResGuestCount, setNewResGuestCount] = useState(2)
  const [newResName, setNewResName] = useState('')
  const [newResTime, setNewResTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', shopSlug)
        .single()
      
      if (shopData) {
        setShop(shopData)
        await loadReservations(shopData.id)
      }
      setLoading(false)
    }

    init()
  }, [shopSlug, supabase])

  const loadReservations = async (shopId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .eq('fulfillment_type', 'dine_in')
      .gte('estimated_ready_at', today.toISOString())
      .order('estimated_ready_at', { ascending: true })

    if (data) {
      setReservations(data)
    }
  }

  const handleCreateManualReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop || !newResTime || !newResName) return

    setIsSubmitting(true)
    
    const today = new Date()
    const [hours, minutes] = newResTime.split(':')
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    const { error } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        customer_name: newResName,
        customer_phone: 'Manuell',
        fulfillment_type: 'dine_in',
        subtotal: 0,
        delivery_fee: 0,
        total: 0,
        notes: 'Manuelle Reservierung (System)',
        estimated_ready_at: today.toISOString(),
        guest_count: newResGuestCount,
        status: 'pending' // pending keeps it active
      })

    if (!error) {
      setShowForm(false)
      setNewResName('')
      setNewResTime('')
      setNewResGuestCount(2)
      await loadReservations(shop.id)
    } else {
      alert('Fehler beim Speichern der Reservierung.')
    }
    
    setIsSubmitting(false)
  }

  const updateReservationStatus = async (id: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
      
    if (!error) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  const activeReservations = reservations.filter(r => ['pending', 'preparing', 'ready'].includes(r.status))
  const completedReservations = reservations.filter(r => ['completed', 'cancelled'].includes(r.status))

  return (
    <div className="p-4 sm:p-10 space-y-8 sm:space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">Reservierungen</h1>
          <p className="text-sm sm:text-lg text-on-surface-variant font-medium">Tische, Gäste und Laufkundschaft verwalten.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-on-primary rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 w-full sm:w-auto"
        >
          {showForm ? 'Schließen' : <><Plus className="w-5 h-5" /> Reservierung</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateManualReservation} className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm animate-[fadeIn_0.3s_ease] space-y-6 mb-10">
          <h2 className="text-xl font-bold">Manuelle Reservierung eintragen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Name</label>
              <input required type="text" value={newResName} onChange={e => setNewResName(e.target.value)} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm" placeholder="z.B. Müller" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Uhrzeit (HH:MM)</label>
              <input required type="time" value={newResTime} onChange={e => setNewResTime(e.target.value)} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Personen</label>
              <input required type="number" min="1" value={newResGuestCount} onChange={e => setNewResGuestCount(parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-black text-primary shadow-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-on-surface text-surface rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-on-surface/90 transition-all">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Reservieren
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Aktive & Kommende Gäste ({activeReservations.length})
        </h2>
        
        {activeReservations.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-[2rem] text-center">
            <CalendarDays className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-on-surface-variant mb-1">Keine anstehenden Reservierungen</h3>
            <p className="text-sm text-on-surface-variant/60">Aktuell ist nichts für heute geplant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeReservations.map(res => {
              const resTime = new Date(res.estimated_ready_at!).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              const isManual = res.customer_phone === 'Manuell'
              const hasOrderItems = res.total > 0

              return (
                <div key={res.id} className="bg-white rounded-[2rem] p-6 border border-outline-variant/10 shadow-lg shadow-primary/5 transition-all hover:shadow-primary/10 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xl">
                        {resTime}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{res.customer_name}</h3>
                        <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1 mt-0.5">
                          {isManual ? <User className="w-3 h-3" /> : <MonitorCheck className="w-3 h-3" />}
                          {isManual ? 'Manuelle Buchung' : 'Online Reservierung'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                    <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Gäste</span>
                        <span className="font-black leading-none">{res.guest_count}</span>
                      </div>
                    </div>
                    {hasOrderItems && (
                      <div className="bg-success/10 text-success p-3 rounded-xl flex items-center gap-3">
                        <UtensilsCrossed className="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Bestellung</span>
                          <span className="font-black leading-none">Mit Essen</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'completed')}
                      className="flex-1 px-4 py-3 bg-success/10 text-success hover:bg-success hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Angenommen / Fertig
                    </button>
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'cancelled')}
                      className="px-4 py-3 bg-surface-container-high text-on-surface-variant hover:bg-error hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Storno
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
