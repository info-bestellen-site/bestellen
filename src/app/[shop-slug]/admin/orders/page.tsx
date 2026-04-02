'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Search, Filter, CalendarIcon, ChevronDown, Download, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type OrderWithItems = Order & { order_items: OrderItem[] }

export default function OrderHistoryPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadHistory() {
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .single()
      
      if (!shop) return
      setShopId(shop.id)

      const { data: historyOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .in('status', ['completed', 'cancelled']) // Only finalized orders in history usually, or all? Let's show all
        .order('created_at', { ascending: false })
      
      setOrders(historyOrders as OrderWithItems[] || [])
      setLoading(false)
    }
    
    loadHistory()
  }, [shopSlug, supabase])

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      o.customer_name.toLowerCase().includes(searchLower) ||
      o.order_number.toString().includes(searchLower) ||
      o.id.toLowerCase().includes(searchLower)
    return matchesStatus && matchesSearch
  })

  // Basic CSV export logic (just for current view for now, or all)
  const downloadCSV = () => {
    if (!filteredOrders.length) return alert('Keine Daten zum Exportieren.')
    
    const headers = ['Datum', 'Bestellnummer', 'Kunde', 'Art', 'Status', 'Summe (€)']
    const csvContent = [
      headers.join(';'),
      ...filteredOrders.map(o => {
        return [
          format(new Date(o.created_at), 'dd.MM.yyyy HH:mm'),
          o.order_number,
          `"${o.customer_name}"`,
          o.fulfillment_type === 'delivery' ? 'Lieferung' : (o.fulfillment_type === 'pickup' ? 'Abholung' : 'Im Lokal'),
          o.status === 'completed' ? 'Abgeschlossen' : o.status,
          o.total.toFixed(2).replace('.', ',')
        ].join(';')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bestellungen_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-on-surface mb-2">Historie</h1>
          <p className="text-sm sm:text-base text-on-surface-variant font-medium">Archiv aller Bestellungen.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-2xl text-sm font-bold text-on-surface w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          Exportieren
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-outline-variant/10 flex flex-wrap gap-4 items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3 flex-1 min-w-[250px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input 
                type="text" 
                placeholder="Name oder Bestell-Nr. suchen..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-surface border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-shadow outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant/50" />
            <select 
              className="bg-surface border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-medium cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Alle Status</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-on-surface-variant/60 font-semibold bg-surface/30">
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">Datum</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">Bestell-Nr.</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">Kunde</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">Typ</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px] text-right">Summe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    Keine Bestellungen gefunden.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 opacity-40 group-hover:text-primary transition-colors" />
                        {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-on-surface">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-on-surface">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                      {order.fulfillment_type === 'delivery' ? 'Lieferung' : (order.fulfillment_type === 'pickup' ? 'Abholung' : 'Im Lokal')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === 'completed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high text-on-surface-variant text-[11px] font-bold tracking-wide uppercase"><CheckCircle2 className="w-3.5 h-3.5"/> Abgeschlossen</span>}
                      {order.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-outline/10 text-on-surface-variant text-[11px] font-bold tracking-wide uppercase"><XCircle className="w-3.5 h-3.5"/> Storniert</span>}
                      {!['completed', 'cancelled'].includes(order.status) && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warning/10 text-warning text-[11px] font-bold tracking-wide uppercase"><Clock className="w-3.5 h-3.5"/> In Bearbeitung</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-black text-on-surface">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
