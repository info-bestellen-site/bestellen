'use client'

import { useState, useEffect } from 'react'
import { Menu, ChefHat, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { AdminSidebar } from './AdminSidebar'

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode
  shopSlug: string
}

export function ResponsiveAdminLayout({ children, shopSlug }: ResponsiveAdminLayoutProps) {
  // isSidebarOpen controls the mobile drawer AND the desktop/ipad visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { t } = useTranslation()

  // On mobile, start closed. On tablet/desktop, start open.
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [])

  return (
    <div className="flex bg-surface-container-lowest min-h-screen relative overflow-x-hidden" suppressHydrationWarning>
      {/* Sidebar - Desktop Sticky, Mobile Drawered */}
      <AdminSidebar
        shopSlug={shopSlug}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-72' : 'pl-0'
        }`} 
        suppressHydrationWarning
      >
        {/* Universal Header (Mobile & Desktop Toggle) */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 sticky top-0 z-30 h-20">
          <div className="flex items-center gap-4" suppressHydrationWarning>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all active:scale-95"
              title={isSidebarOpen ? "Sidebar einklappen" : "Sidebar ausklappen"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-on-primary rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-primary/20">
                <ChefHat className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-sm uppercase leading-none">{t('admin')}</span>
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">Dashboard</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
             {/* Optional extra header info could go here */}
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
