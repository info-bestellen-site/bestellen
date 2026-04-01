'use client'

import Link from 'next/link'
import { ShoppingCart, Store, ShieldAlert, ShieldCheck, Settings } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Shop } from '@/types/database'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/lib/store/admin-store'

export function ShopHeader({ shop }: { shop: Shop }) {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === 'true'
  
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
                <Store className="w-4 h-4 text-on-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight text-on-surface leading-tight">{shop.name}</h1>
              {!shop.is_open && (
                <span className="text-[10px] font-bold text-error uppercase tracking-wider">Geschlossen</span>
              )}
            </div>
          </Link>

          {isOwner && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
              <button 
                onClick={toggleEditMode}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  editMode ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                {editMode ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                Edit-Modus {editMode ? 'An' : 'Aus'}
              </button>
              <Link href={`/${shop.slug}/admin`} className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href={`/${shop.slug}`} className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            Speisekarte
          </Link>
        </nav>

        <Link href={`/${shop.slug}/checkout`} className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShoppingCart className="w-5 h-5 text-on-surface" />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
