'use client'

import Link from 'next/link'
import { UtensilsCrossed, ShoppingBag, Store } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart-store'
import { useEffect, useState } from 'react'
import { Shop } from '@/types/database'

export function MobileNav({ shopSlug, shop }: { shopSlug: string, shop: Shop }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(useCartStore.getState().getItemCount(shopSlug))
    const unsub = useCartStore.subscribe((state) => setCount(state.getItemCount(shopSlug)))
    return unsub
  }, [shopSlug])

  if (searchParams.get('embed') === 'true') return null
  if (pathname.includes('/admin')) return null

  const isMenu = pathname === `/${shopSlug}`
  const isCart = pathname.includes('/checkout')
  const isReserve = pathname.includes('/reserve')

  return (
    <div className="lg:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md z-50 border-t border-outline-variant/10 shadow-xl">
      <div className="flex justify-around py-2.5 px-6 max-w-lg mx-auto">
        <Link href={`/${shopSlug}`} className={`flex flex-col items-center gap-0.5 ${isMenu ? 'text-primary' : 'text-on-surface-variant'}`}>
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] font-medium">Speisekarte</span>
        </Link>
        <Link href={`/${shopSlug}/checkout`} className={`flex flex-col items-center gap-0.5 relative ${isCart ? 'text-primary' : 'text-on-surface-variant'}`}>
          <ShoppingBag className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 right-0 w-4 h-4 bg-primary text-on-primary text-[9px] font-bold rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
          <span className="text-[10px] font-medium">Warenkorb</span>
        </Link>
        {shop.has_reservation && (
          <Link href={`/${shopSlug}/reserve`} className={`flex flex-col items-center gap-0.5 ${isReserve ? 'text-primary' : 'text-on-surface-variant'}`}>
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reservieren</span>
          </Link>
        )}
      </div>
    </div>
  )
}
