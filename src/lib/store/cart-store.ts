'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, SelectedModifier } from '@/types/database'

export interface CartItem {
  product: Product
  quantity: number
  selectedModifiers?: SelectedModifier[]
  totalPrice: number // base price + modifier deltas
  cartItemKey: string // unique key: productId + modifier combo hash
}

interface CartStore {
  carts: Record<string, CartItem[]>
  addItem: (product: Product, shopSlug: string, modifiers?: SelectedModifier[]) => void
  removeItem: (cartItemKey: string, shopSlug: string) => void
  updateQuantity: (cartItemKey: string, quantity: number, shopSlug: string) => void
  clearCart: (shopSlug: string) => void
  getSubtotal: (shopSlug: string) => number
  getItemCount: (shopSlug: string) => number
  getItems: (shopSlug: string) => CartItem[]
}

function buildCartItemKey(productId: string, modifiers?: SelectedModifier[]): string {
  if (!modifiers || modifiers.length === 0) return productId
  const modKey = modifiers
    .map(m => `${m.groupId}:${m.optionId}`)
    .sort()
    .join('|')
  return `${productId}_${modKey}`
}

function calculateTotalPrice(product: Product, modifiers?: SelectedModifier[]): number {
  const modifierDelta = modifiers?.reduce((sum, m) => sum + m.priceDelta, 0) ?? 0
  return product.price + modifierDelta
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},
      addItem: (product, shopSlug, modifiers) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        const cartItemKey = buildCartItemKey(product.id, modifiers)
        const totalPrice = calculateTotalPrice(product, modifiers)
        const existing = shopItems.find(i => i.cartItemKey === cartItemKey)

        const newItems = existing
          ? shopItems.map(i =>
              i.cartItemKey === cartItemKey
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...shopItems, { product, quantity: 1, selectedModifiers: modifiers, totalPrice, cartItemKey }]

        set({ carts: { ...carts, [shopSlug]: newItems } })
      },
      removeItem: (cartItemKey, shopSlug) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        set({ carts: { ...carts, [shopSlug]: shopItems.filter(i => i.cartItemKey !== cartItemKey) } })
      },
      updateQuantity: (cartItemKey, quantity, shopSlug) => {
        const carts = get().carts
        const shopItems = carts[shopSlug] || []
        if (quantity <= 0) { get().removeItem(cartItemKey, shopSlug); return }
        set({
          carts: {
            ...carts,
            [shopSlug]: shopItems.map(i => i.cartItemKey === cartItemKey ? { ...i, quantity } : i)
          }
        })
      },
      clearCart: (shopSlug) => {
        const carts = get().carts
        set({ carts: { ...carts, [shopSlug]: [] } })
      },
      getSubtotal: (shopSlug) => {
        const shopItems = get().carts[shopSlug] || []
        return shopItems.reduce((s, i) => s + i.totalPrice * i.quantity, 0)
      },
      getItemCount: (shopSlug) => {
        const shopItems = get().carts[shopSlug] || []
        return shopItems.reduce((s, i) => s + i.quantity, 0)
      },
      getItems: (shopSlug) => get().carts[shopSlug] || [],
    }),
    { name: 'bestellen-cart-v2' } // v2 to reset old incompatible carts
  )
)
