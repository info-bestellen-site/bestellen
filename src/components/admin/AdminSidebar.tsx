'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrendingUp,
  ChefHat,
  Settings,
  UtensilsCrossed,
  LogOut,
  LayoutDashboard,
  ExternalLink,
  CalendarDays,
  X,
  CreditCard
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useState, useEffect } from 'react'
import { hasFeature, SubscriptionTier } from '@/config/subscriptions'

export function AdminSidebar({
  shopSlug,
  isOpen,
  onClose
}: {
  shopSlug: string,
  isOpen?: boolean,
  onClose?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()
  const [tier, setTier] = useState<SubscriptionTier>('starter')

  useEffect(() => {
    async function fetchTier() {
      const { data } = await supabase
        .from('shops')
        .select('subscription_tier')
        .eq('slug', shopSlug)
        .single()
      
      if (data?.subscription_tier) {
        setTier(data.subscription_tier as SubscriptionTier)
      }
    }
    fetchTier()
  }, [shopSlug, supabase])

  const navItems = [
    { label: t('monitor'), icon: ChefHat, href: `/${shopSlug}/admin` },
    { label: t('reservations'), icon: CalendarDays, href: `/${shopSlug}/admin/reservations`, feature: 'reservations' },
    { label: t('orders'), icon: LayoutDashboard, href: `/${shopSlug}/admin/orders` },
    { label: t('menu'), icon: UtensilsCrossed, href: `/${shopSlug}/admin/menu` },
    { label: t('analytics'), icon: TrendingUp, href: `/${shopSlug}/admin/analytics`, feature: 'analytics', badge: 'AI-Max' },
    { label: t('settings'), icon: Settings, href: `/${shopSlug}/admin/settings` },
    { label: t('subscription'), icon: CreditCard, href: `/${shopSlug}/admin/subscription` },
  ].filter(item => !item.feature || hasFeature(tier, item.feature))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:fixed lg:top-20 left-0 z-50
        w-72 h-screen lg:h-[calc(100vh-80px)] bg-white border-r border-outline-variant/10 flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary text-on-primary rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-primary/20 transition-all group-hover:scale-105 active:scale-95">
                <ChefHat className="w-full h-full" />
              </div>
              <span className="text-xl font-black tracking-tighter text-on-surface">Bestellen</span>
            </Link>
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/10 translate-x-1'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-on-surface-variant/40'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-outline-variant/5 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-error border border-transparent hover:border-error/10 hover:bg-error/5 transition-all"
          >
            <LogOut className="w-5 h-5 opacity-60" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
