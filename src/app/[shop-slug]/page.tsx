import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MenuList } from '@/components/menu/MenuList'
import { notFound } from 'next/navigation'
import { isShopOpen } from '@/lib/utils/open-hours'

interface ShopPageProps {
  params: Promise<{ 'shop-slug': string }>
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch shop, categories and products
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!shop) notFound()
  
  // Check if current user is the shop owner
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.id === shop.owner_id

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order')

  // Fetch opening hours
  const { data: hours } = await supabase.from('opening_hours').select('*').eq('shop_id', shop.id)
  const isCurrentlyOpen = isShopOpen(hours || [], shop.is_open)

  return (
    <MenuList 
      shop={shop} 
      categories={categories || []} 
      products={products || []} 
      isAdmin={isAdmin}
      isCurrentlyOpen={isCurrentlyOpen}
      hours={hours || []}
    />
  )
}
