'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types/database'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  carts: Record<string, CartItem[]>
  addItem: (product: Product, shopSlug: string) => void
  removeItem: (productId: string, shopSlug: string) => void
  updateQuantity: (productId: string, quantity: number, shopSlug: string) => void
  clearCart: (shopSlug: string) => void
  getSubtotal: (shopSlug: string) => number
  getItemCount: (shopSlug: string) => number
  getItems: (shopSlug: string) => CartItem[]
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},
      addItem: (product, shopSlug) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        const existing = shopItems.find(i => i.product.id === product.id)
        
        const newItems = existing
          ? shopItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...shopItems, { product, quantity: 1 }]
          
        set({
          carts: { ...carts, [shopSlug]: newItems }
        })
      },
      removeItem: (productId, shopSlug) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        set({
          carts: { ...carts, [shopSlug]: shopItems.filter(i => i.product.id !== productId) }
        })
      },
      updateQuantity: (productId, quantity, shopSlug) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        if (quantity <= 0) { get().removeItem(productId, shopSlug); return }
        set({
          carts: {
            ...carts,
            [shopSlug]: shopItems.map(i => i.product.id === productId ? { ...i, quantity } : i)
          }
        })
      },
      clearCart: (shopSlug) => {
        const carts = get().carts
        set({
          carts: { ...carts, [shopSlug]: [] }
        })
      },
      getSubtotal: (shopSlug) => {
        const shopItems = get().carts[shopSlug] || []
        return shopItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
      },
      getItemCount: (shopSlug) => {
        const shopItems = get().carts[shopSlug] || []
        return shopItems.reduce((s, i) => s + i.quantity, 0)
      },
      getItems: (shopSlug) => get().carts[shopSlug] || [],
    }),
    { name: 'bestellen-cart' }
  )
)
