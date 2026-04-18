'use client'

import { useState, useEffect } from 'react'
import { X, Store, Link as LinkIcon, Mail, Lock, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import { createShopAction } from '@/app/super-admin/actions'
import { useRouter } from 'next/navigation'
import { normalizeSlug } from '@/lib/utils/slug'

interface CreateShopModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateShopModal({ isOpen, onClose }: CreateShopModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: normalizeSlug(formData.name) }))
    }
  }, [formData.name])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createShopAction(formData)
      if (result.success) {
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'Fehler beim Erstellen des Shops')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="p-10 sm:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Administration</p>
              <h2 className="text-3xl font-black uppercase tracking-tight italic text-slate-900">Neuer Shop</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Shop Info */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shop Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      required
                      placeholder="Shop Name"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      required
                      placeholder="Slug (lukas-steak)"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: normalizeSlug(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inhaber Account</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    required
                    type="email"
                    placeholder="E-Mail Adresse"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    required
                    type="password"
                    placeholder="Passwort"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="bg-error/10 text-error text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl text-center">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-5 bg-primary text-on-primary rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Shop erstellen
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
