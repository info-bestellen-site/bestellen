'use client'

import { useState } from 'react'
import { Menu, ChefHat } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { AdminSidebar } from './AdminSidebar'

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode
  shopSlug: string
}

export function ResponsiveAdminLayout({ children, shopSlug }: ResponsiveAdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="flex bg-surface-container-lowest min-h-screen relative">
      {/* Sidebar - Desktop Sticky, Mobile Drawered */}
      <AdminSidebar
        shopSlug={shopSlug}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">


        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-on-primary rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-primary/20">
                <ChefHat className="w-full h-full" />
              </div>
              <span className="font-black tracking-tight text-sm uppercase">{t('admin')}</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
