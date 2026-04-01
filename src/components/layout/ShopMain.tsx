'use client'

import { useSearchParams } from 'next/navigation'

export function ShopMain({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embed') === 'true'

  return (
    <main className={isEmbedded ? '' : 'pt-20 pb-24 lg:pb-12'}>
      {children}
    </main>
  )
}
