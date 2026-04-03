'use client'

import Link from 'next/link'
import { 
  ShoppingCart, 
  Store, 
  ShieldAlert, 
  ShieldCheck, 
  Settings,
  Coffee,
  Pizza,
  Utensils,
  Beer,
  Cake,
  IceCream,
  Fish,
  Soup,
  Beef,
  Wine
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Shop } from '@/types/database'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/lib/store/admin-store'
import { LanguageSwitcher } from '@/components/admin/LanguageSwitcher'

const ICON_MAP: Record<string, any> = {
  Store,
  Utensils,
  Coffee,
  Pizza,
  Beer,
  Cake,
  IceCream,
  Fish,
  Soup,
  Beef,
  Wine
}

export function ShopHeader({ shop, isCurrentlyOpen }: { shop: Shop, isCurrentlyOpen?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isEmbed = searchParams.get('embed') === 'true'
  
  // Use the prop if provided, otherwise fallback to shop.is_open (for backward compatibility if needed)
  const isOpen = isCurrentlyOpen !== undefined ? isCurrentlyOpen : shop.is_open
  
  const [itemCount, setItemCount] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const { editMode, toggleEditMode } = useAdminStore()
  
  const getItemCount = useCartStore(s => s.getItemCount)

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === shop.owner_id) {
        setIsOwner(true)
      }
    }
    checkOwner()
  }, [supabase, shop.owner_id])

  useEffect(() => {
    setItemCount(getItemCount())
    const unsub = useCartStore.subscribe(() => setItemCount(useCartStore.getState().getItemCount()))
    return unsub
  }, [getItemCount])

  if (isEmbed) return null

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href={`/${shop.slug}`} className="flex items-center gap-3">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-9 h-9 rounded-full object-cover border border-outline-variant/15" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                {(() => {
                  const IconComponent = (shop.icon_name && ICON_MAP[shop.icon_name]) || Store
                  return <IconComponent className="w-4 h-4 text-on-primary" />
                })()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight text-on-surface leading-tight">{shop.name}</h1>
              {!isOpen && (
                <span className="text-[10px] font-bold text-error uppercase tracking-wider">Geschlossen</span>
              )}
            </div>
          </Link>

          {isOwner && (
            <Link 
              href={`/${shop.slug}/admin`} 
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 text-xs font-bold"
            >
              <Settings className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href={`/${shop.slug}`} 
            className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
              pathname === `/${shop.slug}` 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Speisekarte
          </Link>
          {shop.has_reservation && (
            <Link 
              href={`/${shop.slug}/reserve`} 
              className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                pathname === `/${shop.slug}/reserve`
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <Store className="w-4 h-4" /> Tisch reservieren
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {isOwner && <LanguageSwitcher />}
          <Link href={`/${shop.slug}/checkout`} className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ShoppingCart className="w-5 h-5 text-on-surface" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
