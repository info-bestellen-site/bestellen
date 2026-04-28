'use client'

import { Download, ExternalLink, MoreVertical, Users, Calendar, Store, Upload, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { exportShopMenuAction, importCatalogAction } from '@/app/super-admin/actions'
import { MenuEngine } from '@/lib/admin/menu-engine'

interface Shop {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
}

export function ShopTable({ initialShops }: { initialShops: Shop[] }) {
  const [loadingShopId, setLoadingShopId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeShop, setActiveShop] = useState<Shop | null>(null)

  const handleExport = async (shop: Shop) => {
    setLoadingShopId(shop.id)
    try {
      const template = await exportShopMenuAction(shop.id)
      MenuEngine.downloadTemplate(
        template, 
        `katalog-vorlage-${shop.slug}-${new Date().toISOString().split('T')[0]}.json`
      )
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export fehlgeschlagen.')
    } finally {
      setLoadingShopId(null)
    }
  }

  const handleImportClick = (shop: Shop) => {
    setActiveShop(shop)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeShop) return

    setLoadingShopId(activeShop.id)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string)
        const result = await importCatalogAction(activeShop.id, content)
        
        if (result.success) {
          alert(`Erfolgreich importiert: ${result.stats.categories} Kategorien, ${result.stats.products} Produkte.`)
          window.location.reload()
        } else {
          alert('Import fehlgeschlagen.')
        }
      } catch (err) {
        console.error('Import failed:', err)
        alert('Ungültige Datei.')
      } finally {
        setLoadingShopId(null)
        setActiveShop(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl" suppressHydrationWarning>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50" suppressHydrationWarning>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500" suppressHydrationWarning>Shop</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500" suppressHydrationWarning>Inhaber (UID)</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500" suppressHydrationWarning>Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right" suppressHydrationWarning>Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100" suppressHydrationWarning>
            {initialShops.map((shop) => (
              <tr key={shop.id} className="group hover:bg-slate-50 transition-colors" suppressHydrationWarning>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-primary text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {shop.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-base text-slate-950">{shop.name}</p>
                      <p className="text-xs font-medium text-slate-500">/{shop.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {shop.owner_id.substring(0, 18)}...
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500" suppressHydrationWarning>
                      <Calendar className="w-3 h-3 text-primary/60" />
                      Seit {new Date(shop.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest">
                    Aktiv
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/${shop.slug}/admin`}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all font-bold"
                    >
                      <Settings2 className="w-4 h-4" />
                      Verwalten
                    </Link>
                    <Link 
                      href={`/${shop.slug}`}
                      target="_blank"
                      className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:text-slate-900 hover:bg-slate-200 transition-all border border-transparent"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleExport(shop)}
                      disabled={loadingShopId === shop.id}
                      className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 font-bold"
                    >
                      {loadingShopId === shop.id && !activeShop ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Export
                    </button>
                    <button 
                      onClick={() => handleImportClick(shop)}
                      disabled={loadingShopId === shop.id}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50 font-bold"
                    >
                      {loadingShopId === shop.id && activeShop?.id === shop.id ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Import
                    </button>
                    <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!initialShops.length && (
        <div className="p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
            <Store className="w-10 h-10" />
          </div>
          <p className="text-slate-400 text-sm font-medium italic">Noch keine Shops im System vorhanden.</p>
        </div>
      )}
    </div>
  )
}
