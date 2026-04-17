'use client'

import { Shop } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Store, 
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

export function ShopFooter({ shop }: { shop: Shop }) {
  const searchParams = useSearchParams()
  if (searchParams.get('embed') === 'true') return null

  return (
    <footer className="w-full mt-12 bg-surface-container-low border-t border-outline-variant/10" suppressHydrationWarning>
      <div className="grid grid-cols-1 md:grid-cols-3 items-center md:items-start px-6 sm:px-10 py-10 max-w-7xl mx-auto gap-10 md:gap-4" suppressHydrationWarning>
        {/* Left: Brand */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded-full object-cover border border-outline-variant/15" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                {(() => {
                  const Icon = (shop as any).icon || null
                  return Icon ? (
                    <Icon className="w-4 h-4 text-on-surface-variant" />
                  ) : (
                    <span className="text-[10px] font-black text-on-surface-variant">
                      {shop.name.charAt(0)}
                    </span>
                  )
                })()}
              </div>
            )}
            <div className="text-base font-black tracking-tight text-on-surface" suppressHydrationWarning>{shop.name}</div>
          </div>
        </div>

        {/* Center: Address & Contact (Imprint style) */}
        <div className="flex flex-col items-center gap-6 text-center">
          {shop.address && (
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Adresse</span>
              <p className="text-xs text-on-surface-variant max-w-[280px] leading-relaxed">
                {shop.address}
              </p>
            </div>
          )}
          
          {shop.phone && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Kontakt</span>
              <a href={`tel:${shop.phone}`} className="text-sm font-bold text-on-surface hover:text-primary transition-colors">
                {shop.phone}
              </a>
            </div>
          )}
        </div>

        {/* Right: Brand Branding */}
        <div className="flex flex-col items-center md:items-end w-full">
          <div className="pt-6 border-t border-outline-variant/10 md:border-0 md:pt-0">
            <p className="text-[10px] text-on-surface-variant/60 font-medium">
              Powered by <Link href="/" className="font-black text-on-surface-variant hover:text-primary transition-colors">Bestellen</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
