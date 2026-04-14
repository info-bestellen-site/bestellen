'use client'

import { Shop } from '@/types/database'
import { useSearchParams } from 'next/navigation'
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
    <footer className="hidden lg:block w-full mt-12 bg-surface-container-low border-t border-outline-variant/10" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-10 max-w-7xl mx-auto gap-4" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded-full object-cover border border-outline-variant/15" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {(() => {
                const IconComponent = (shop.icon_name && ICON_MAP[shop.icon_name]) || Store
                return <IconComponent className="w-4 h-4 text-primary" />
              })()}
            </div>
          )}
          <div className="text-base font-black tracking-tight text-on-surface" suppressHydrationWarning>{shop.name}</div>
        </div>
        {shop.phone && (
          <a href={`tel:${shop.phone}`} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            {shop.phone}
          </a>
        )}
        <p className="text-xs text-on-surface-variant">
          Powered by <span className="font-semibold">Bestellen</span>
        </p>
      </div>
    </footer>
  )
}
