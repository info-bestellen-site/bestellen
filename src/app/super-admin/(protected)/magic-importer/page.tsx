import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { MagicImporter } from '@/components/admin/super-admin/MagicImporter'

export default async function MagicImporterPage() {
  const supabase = createAdminSupabaseClient()
  
  // Fetch available shops for target selection
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, slug')
    .order('name')

  return <MagicImporter shops={shops || []} />
}
