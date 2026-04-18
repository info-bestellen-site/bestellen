import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, 
  Store, 
  Wand2, 
  LogOut, 
  ArrowLeft,
  Settings,
  Database
} from 'lucide-react'

export default async function SuperAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'super_admin') {
    redirect('/super-admin')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex selection:bg-primary/20" id="super-admin-layout">
      <style dangerouslySetInnerHTML={{ __html: `
        body { background-color: #F8F9FA !important; color: #0f172a !important; }
        #super-admin-layout { background-color: #F8F9FA !important; }
      `}} />
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100 bg-white">
          <Link href="/super-admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-on-primary" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-tight italic leading-none text-slate-900">ADMIN</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Super Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <Link 
            href="/super-admin/dashboard" 
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold bg-slate-50 border border-slate-100 text-slate-900 shadow-sm hover:bg-slate-100 transition-all"
          >
            <Store className="w-5 h-5 text-primary" />
            Shops
          </Link>
          <Link 
            href="/super-admin/magic-importer" 
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <Wand2 className="w-5 h-5 text-slate-400" />
            Magic Importer
          </Link>
          <Link 
            href="/super-admin/templates" 
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <Database className="w-5 h-5 text-slate-400" />
            Globale Vorlagen
          </Link>
        </nav>

        <div className="p-8 border-t border-slate-100 space-y-6 bg-white">
          <Link href="/" className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Website
          </Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-error border border-error/20 hover:bg-error/5 transition-all">
            <LogOut className="w-5 h-5" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 bg-[#F8F9FA] min-h-screen">
        {children}
      </main>
    </div>
  )
}
