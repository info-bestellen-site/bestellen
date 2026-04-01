'use client'

import { Product } from '@/types/database'
import { X, Plus, ImageIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useCartStore } from '@/lib/store/cart-store'

interface ProductDetailModalProps {
  product: Product | null
  shopSlug: string
  onClose: () => void
}

export function ProductDetailModal({ product, shopSlug, onClose }: ProductDetailModalProps) {
  const addItem = useCartStore(s => s.addItem)

  if (!product) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease]"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="aspect-[4/3] bg-surface-container-low relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-outline-variant/30" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold tracking-tight">{product.name}</h2>
            <span className="text-lg font-bold text-primary ml-3">{formatCurrency(product.price)}</span>
          </div>

          {product.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Allergens */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="mb-6">
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

          {product.is_available && (
            <button
              onClick={() => { addItem(product, shopSlug); onClose() }}
              className="w-full py-4 bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              In den Warenkorb — {formatCurrency(product.price)}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
