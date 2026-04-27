import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MenuList } from '@/components/menu/MenuList'
import { notFound } from 'next/navigation'
import { isShopOpen } from '@/lib/utils/open-hours'

interface ShopPageProps {
  params: Promise<{ 'shop-slug': string }>
}

async function ShopPage({ params }: ShopPageProps) {
  const { 'shop-slug': slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const supabase = await createServerSupabaseClient()

  // Fetch shop, categories and products
  const { data: shop } = await (supabase as any)
    .from('shops')
    .select('*')
    .eq('slug', decodedSlug)
    .single()

  if (!shop) notFound()
  
  // Check if current user is the shop owner
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.id === shop.owner_id

  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order')

  const { data: products } = await (supabase as any)
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order')

  // Fetch opening hours
  const { data: hours } = await (supabase as any).from('opening_hours').select('*').eq('shop_id', shop.id)
  const isCurrentlyOpen = isShopOpen(hours || [], shop.is_open, shop.manual_status_updated_at, 'general', shop.order_cutoff_minutes)

  let isLimitReached = false;
  if (shop.subscription_tier === 'starter') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await (supabase as any)
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .gte('created_at', startOfMonth.toISOString());
      
    if (count !== null && count >= 100) { // Limit is 100 for Starter
      isLimitReached = true;
    }
  }

  return (
    <MenuList 
      shop={shop} 
      categories={categories || []} 
      products={products || []} 
      isAdmin={isAdmin}
      isCurrentlyOpen={isCurrentlyOpen && !isLimitReached}
      isLimitReached={isLimitReached}
      hours={hours || []}
    />
  )
}

export default ShopPage;
