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
