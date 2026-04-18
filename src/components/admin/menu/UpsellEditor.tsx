'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, UpsellRule, UpsellRuleWithProduct } from '@/types/database'
import {
  TrendingUp, Plus, Trash2, Loader2, ImageIcon, X, ChevronDown, Search
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'

interface UpsellEditorProps {
  shopId: string
  products: Product[]
}

export function UpsellEditor({ shopId, products }: UpsellEditorProps) {
  const supabase = createClient()
  const [rules, setRules] = useState<(UpsellRuleWithProduct & { trigger_product?: Product | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const [form, setForm] = useState({
    trigger_product_id: '',   // '' = alle Produkte
    upsell_product_id: '',
    bundle_price: '',
  })

  // Only non-hidden products for upsell selection display
  const visibleProducts = products.filter(p => !p.is_hidden_from_menu || p.id === form.upsell_product_id)
  const filteredProducts = visibleProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  useEffect(() => {
    fetchRules()
  }, [shopId])

  async function fetchRules() {
    setLoading(true)
    const { data } = await supabase
      .from('upsell_rules')
      .select('*')
      .eq('shop_id', shopId)
      .order('sort_order')

    if (data) {
      const enriched = data.map(rule => ({
        ...rule,
        upsell_product: products.find(p => p.id === rule.upsell_product_id) as Product,
        trigger_product: rule.trigger_product_id
          ? products.find(p => p.id === rule.trigger_product_id) ?? null
          : null,
      }))
      setRules(enriched as (UpsellRuleWithProduct & { trigger_product?: Product | null })[])
    }
    setLoading(false)
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault()
    if (!form.upsell_product_id) return
    setSaving(true)

    const { data } = await supabase
      .from('upsell_rules')
      .insert({
        shop_id: shopId,
        trigger_product_id: form.trigger_product_id || null,
        upsell_product_id: form.upsell_product_id,
        bundle_price: form.bundle_price ? parseFloat(form.bundle_price) : null,
        sort_order: rules.length,
        is_active: true,
      })
      .select()
      .single()

    if (data) {
      const rule = data as UpsellRule
      const enriched = {
        ...rule,
        upsell_product: products.find(p => p.id === data.upsell_product_id) as Product,
        trigger_product: data.trigger_product_id
          ? products.find(p => p.id === data.trigger_product_id) ?? null
          : null,
      }
      setRules(prev => [...prev, enriched as any])
      setForm({ trigger_product_id: '', upsell_product_id: '', bundle_price: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDeleteRule(id: string) {
    if (!confirm('Upselling-Regel wirklich löschen?')) return
    await supabase.from('upsell_rules').delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  async function handleToggleActive(rule: any) {
    const newActive = !rule.is_active
    await supabase.from('upsell_rules').update({ is_active: newActive }).eq('id', rule.id)
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newActive } : r))
  }

  const upsellProduct = (id: string) => products.find(p => p.id === id)
  const triggerLabel = (id: string | null) => {
    if (!id) return 'Bei allen Produkten'
    return products.find(p => p.id === id)?.name ?? 'Unbekannt'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />

            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Upselling</span>
          </div>
          <p className="text-sm text-on-surface-variant">Empfehle passende Extras automatisch beim Checkout</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Neue Regel
        </button>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <form onSubmit={handleSaveRule} className="border-2 border-primary/20 rounded-2xl p-5 space-y-4 bg-primary/2">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Upselling-Regel konfigurieren</p>

          {/* Trigger */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Auslöser (Trigger-Produkt)
            </label>
            <select
              value={form.trigger_product_id}
              onChange={e => setForm(prev => ({ ...prev, trigger_product_id: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Bei allen Produkten</option>
              {products.filter(p => !p.is_hidden_from_menu).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant/60 px-1">Zeige Upsell wenn dieses Produkt im Warenkorb ist (oder immer bei „Alle Produkte")</p>
          </div>

          {/* Upsell Product */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Empfohlenes Produkt *
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40" />
              <input
                type="text"
                placeholder="Produkt suchen..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto rounded-xl border border-outline-variant/10 bg-white">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, upsell_product_id: p.id }))}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${form.upsell_product_id === p.id
                    ? 'bg-primary/5 text-primary'
                    : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low overflow-hidden shrink-0">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-4 h-4 m-2 text-on-surface-variant/20" />
                    }
                  </div>
                  <span className="flex-1 text-sm font-semibold">{p.name}</span>
                  <span className="text-xs font-black text-on-surface-variant">{formatCurrency(p.price)}</span>
                  {form.upsell_product_id === p.id && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bundle Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Bundle-Sonderpreis (optional)
            </label>
            {form.upsell_product_id && (
              <p className="text-xs text-on-surface-variant/60 px-1">
                Normalpreis: {formatCurrency(upsellProduct(form.upsell_product_id)?.price ?? 0)} → Bundle-Preis:
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.10"
                min="0"
                placeholder={upsellProduct(form.upsell_product_id)?.price?.toString() ?? '0.00'}
                value={form.bundle_price}
                onChange={e => setForm(prev => ({ ...prev, bundle_price: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-on-surface-variant">€</span>
            </div>
            <p className="text-xs text-on-surface-variant/60 px-1">Leer lassen = Normalpreis ohne Rabatt</p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.upsell_product_id}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Regel Speichern'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setProductSearch('') }}
              className="px-4 py-3 rounded-xl bg-surface-container-low text-on-surface-variant text-xs font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-outline-variant/20">
          <TrendingUp className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant font-medium">Noch keine Upselling-Regeln</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">z.B. „Empfehle Ayran bei Döner – nur 1,50 €"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const upsell = (rule as any).upsell_product as Product | undefined
            const trigger = (rule as any).trigger_product as Product | null
            return (
              <div
                key={rule.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${rule.is_active
                  ? 'border-outline-variant/10 bg-white'
                  : 'border-outline-variant/5 bg-surface-container-low opacity-60'
                  }`}
              >
                {/* Upsell product thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-surface-container-low overflow-hidden shrink-0">
                  {upsell?.image_url
                    ? <img src={upsell.image_url} alt="" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-5 h-5 m-3.5 text-on-surface-variant/20" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm">{upsell?.name ?? '?'}</span>
                    {rule.bundle_price && upsell && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs line-through text-on-surface-variant/50">{formatCurrency(upsell.price)}</span>
                        <span className="text-xs font-black text-success">{formatCurrency(rule.bundle_price)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Trigger: <span className="font-bold">{triggerLabel(rule.trigger_product_id)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`w-10 h-6 rounded-full transition-all relative ${rule.is_active ? 'bg-success' : 'bg-outline-variant/30'
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${rule.is_active ? 'left-5' : 'left-1'
                      }`} />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/5 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
