'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils/format-currency'
import { TrendingUp, ShoppingBag, CreditCard, Download, BarChart3, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n/useTranslation'

type OrderWithItems = Order & { order_items: OrderItem[] }

export function AnalyticsClient({ shopSlug }: { shopSlug: string }) {
  const supabase = createClient()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  })
  const [topProducts, setTopProducts] = useState<{name: string, quantity: number, revenue: number}[]>([])
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([])

  useEffect(() => {
    async function loadAnalysis() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .single()

      const shop = shopData as { id: string } | null
      if (!shop) return

      const { data: historyOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .eq('status', 'completed')

      if (!historyOrders) {
        setLoading(false)
        return
      }

      setAllOrders(historyOrders as OrderWithItems[])

      let revenue = 0
      const productStats: Record<string, {name: string, quantity: number, revenue: number}> = {}

      historyOrders.forEach(o => {
        revenue += o.total
        o.order_items.forEach((item: any) => {
          if (!productStats[item.product_id]) {
            productStats[item.product_id] = { name: item.product_name, quantity: 0, revenue: 0 }
          }
          productStats[item.product_id].quantity += item.quantity
          productStats[item.product_id].revenue += (item.quantity * item.unit_price)
        })
      })

      const sortedProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      setMetrics({
        totalRevenue: revenue,
        totalOrders: historyOrders.length,
        averageOrderValue: historyOrders.length > 0 ? revenue / historyOrders.length : 0
      })
      setTopProducts(sortedProducts)
      setLoading(false)
    }

    loadAnalysis()
  }, [shopSlug, supabase])

  const downloadCSV = () => {
    if (!allOrders.length) return alert(t('no_orders'))

    const headers = [t('date'), t('order_no'), t('customer'), t('type'), t('status'), `${t('sum')} (€)`]
    const csvContent = [
      headers.join(';'),
      ...allOrders.map(o => {
        return [
          format(new Date(o.created_at), 'dd.MM.yyyy HH:mm'),
          o.order_number,
          `"${o.customer_name}"`,
          o.fulfillment_type === 'delivery' ? t('delivery') : (o.fulfillment_type === 'pickup' ? t('pickup') : t('dine_in')),
          o.status,
          o.total.toFixed(2).replace('.', ',')
        ].join(';')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2">{t('analysis_title')}</h1>
          <p className="text-on-surface-variant font-medium">{t('analysis_subtitle')}</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 transition-all rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          {t('export')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-on-surface-variant">{t('total_revenue')}</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-on-surface tracking-tighter relative z-10">
            {formatCurrency(metrics.totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-on-surface-variant">{t('orders')}</h3>
            <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-on-surface tracking-tighter relative z-10">
            {metrics.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-on-surface-variant">{t('average_value')}</h3>
            <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-on-surface tracking-tighter relative z-10">
            {formatCurrency(metrics.averageOrderValue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-on-surface-variant" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-on-surface">{t('top_10_bestseller')}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{t('top_products_subtitle')}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-on-surface-variant/60 font-semibold bg-surface/30">
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px]">{t('product')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px] text-right">{t('quantity_sold')}</th>
                <th className="px-6 py-4 font-bold tracking-wider uppercase text-[10px] text-right">{t('revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    {t('no_sales_data')}
                  </td>
                </tr>
              ) : (
                topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex flex-shrink-0 items-center justify-center text-on-surface-variant/50 text-xs font-black">
                        {idx + 1}
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-black text-on-surface">
                      {product.quantity}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-on-surface-variant font-medium">
                      {formatCurrency(product.revenue)}
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
