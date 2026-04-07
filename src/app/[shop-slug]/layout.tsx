import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ShopHeader } from '@/components/layout/ShopHeader'
import { ShopFooter } from '@/components/layout/ShopFooter'
import { MobileNav } from '@/components/layout/MobileNav'
import { ShopMain } from '@/components/layout/ShopMain'
import { isShopOpen } from '@/lib/utils/open-hours'

interface ShopLayoutProps {
  children: React.ReactNode
  params: Promise<{ 'shop-slug': string }>
}

export async function generateMetadata({ params }: ShopLayoutProps) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: shop } = await supabase.from('shops').select('name').eq('slug', slug).single()
  return {
    title: shop ? `${shop.name} — Jetzt bestellen` : 'Shop nicht gefunden',
    description: shop ? `Bestelle online bei ${shop.name}` : undefined,
  }
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: shop } = await supabase.from('shops').select('*').eq('slug', slug).single()
  if (!shop) notFound()

  // Fetch opening hours
  const { data: hours } = await supabase.from('opening_hours').select('*').eq('shop_id', shop.id)
  let isCurrentlyOpen = isShopOpen(hours || [], shop.is_open, shop.manual_status_updated_at)
  
  // FORCE OPEN for Demo Shop
  if (slug === 'sakura-sushi') {
    isCurrentlyOpen = true
  }

  return (
    <div className="min-h-screen bg-surface">
      <ShopHeader shop={shop} isCurrentlyOpen={isCurrentlyOpen} />
      <ShopMain>{children}</ShopMain>
      <ShopFooter shop={shop} />
      <MobileNav shopSlug={slug} shop={shop} />
    </div>
  )
}
