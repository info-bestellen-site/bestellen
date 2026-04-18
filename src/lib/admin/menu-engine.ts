import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export interface MenuTemplate {
  categories: any[]
  products: any[]
  modifierGroups: any[]
  modifierOptions: any[]
  upsellRules: any[]
  version: string
  exportedAt: string
}

/**
 * Utility to export and import shop menu structures.
 */
export const MenuEngine = {
  /**
   * Fetches all menu-related data for a shop and returns it as a JSON object.
   */
  async exportMenu(supabase: SupabaseClient<Database>, shopId: string): Promise<MenuTemplate> {
    const { data: categories } = await supabase.from('categories').select('*').eq('shop_id', shopId)
    const { data: products } = await supabase.from('products').select('*').eq('shop_id', shopId)
    const { data: modifierGroups } = await supabase.from('modifier_groups').select('*').eq('shop_id', shopId)
    
    // For options, we fetch all options belonging to the groups of this shop
    const groupIds = (modifierGroups || []).map(g => g.id)
    const { data: modifierOptions } = groupIds.length > 0 
      ? await supabase.from('modifier_options').select('*').in('group_id', groupIds)
      : { data: [] }

    const { data: upsellRules } = await supabase.from('upsell_rules').select('*').eq('shop_id', shopId)

    return {
      categories: categories || [],
      products: products || [],
      modifierGroups: modifierGroups || [],
      modifierOptions: modifierOptions || [],
      upsellRules: upsellRules || [],
      version: '1.0',
      exportedAt: new Date().toISOString()
    }
  },

  /**
   * Imports a menu template into a shop, remapping IDs to maintain relationships.
   */
  async importMenu(supabase: SupabaseClient<Database>, shopId: string, template: MenuTemplate): Promise<{ success: boolean; stats: any }> {
    const categoryMap = new Map<string, string>() // oldId -> newId
    const productMap = new Map<string, string>()  // oldId -> newId
    const groupMap = new Map<string, string>()    // oldId -> newId

    const stats = {
      categories: 0,
      products: 0,
      groups: 0,
      options: 0,
      rules: 0
    }

    // 1. Categories
    for (const cat of template.categories) {
      const { data, error } = await (supabase.from('categories') as any).insert({
        name: cat.name,
        shop_id: shopId,
        sort_order: cat.sort_order
      }).select().single()
      
      if (data) {
        categoryMap.set(cat.id, data.id)
        stats.categories++
      }
    }

    // 2. Products
    for (const prod of template.products) {
      const newCategoryId = categoryMap.get(prod.category_id)
      if (!newCategoryId) continue

      const { data, error } = await (supabase.from('products') as any).insert({
        name: prod.name,
        description: prod.description,
        price: prod.price,
        image_url: prod.image_url,
        category_id: newCategoryId,
        shop_id: shopId,
        allergens: prod.allergens,
        is_available: prod.is_available,
        is_hidden_from_menu: prod.is_hidden_from_menu,
        preparation_time_minutes: prod.preparation_time_minutes,
        sort_order: prod.sort_order
      }).select().single()

      if (data) {
        productMap.set(prod.id, data.id)
        stats.products++
      }
    }

    // 3. Modifier Groups
    for (const group of template.modifierGroups) {
      const newProductId = productMap.get(group.product_id)
      if (!newProductId) continue

      const { data, error } = await (supabase.from('modifier_groups') as any).insert({
        name: group.name,
        description: group.description,
        product_id: newProductId,
        shop_id: shopId,
        is_required: group.is_required,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        sort_order: group.sort_order
      }).select().single()

      if (data) {
        groupMap.set(group.id, data.id)
        stats.groups++
      }
    }

    // 4. Modifier Options
    for (const opt of template.modifierOptions) {
      const newGroupId = groupMap.get(opt.group_id)
      if (!newGroupId) continue

      const { error } = await (supabase.from('modifier_options') as any).insert({
        group_id: newGroupId,
        name: opt.name,
        price_delta: opt.price_delta,
        is_default: opt.is_default,
        sort_order: opt.sort_order
      })

      if (!error) stats.options++
    }

    // 5. Upsell Rules
    for (const rule of template.upsellRules) {
      const newTriggerId = productMap.get(rule.trigger_product_id)
      const newUpsellId = productMap.get(rule.upsell_product_id)
      
      if (!newUpsellId) continue // Upsell product is required

      const { error } = await (supabase.from('upsell_rules') as any).insert({
        shop_id: shopId,
        trigger_product_id: newTriggerId || null,
        upsell_product_id: newUpsellId,
        bundle_price: rule.bundle_price,
        sort_order: rule.sort_order,
        is_active: rule.is_active
      })

      if (!error) stats.rules++
    }

    return { success: true, stats }
  },

  /**
   * Triggers a browser download for the template data.
   */
  downloadTemplate(data: MenuTemplate, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
