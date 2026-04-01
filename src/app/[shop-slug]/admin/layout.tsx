import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ 'shop-slug': string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  // Strict check: only owner can access admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: shop } = await supabase
    .from('shops')
    .select('id, owner_id')
    .eq('slug', slug)
    .single()

  if (!shop || shop.owner_id !== user.id) {
    redirect('/auth/login')
  }

  return (
    <div className="flex bg-surface-container-lowest min-h-screen">
      <AdminSidebar shopSlug={slug} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
