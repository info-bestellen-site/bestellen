'use client'

import { Product, ModifierGroupWithOptions, UpsellRuleWithProduct, SelectedModifier } from '@/types/database'
import { X, Plus, ImageIcon, ChevronLeft, ChevronRight, Check, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useCartStore } from '@/lib/store/cart-store'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProductDetailModalProps {
  product: Product | null
  shopSlug: string
  onClose: () => void
}

export function ProductDetailModal({ product, shopSlug, onClose }: ProductDetailModalProps) {
  const supabase = createClient()
  const addItem = useCartStore(s => s.addItem)

  const [step, setStep] = useState<'modifiers' | 'upsell'>('modifiers')
  const [groups, setGroups] = useState<ModifierGroupWithOptions[]>([])
  const [upsellRules, setUpsellRules] = useState<(UpsellRuleWithProduct & { upsell_product: Product })[]>([])
  const [loading, setLoading] = useState(false)

  // Selections: groupId -> Set of optionIds
  const [selections, setSelections] = useState<Record<string, Set<string>>>({})
  // Upsell selections: ruleId -> boolean
  const [upsellSelections, setUpsellSelections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!product) {
      setGroups([])
      setUpsellRules([])
      setSelections({})
      setUpsellSelections({})
      setStep('modifiers')
      return
    }

    async function fetchModifiers() {
      if (!product) return
      setLoading(true)

      // Fetch modifier groups
      const { data: groupData } = await supabase
        .from('modifier_groups')
        .select('*, modifier_options(*)')
        .eq('product_id', product.id)
        .order('sort_order')

      const parsed: ModifierGroupWithOptions[] = (groupData || []).map((g: any) => ({
        ...g,
        modifier_options: (g.modifier_options || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
      }))
      setGroups(parsed)

      // Set defaults
      const defaultSel: Record<string, Set<string>> = {}
      for (const g of parsed) {
        const defaults = g.modifier_options.filter(o => o.is_default)
        if (defaults.length > 0) {
          defaultSel[g.id] = new Set(defaults.map(o => o.id))
        }
      }
      setSelections(defaultSel)

      // Fetch upsell rules for this product
      const { data: upsellData } = await supabase
        .from('upsell_rules')
        .select('*')
        .eq('shop_id', product.shop_id)
        .eq('is_active', true)
        .or(`trigger_product_id.eq.${product.id},trigger_product_id.is.null`)
        .order('sort_order')

      if (upsellData && upsellData.length > 0) {
        // Fetch upsell product details
        const upsellProductIds = upsellData.map((r: any) => r.upsell_product_id)
        const { data: upsellProducts } = await supabase
          .from('products')
          .select('*')
          .in('id', upsellProductIds)

        const enriched = upsellData.map((rule: any) => ({
          ...rule,
          upsell_product: upsellProducts?.find((p: Product) => p.id === rule.upsell_product_id) as Product
        })).filter((r: any) => r.upsell_product && r.upsell_product.id !== product.id)

        setUpsellRules(enriched as any)
      } else {
        setUpsellRules([])
      }

      setLoading(false)
    }

    fetchModifiers()
  }, [product?.id])

  const hasUpsell = upsellRules.length > 0

  // Computed: selected modifiers as flat list
  const selectedModifiers = useMemo((): SelectedModifier[] => {
    if (!product) return []
    const result: SelectedModifier[] = []
    for (const group of groups) {
      const selectedIds = selections[group.id]
      if (!selectedIds) continue
      for (const optId of selectedIds) {
        const opt = group.modifier_options.find(o => o.id === optId)
        if (opt) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            priceDelta: opt.price_delta,
          })
        }
      }
    }
    return result
  }, [groups, selections, product])

  // Validation: all required groups have a selection
  const missingRequired = useMemo(() => {
    return groups.filter(g => g.is_required && (!selections[g.id] || selections[g.id].size === 0))
  }, [groups, selections])

  const isValid = missingRequired.length === 0

  // Live price
  const basePrice = product?.price ?? 0
  const modifierDelta = selectedModifiers.reduce((s, m) => s + m.priceDelta, 0)
  const productTotal = basePrice + modifierDelta

  // Upsell total (only selected upsells)
  const upsellTotal = upsellRules.reduce((sum, rule) => {
    if (!upsellSelections[rule.id]) return sum
    const price = rule.bundle_price ?? rule.upsell_product?.price ?? 0
    return sum + price
  }, 0)

  const grandTotal = productTotal + upsellTotal

  function handleOptionToggle(group: ModifierGroupWithOptions, optionId: string) {
    setSelections(prev => {
      const current = new Set(prev[group.id] || [])
      if (group.max_selections === 1) {
        // Radio behavior
        return { ...prev, [group.id]: new Set([optionId]) }
      } else {
        // Checkbox behavior
        if (current.has(optionId)) {
          current.delete(optionId)
        } else if (current.size < group.max_selections) {
          current.add(optionId)
        }
        return { ...prev, [group.id]: new Set(current) }
      }
    })
  }

  function handleAddToCart() {
    if (!product || !isValid) return

    // Add main product
    addItem(product, shopSlug, selectedModifiers)

    // Add selected upsells
    for (const rule of upsellRules) {
      if (upsellSelections[rule.id] && rule.upsell_product) {
        const upsellProduct = rule.bundle_price
          ? { ...rule.upsell_product, price: rule.bundle_price }
          : rule.upsell_product
        addItem(upsellProduct, shopSlug)
      }
    }

    onClose()
  }

  function handleNext() {
    if (!isValid) return
    if (hasUpsell) {
      setStep('upsell')
    } else {
      handleAddToCart()
    }
  }

  if (!product) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step indicator */}
        {hasUpsell && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <div className={`w-6 h-1.5 rounded-full transition-all ${step === 'modifiers' ? 'bg-primary' : 'bg-primary/30'}`} />
            <div className={`w-6 h-1.5 rounded-full transition-all ${step === 'upsell' ? 'bg-primary' : 'bg-outline-variant/30'}`} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ===== STEP 1: MODIFIERS ===== */}
        {step === 'modifiers' && (
          <>
            {/* Product image */}
            <div className="aspect-[16/9] bg-surface-container-low relative shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-outline-variant/30" />
                </div>
              )}
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface-container-lowest to-transparent" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              <div className="px-6 pt-4 pb-2">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h2 className="text-xl font-black tracking-tight leading-tight">{product.name}</h2>
                  <span className="text-lg font-black text-primary whitespace-nowrap">{formatCurrency(product.price)}</span>
                </div>
                {product.description && (
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{product.description}</p>
                )}
              </div>

              {/* Modifier Groups */}
              {!loading && groups.length > 0 && (
                <div className="px-6 space-y-5 pb-4">
                  {groups.map(group => {
                    const selectedIds = selections[group.id] || new Set()
                    const isMissing = group.is_required && selectedIds.size === 0
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-sm font-black tracking-tight">{group.name}</h3>
                          {group.is_required && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              isMissing ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                            }`}>
                              {isMissing ? 'Pflichtfeld' : '✓ Gewählt'}
                            </span>
                          )}
                          {group.max_selections > 1 && (
                            <span className="text-[9px] text-on-surface-variant/50 font-medium">
                              (max. {group.max_selections})
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {group.modifier_options.map(option => {
                            const isSelected = selectedIds.has(option.id)
                            const isRadio = group.max_selections === 1
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleOptionToggle(group, option.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-outline-variant/15 hover:border-outline-variant/40 bg-surface-container-low'
                                }`}
                              >
                                {/* Radio / Checkbox indicator */}
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all ${
                                  isRadio ? 'rounded-full' : 'rounded-md'
                                } border-2 ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant/40'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="flex-1 text-sm font-semibold">{option.name}</span>
                                {option.price_delta > 0 && (
                                  <span className="text-sm font-black text-primary">+{formatCurrency(option.price_delta)}</span>
                                )}
                                {option.price_delta === 0 && (
                                  <span className="text-xs text-on-surface-variant/40 font-medium">inkl.</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Allergens */}
              {product.allergens && product.allergens.length > 0 && (
                <div className="px-6 pb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Allergene</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergen, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-surface-container-low text-xs font-medium text-on-surface-variant">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-3 border-t border-outline-variant/5 bg-surface-container-lowest shrink-0">
              {missingRequired.length > 0 && (
                <p className="text-xs text-error font-semibold mb-2 text-center">
                  Bitte wähle: {missingRequired.map(g => g.name).join(', ')}
                </p>
              )}
              {product.is_available ? (
                <button
                  onClick={handleNext}
                  disabled={!isValid}
                  className={`w-full py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    isValid
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98]'
                      : 'bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed'
                  }`}
                >
                  {hasUpsell ? (
                    <>
                      Weiter
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Für {formatCurrency(productTotal)} hinzufügen
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-4 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-black text-center">
                  Nicht verfügbar
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== STEP 2: UPSELLING ===== */}
        {step === 'upsell' && (
          <>
            {/* Header */}
            <div className="px-6 pt-8 pb-4 shrink-0">
              <button
                onClick={() => setStep('modifiers')}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-4"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Zurück
              </button>
              <div className="text-center">
                <h2 className="text-xl font-black tracking-tight mb-1">Lust auf etwas dazu? 🍹</h2>
                <p className="text-sm text-on-surface-variant">Entdecke passende Extras zu deiner Bestellung</p>
              </div>
            </div>

            {/* Upsell cards */}
            <div className="overflow-y-auto flex-1 px-6 space-y-3 pb-4">
              {upsellRules.map(rule => {
                const upsellProd = rule.upsell_product
                if (!upsellProd) return null
                const isSelected = !!upsellSelections[rule.id]
                const displayPrice = rule.bundle_price ?? upsellProd.price
                const hasDiscount = rule.bundle_price !== null && rule.bundle_price < upsellProd.price

                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setUpsellSelections(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/15 hover:border-outline-variant/30 bg-surface-container-low'
                    }`}
                  >
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
                      {upsellProd.image_url ? (
                        <img src={upsellProd.image_url} alt={upsellProd.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-outline-variant/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm">{upsellProd.name}</h3>
                      {upsellProd.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{upsellProd.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-black text-primary">{formatCurrency(displayPrice)}</span>
                        {hasDiscount && (
                          <span className="text-xs line-through text-on-surface-variant/50">{formatCurrency(upsellProd.price)}</span>
                        )}
                        {hasDiscount && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                            Sonderpreis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-outline-variant/40'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-3 border-t border-outline-variant/5 bg-surface-container-lowest shrink-0">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                {Object.values(upsellSelections).some(v => v)
                  ? `Für ${formatCurrency(grandTotal)} hinzufügen`
                  : `Für ${formatCurrency(productTotal)} hinzufügen`
                }
              </button>
              <button
                onClick={() => {
                  setUpsellSelections({})
                  handleAddToCart()
                }}
                className="w-full py-2 mt-2 text-xs font-bold text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
              >
                Nein danke, ohne Extras
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
