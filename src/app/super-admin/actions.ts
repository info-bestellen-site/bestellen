'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MenuEngine, MenuTemplate } from '@/lib/admin/menu-engine'
import { normalizeSlug } from '@/lib/utils/slug'

export async function exportShopMenuAction(shopId: string): Promise<MenuTemplate> {
  const supabase = createAdminSupabaseClient()
  return await MenuEngine.exportMenu(supabase, shopId)
}

export async function importCatalogAction(shopId: string, template: MenuTemplate) {
  const supabase = createAdminSupabaseClient()
  return await MenuEngine.importMenu(supabase, shopId, template)
}

export async function importMagicMenuAction(shopId: string, categories: any[]) {
  const supabase = createAdminSupabaseClient()
  
  const stats = {
    categories: 0,
    products: 0
  }

  for (const cat of categories) {
    // 1. Create Category
    const { data: category, error: catError } = await (supabase
      .from('categories') as any)
      .insert({
        shop_id: shopId,
        name: cat.name,
        sort_order: stats.categories
      })
      .select()
      .single()

    if (catError || !category) continue
    stats.categories++

    // 2. Create Products
    for (const [idx, prod] of cat.products.entries()) {
      const { error: prodError } = await (supabase
        .from('products') as any)
        .insert({
          shop_id: shopId,
          category_id: category.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          image_url: prod.image_url || null,
          sort_order: idx
        })

      if (!prodError) stats.products++
    }
  }

  return { success: true, stats }
}

export async function createShopAction(formData: {
  name: string
  slug: string
  email: string
  password?: string
}) {
  const supabase = createAdminSupabaseClient()
  
  try {
    // 1. Check if user already exists or create new one
    let userId: string

    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const user = existingUser.users.find(u => u.email === formData.email)

    if (user) {
      userId = user.id
    } else {
      if (!formData.password) throw new Error('Passwort erforderlich für neuen Benutzer')
      
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { role: 'shop_owner' }
      })

      if (authError) throw authError
      userId = newUser.user.id
    }

    // 2. Create the shop
    const { data: shop, error: shopError } = await (supabase
      .from('shops') as any)
      .insert({
        name: formData.name,
        slug: normalizeSlug(formData.slug),
        owner_id: userId,
        is_open: true
      })
      .select()
      .single()

    if (shopError) throw shopError

    return { success: true, shop }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}


export async function getGlobalLibraryShopAction() {
  const supabase = createAdminSupabaseClient()
  
  // Try to find the global library shop
  const { data: existingShop } = await (supabase
    .from('shops') as any)
    .select('id, name')
    .eq('slug', 'global-library')
    .single()

  if (existingShop) return existingShop

  // Create it if it doesn't exist
  // Use the current super-admin ID as owner
  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  
  let adminId = user?.id

  // Fallback: If no current user (unlikely in this context), try to find any super-admin
  if (!adminId) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const admin = users.find(u => u.app_metadata?.role === 'super_admin')
    if (!admin) throw new Error('Kein Super-Admin gefunden (Session missing and no admin in list)')
    adminId = admin.id
  }

  const { data: newShop, error } = await (supabase
    .from('shops') as any)
    .insert({
      name: 'Bestellen Global Library',
      slug: 'global-library',
      owner_id: adminId,
      is_open: true
    })
    .select('id, name')
    .single()

  if (error) throw error
  return newShop
}

export async function getGlobalTemplatesAction() {
  const supabase = createAdminSupabaseClient()
  const shop = await getGlobalLibraryShopAction()
  
  const { data: products, error } = await (supabase
    .from('products') as any)
    .select('*, categories(name)')
    .eq('shop_id', shop.id)
    .order('name')

  if (error) throw error

  // Generate signed URLs for images stored in Supabase
  const productsWithSignedUrls = await Promise.all((products || []).map(async (product: any) => {
    if (product.image_url && product.image_url.includes('storage/v1/object/public')) {
      // Extract bucket and path from URL
      // Example: .../storage/v1/object/public/product-images/path/to/image.jpg
      const parts = product.image_url.split('/storage/v1/object/public/')
      if (parts.length > 1) {
        const fullPath = parts[1]
        const bucket = fullPath.split('/')[0]
        const path = fullPath.split('/').slice(1).join('/')

        const { data: signedUrlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600) // 1 hour expiry

        if (signedUrlData) {
          return { ...product, image_url: signedUrlData.signedUrl }
        }
      }
    }
    return product
  }))

  return productsWithSignedUrls
}

export async function searchLibraryBulkAction(productNames: string[]) {
  const supabase = createAdminSupabaseClient()
  const shop = await getGlobalLibraryShopAction()
  
  if (!productNames || productNames.length === 0) return {}

  // We search for all products in one go by using a combined ILIKE or a more efficient approach
  // Since pg doesn't have a direct 'ilike any array' that works well with wildcards easily,
  // we can use the 'any' operator with a prepared array of patterns
  // Generate individual ILIKE conditions for each product name
  const orConditions = productNames
    .map(name => `name.ilike.%${name.replace(/[()&,]/g, '')}%`)
    .join(',')

  const { data: products, error } = await (supabase
    .from('products') as any)
    .select('*, categories(name)')
    .eq('shop_id', shop.id)
    .or(orConditions)
    .limit(100)

  if (error) {
    console.error('Bulk search error:', error)
    return {}
  }

  // Group by matching name (fuzzy)
  const matches: Record<string, any[]> = {}
  for (const name of productNames) {
    const found = products.filter((p: any) => 
      p.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(p.name.toLowerCase())
    )
    if (found.length > 0) matches[name] = found
  }

  return matches
}

export async function addTemplateAction(data: {
  name: string
  description: string
  price?: number
  image_url: string
  category_name?: string
}) {
  const supabase = createAdminSupabaseClient()
  const shop = await getGlobalLibraryShopAction()
  
  const categoryName = data.category_name || 'Standard'
  const price = data.price || 0

  // 1. Ensure category exists in library
  let { data: category } = await (supabase
    .from('categories') as any)
    .select('id')
    .eq('shop_id', shop.id)
    .eq('name', categoryName)
    .single()

  if (!category) {
    const { data: newCat, error: catError } = await (supabase
      .from('categories') as any)
      .insert({
        shop_id: shop.id,
        name: categoryName,
        sort_order: 0
      })
      .select('id')
      .single()
    
    if (catError) throw catError
    category = newCat
  }

  // 2. Insert product
  const { data: product, error: prodError } = await (supabase
    .from('products') as any)
    .insert({
      shop_id: shop.id,
      category_id: category.id,
      name: data.name,
      description: data.description,
      price: price,
      image_url: data.image_url,
      sort_order: 0,
      is_available: true
    })
    .select()
    .single()

  if (prodError) throw prodError
  return { success: true, product }
}

export async function deleteTemplateAction(id: string) {
  const supabase = createAdminSupabaseClient()
  const { error } = await (supabase
    .from('products') as any)
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return { success: true }
}
