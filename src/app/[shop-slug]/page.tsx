import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MenuList } from '@/components/menu/MenuList'
import { notFound } from 'next/navigation'

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

  return (
    <MenuList 
      shop={shop} 
      categories={categories || []} 
      products={products || []} 
      isAdmin={isAdmin}
    />
  )
}
