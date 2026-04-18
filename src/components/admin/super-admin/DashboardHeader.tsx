'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { CreateShopModal } from './CreateShopModal'

export function DashboardHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Übersicht</p>
          <h1 className="text-4xl font-black uppercase tracking-tight italic text-slate-900">Shop Übersicht</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Shop suchen..." 
              className="pl-11 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium w-64 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Neuer Shop
          </button>
        </div>
      </div>

      <CreateShopModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
