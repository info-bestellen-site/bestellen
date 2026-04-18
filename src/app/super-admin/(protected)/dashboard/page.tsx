import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { 
  Plus, 
  ExternalLink, 
  Download, 
  Search,
  Users,
  Calendar,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

import { ShopTable } from '@/components/admin/super-admin/ShopTable'
import { DashboardHeader } from '@/components/admin/super-admin/DashboardHeader'

export default async function SuperAdminDashboard() {
  const supabase = createAdminSupabaseClient()
  
  // Fetch all shops with some basic info
  const { data: shops, error } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-12 text-center text-error border border-error/20 bg-error/5 rounded-3xl m-8">
        Fehler beim Laden der Shops: {error.message}
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-12 space-y-12 bg-[#F8F9FA] min-h-screen">
      <DashboardHeader />

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gesamt Shops</p>
          <p className="text-4xl font-black text-slate-950">{shops?.length || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neue Shops (7 Tage)</p>
          <p className="text-4xl font-black text-primary">0</p>
        </div>
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Status</p>
          <p className="text-4xl font-black text-success">OK</p>
        </div>
      </div>

      {/* Shops Table */}
      <ShopTable initialShops={shops || []} />
    </div>
  )
}
