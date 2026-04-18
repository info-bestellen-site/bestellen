'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Search, Filter, CalendarIcon, ChevronDown, Download, CheckCircle2, XCircle, Clock, ShoppingBag } from 'lucide-react'
import React from 'react'
import { format } from 'date-fns'
import { de, enUS, it, arSA, tr, vi, zhCN, ja, hi } from 'date-fns/locale'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Language } from '@/lib/i18n/translations'

const DATE_LOCALES: Record<Language, any> = {
  de,
  en: enUS,
  it,
  ar: arSA,
  tr,
  vi,
  zh: zhCN,
  ja,
  hi
}

type OrderWithItems = Order & { order_items: OrderItem[] }

function OrderHistoryPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': slug } = use(params)
  const shopSlug = decodeURIComponent(slug)
  const supabase = createClient()
  
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const { t, language } = useTranslation()
  const locale = DATE_LOCALES[language] || de

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
    if (!filteredOrders.length) return alert(t('no_orders'))
    
    const headers = [t('date'), t('order_no'), t('customer'), t('type'), t('status'), `${t('sum')} (€)`]
    const csvContent = [
      headers.join(';'),
      ...filteredOrders.map(o => {
        return [
          format(new Date(o.created_at), 'dd.MM.yyyy HH:mm'),
          o.order_number,
          `"${o.customer_name}"`,
          o.fulfillment_type === 'delivery' ? t('delivery') : (o.fulfillment_type === 'pickup' ? t('pickup') : t('dine_in')),
          o.status === 'completed' ? t('completed') : (o.status === 'cancelled' ? t('cancelled') : t('preparing')),
          o.total.toFixed(2).replace('.', ',')
        ].join(';')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
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
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-on-surface mb-2">{t('history')}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant font-medium">{t('orders_archive_subtitle')}</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-2xl text-sm font-bold text-on-surface w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          {t('export')}
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
                placeholder={t('search_placeholder')} 
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
              <option value="all">{t('all_status')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-on-surface-variant/60 font-semibold bg-surface/30">
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('date')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('order_no')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('customer')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('type')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('status')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px] text-right">{t('sum')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    {t('no_orders')}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className={`hover:bg-surface-container-lowest transition-all group cursor-pointer ${expandedOrderId === order.id ? 'bg-surface-container-lowest ring-1 ring-inset ring-primary/10' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                        <div className="flex items-center gap-3">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-180 text-primary' : 'opacity-20 group-hover:opacity-100'}`} />
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 opacity-40 group-hover:text-primary transition-colors" />
                            {format(new Date(order.created_at), 'PPp', { locale })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-on-surface">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-on-surface">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                        {order.fulfillment_type === 'delivery' ? t('delivery') : (order.fulfillment_type === 'pickup' ? t('pickup') : t('dine_in'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'completed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high text-on-surface-variant text-[11px] font-bold tracking-wide uppercase"><CheckCircle2 className="w-3.5 h-3.5"/> {t('completed')}</span>}
                        {order.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-outline/10 text-on-surface-variant text-[11px] font-bold tracking-wide uppercase"><XCircle className="w-3.5 h-3.5"/> {t('cancelled')}</span>}
                        {!['completed', 'cancelled'].includes(order.status) && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warning/10 text-warning text-[11px] font-bold tracking-wide uppercase"><Clock className="w-3.5 h-3.5"/> {t('in_progress')}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-on-surface">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {expandedOrderId === order.id && (
                      <tr className="bg-surface-container-lowest/50 animate-in fade-in slide-in-from-top-1 duration-200">
                        <td colSpan={6} className="px-6 py-6 ring-1 ring-inset ring-primary/5">
                          <div className="bg-white rounded-2xl border border-outline-variant/10 p-5 shadow-sm max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                              <ShoppingBag className="w-4 h-4 text-primary" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bestellte Produkte</h4>
                            </div>
                            <div className="space-y-3">
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-outline-variant/5 last:border-0 hover:bg-surface/50 transition-colors rounded-lg px-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                      {item.quantity}x
                                    </div>
                                    <span className="font-semibold text-on-surface">{item.product_name}</span>
                                  </div>
                                  <span className="font-medium text-on-surface-variant">{formatCurrency(item.unit_price)}</span>
                                </div>
                              ))}
                              
                              <div className="pt-3 mt-3 border-t border-outline-variant/10 flex flex-col gap-2">
                                {order.notes && (
                                  <div className="p-3 bg-surface rounded-xl text-xs text-on-surface-variant italic">
                                    <span className="font-bold not-italic uppercase text-[9px] mb-1 block opacity-50">Anmerkungen:</span>
                                    {order.notes}
                                  </div>
                                )}
                                {order.delivery_address && (
                                  <div className="p-3 bg-surface rounded-xl text-xs text-on-surface-variant">
                                    <span className="font-bold uppercase text-[9px] mb-1 block opacity-50">Lieferadresse:</span>
                                    {order.delivery_address}
                                  </div>
                                )}
                                <div className="flex justify-between items-center px-2 py-1">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Zahlungsart:</span>
                                  <span className="text-xs font-bold uppercase">{order.payment_method === 'paypal' ? 'PayPal' : 'Barzahlung'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OrderHistoryPage;
