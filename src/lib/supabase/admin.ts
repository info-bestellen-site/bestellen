import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * WARNING: This client uses the SUPABASE_SERVICE_ROLE_KEY which bypasses all RLS policies.
 * It MUST NEVER be used on the client-side or exposed to the browser.
 * Use this only in Server Actions, API routes, or Server Components.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase Admin environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Creates a Super Admin user with email verification skipped.
 * Use this to manually provision admin accounts.
 */
export async function createSuperAdmin(email: string, password: string, metadata: any = {}) {
  const supabase = createAdminSupabaseClient()
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      role: 'super_admin',
      ...metadata 
    }
  })

  if (error) {
    console.error('Error creating super admin:', error)
    throw error
  }

  return data.user
}
