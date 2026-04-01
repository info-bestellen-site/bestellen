'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  ChefHat, 
  Settings, 
  UtensilsCrossed, 
  LogOut,
  LayoutDashboard,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AdminSidebar({ shopSlug }: { shopSlug: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { label: 'Küchen-Monitor', icon: ChefHat, href: `/${shopSlug}/admin` },
    { label: 'Bestellungen', icon: LayoutDashboard, href: `/${shopSlug}/admin/orders` },
    { label: 'Speisekarte', icon: UtensilsCrossed, href: `/${shopSlug}/admin/menu` },
    { label: 'Analyse', icon: BarChart3, href: `/${shopSlug}/admin/analysis` },
    { label: 'Einstellungen', icon: Settings, href: `/${shopSlug}/admin/settings` },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-72 bg-white border-r border-outline-variant/10 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <div className="w-10 h-10 bg-primary text-on-primary rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-primary/20 transition-all group-hover:scale-105 active:scale-95">
            <ChefHat className="w-full h-full" />
          </div>
          <span className="text-xl font-black tracking-tighter">Bestellen</span>
        </Link>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/10 translate-x-1' 
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-on-surface-variant/40'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-outline-variant/5 space-y-4">
        <Link 
          href={`/${shopSlug}`} 
          target="_blank"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-all"
        >
          <span>Shop ansehen</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-40" />
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-error border border-transparent hover:border-error/10 hover:bg-error/5 transition-all"
        >
          <LogOut className="w-5 h-5 opacity-60" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
