'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
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
    const { data: category, error: catError } = await supabase
      .from('categories')
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
      const { error: prodError } = await supabase
        .from('products')
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
    const { data: shop, error: shopError } = await supabase
      .from('shops')
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

