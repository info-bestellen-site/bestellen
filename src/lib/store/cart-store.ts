'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types/database'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  shopSlug: string | null
  addItem: (product: Product, shopSlug: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      shopSlug: null,
      addItem: (product, shopSlug) => {
        const state = get()
        if (state.shopSlug && state.shopSlug !== shopSlug) {
          set({ items: [], shopSlug })
        }
        const existing = state.items.find(i => i.product.id === product.id)
        if (existing) {
          set({
            shopSlug,
            items: state.items.map(i =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ shopSlug, items: [...state.items, { product, quantity: 1 }] })
        }
      },
      removeItem: (productId) => {
        set(s => ({ items: s.items.filter(i => i.product.id !== productId) }))
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return }
        set(s => ({
          items: s.items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }))
      },
      clearCart: () => set({ items: [], shopSlug: null }),
      getSubtotal: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'bestellen-cart' }
  )
)
