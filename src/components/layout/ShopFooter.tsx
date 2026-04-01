'use client'

import { Shop } from '@/types/database'
import { useSearchParams } from 'next/navigation'

export function ShopFooter({ shop }: { shop: Shop }) {
  const searchParams = useSearchParams()
  if (searchParams.get('embed') === 'true') return null

  return (
    <footer className="hidden lg:block w-full mt-12 bg-surface-container-low border-t border-outline-variant/10">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-10 max-w-7xl mx-auto gap-4">
        <div className="text-base font-semibold text-on-surface">{shop.name}</div>
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
