'use client'

import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Loader2, User, Phone, Users, Clock, Plus, MonitorCheck, Save, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, use } from 'react'
import { Shop, Order, OrderStatus, Table } from '@/types/database'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Modal } from '@/components/ui/Modal'

interface ReservationPageProps {
  params: Promise<{ 'shop-slug': string }>
}

export default function ReservationsPage({ params }: ReservationPageProps) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Manual Reservation Form State
  const [showForm, setShowForm] = useState(false)
  const [newResGuestCount, setNewResGuestCount] = useState(2)
  const [newResName, setNewResName] = useState('')
  const [newResTime, setNewResTime] = useState('')
  const [newResDate, setNewResDate] = useState(new Date().toISOString().split('T')[0])
  const [newResTableId, setNewResTableId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    async function init() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', shopSlug)
        .single()
      
      if (shopData) {
        setShop(shopData)
        await Promise.all([
          loadReservations(shopData.id, selectedDate),
          loadTables(shopData.id)
        ])
      }
      setLoading(false)
    }

    init()
  }, [shopSlug, supabase, selectedDate])

  const loadTables = async (shopId: string) => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('shop_id', shopId)
      .order('name')
    if (data) setTables(data)
  }

  const loadReservations = async (shopId: string, date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .eq('fulfillment_type', 'dine_in')
      .gte('estimated_ready_at', startOfDay.toISOString())
      .lte('estimated_ready_at', endOfDay.toISOString())
      .order('estimated_ready_at', { ascending: true })

    if (data) {
      setReservations(data)
    }
  }

  const handleCreateManualReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop || !newResTime || !newResName || !newResDate) return

    setIsSubmitting(true)
    
    const targetDate = new Date(newResDate)
    const [hours, minutes] = newResTime.split(':')
    targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
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
        estimated_ready_at: targetDate.toISOString(),
        guest_count: newResGuestCount,
        table_id: newResTableId || null,
        status: 'pending'
      })

    if (!error) {
      setShowForm(false)
      setNewResName('')
      setNewResTime('')
      setNewResGuestCount(2)
      setNewResTableId('')
      await loadReservations(shop.id, selectedDate)
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

  const updateReservationTable = async (id: string, tableId: string | null) => {
    const { error } = await supabase
      .from('orders')
      .update({ table_id: tableId })
      .eq('id', id)
      
    if (!error) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, table_id: tableId } : r))
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
        <div className="flex-1">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">{t('reservations')}</h1>
          <p className="text-sm sm:text-lg text-on-surface-variant font-medium mb-6">{t('reservations_subtitle')}</p>
          
          <div className="inline-flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/10">
            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(d)
              }}
              className="p-2 hover:bg-surface-container-high rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <input 
                type="date" 
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="bg-transparent border-none font-black text-sm p-0 focus:ring-0 cursor-pointer"
              />
            </div>
            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() + 1)
                setSelectedDate(d)
              }}
              className="p-2 hover:bg-surface-container-high rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-on-primary rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 w-full sm:w-auto"
        >
          {showForm ? t('cancel') : <><Plus className="w-5 h-5" /> {t('add_reservation')}</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateManualReservation} className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm animate-[fadeIn_0.3s_ease] space-y-6 mb-10">
          <h2 className="text-xl font-bold">{t('manual_reservation_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">{t('name')}</label>
              <input required type="text" value={newResName} onChange={e => setNewResName(e.target.value)} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm" placeholder="z.B. Müller" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">{t('date')}</label>
              <input required type="date" value={newResDate} onChange={e => setNewResDate(e.target.value)} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">{t('time')} (HH:MM)</label>
              <input required type="time" value={newResTime} onChange={e => setNewResTime(e.target.value)} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">{t('persons')}</label>
              <input required type="number" min="1" value={newResGuestCount} onChange={e => setNewResGuestCount(parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-black text-primary shadow-sm" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">{t('assign_table')}</label>
              <select 
                value={newResTableId} 
                onChange={e => setNewResTableId(e.target.value)}
                className="w-full px-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary/20 rounded-xl font-medium shadow-sm appearance-none"
              >
                <option value="">-- {t('unassigned')} --</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>{table.name} ({table.capacity} {t('guests')})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-on-surface text-surface rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-on-surface/90 transition-all">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('reserve_button')}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t('active_guests')} ({activeReservations.length})
        </h2>
        
        {activeReservations.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-[2rem] text-center">
            <CalendarDays className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-on-surface-variant mb-1">{t('no_reservations')}</h3>
            <p className="text-sm text-on-surface-variant/60">{t('no_reservations_subtitle')}</p>
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
                          {isManual ? t('manual_booking') : t('online_reservation')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Gäste</span>
                          <span className="font-black leading-none">{res.guest_count}</span>
                        </div>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-xl flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('date')}</span>
                          <span className="font-black leading-none text-[10px]">
                            {new Date(res.estimated_ready_at!).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UtensilsCrossed className="w-5 h-5 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('table')}</span>
                            <span className="font-black leading-none">
                              {tables.find(t => t.id === res.table_id)?.name || t('unassigned')}
                            </span>
                          </div>
                        </div>
                        <select 
                          value={res.table_id || ''} 
                          onChange={(e) => updateReservationTable(res.id, e.target.value || null)}
                          className="text-[10px] font-bold bg-white border-outline-variant/10 rounded-lg px-2 py-1 focus:ring-primary/20"
                        >
                          <option value="">-- {t('assign_table')} --</option>
                          {tables.map(table => (
                            <option key={table.id} value={table.id}>{table.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'completed')}
                      className="flex-1 px-4 py-3 bg-success/10 text-success hover:bg-success hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      {t('accepted_done')}
                    </button>
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'cancelled')}
                      className="px-4 py-3 bg-surface-container-high text-on-surface-variant hover:bg-error hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      {t('cancel')}
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
