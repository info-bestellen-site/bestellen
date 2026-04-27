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
  Wine,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Shop } from '@/types/database'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/lib/store/admin-store'
import { LanguageSwitcher } from '@/components/admin/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { isShopOpen } from '@/lib/utils/open-hours'
import { OpeningHour } from '@/types/database'

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

export function ShopHeader({ 
  shop, 
  isCurrentlyOpen, 
  hours = [] 
}: { 
  shop: Shop, 
  isCurrentlyOpen?: boolean,
  hours?: OpeningHour[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isEmbed = searchParams.get('embed') === 'true'
  const { t } = useTranslation()
  const { editMode, toggleEditMode } = useAdminStore()
  
  const [itemCount, setItemCount] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isOpenInternal, setIsOpenInternal] = useState(isCurrentlyOpen !== undefined ? isCurrentlyOpen : shop.is_open)

  // 1. Sync state with props
  useEffect(() => {
    setIsOpenInternal(isCurrentlyOpen !== undefined ? isCurrentlyOpen : shop.is_open)
  }, [isCurrentlyOpen, shop.is_open])

  // 2. Scheduler: Re-calculate status every minute to catch end-of-hours transition
  useEffect(() => {
    if (!hours?.length) return

    const interval = setInterval(() => {
      const currentCalculatedStatus = isShopOpen(hours, shop.is_open, shop.manual_status_updated_at)
      setIsOpenInternal(currentCalculatedStatus)
    }, 60000)

    return () => clearInterval(interval)
  }, [hours, shop.is_open, shop.manual_status_updated_at])

  // 3. Realtime: Listen for manual status changes from other devices
  useEffect(() => {
    const channel = supabase
      .channel(`shop-status-${shop.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'shops',
        filter: `id=eq.${shop.id}`
      }, (payload) => {
        const updatedShop = payload.new as Shop
        const newStatus = isShopOpen(hours || [], updatedShop.is_open, updatedShop.manual_status_updated_at)
        setIsOpenInternal(newStatus)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, shop.id, hours])

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
    setItemCount(getItemCount(shop.slug))
    const unsub = useCartStore.subscribe((state) => setItemCount(state.getItemCount(shop.slug)))
    return unsub
  }, [getItemCount, shop.slug])

  const handleToggleStatus = async () => {
    if (isToggling) return
    setIsToggling(true)

    const newStatus = !isOpenInternal
    
    try {
      const { error } = await (supabase as any)
        .from('shops')
        .update({ 
          is_open: newStatus,
          manual_status_updated_at: new Date().toISOString()
        })
        .eq('id', shop.id)

      if (error) throw error
      
      setIsOpenInternal(newStatus)
      router.refresh()
    } catch (err) {
      console.error('Error toggling status:', err)
    } finally {
      setIsToggling(false)
    }
  }

  if (isEmbed) return null

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 shadow-sm" suppressHydrationWarning>
      <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 max-w-7xl mx-auto" suppressHydrationWarning>
        <div className="flex items-center gap-6" suppressHydrationWarning>
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
              <h1 className="text-lg font-bold tracking-tight text-on-surface leading-tight" suppressHydrationWarning>{shop.name}</h1>
              {!isOpenInternal && (
                <span className="text-[10px] font-bold text-error uppercase tracking-wider">Geschlossen</span>
              )}
            </div>
          </Link>

          {isOwner && (
            <Link
              href={pathname.includes('/admin') ? `/${shop.slug}` : `/${shop.slug}/admin`}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 text-xs font-bold"
            >
              {pathname.includes('/admin') ? (
                <>
                  <Store className="w-4 h-4" /> {t('to_shop')}
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" /> {t('to_admin')}
                </>
              )}
            </Link>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/${shop.slug}`}
            className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${pathname === `/${shop.slug}`
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
          >
            Speisekarte
          </Link>
          {shop.has_reservation && (
            <Link
              href={`/${shop.slug}/reserve`}
              className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-2 ${pathname === `/${shop.slug}/reserve`
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
            >
              <Store className="w-4 h-4" /> Tisch reservieren
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {isOwner && (
            <>
              <button
                onClick={handleToggleStatus}
                disabled={isToggling}
                title={isOpenInternal ? 'Shop schließen' : 'Shop öffnen'}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border border-outline-variant/10 shadow-sm transition-all relative overflow-hidden group ${isOpenInternal
                  ? 'bg-success/5 text-success hover:bg-success/10'
                  : 'bg-error/5 text-error hover:bg-error/10'
                } ${isToggling ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              >
                {isToggling ? (
                  <Loader2 className="w-2 h-2 animate-spin" />
                ) : (
                  <div className={`w-2 h-2 rounded-full transition-all ${isOpenInternal ? 'bg-success animate-pulse' : 'bg-error'} group-hover:scale-125`} />
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1">
                  {isOpenInternal ? t('open') : t('closed')}
                  <RefreshCw className={`w-2.5 h-2.5 ml-1 transition-transform group-hover:rotate-180 ${isToggling ? 'animate-spin' : ''}`} />
                </span>
              </button>
              <LanguageSwitcher />
            </>
          )}

          <Link href={`/${shop.slug}/checkout`} className="relative flex items-center gap-2 hover:opacity-80 transition-opacity p-2">
            <ShoppingCart className="w-5 h-5 text-on-surface" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
