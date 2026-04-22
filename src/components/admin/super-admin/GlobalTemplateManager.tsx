'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Database,
  ArrowRight,
  Save,
  Grid,
  List,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { useCallback } from 'react'
import { getGlobalTemplatesAction, addTemplateAction, deleteTemplateAction } from '@/app/super-admin/actions'
import { ImageUploadButton } from './ImageUploadButton'

interface Template {
  id: string
  name: string
  description: string
  image_url: string
}

// ULTIMATE PERSISTENCE: Outside the component life-cycle
let globalPersistenceUrl = ''

export function GlobalTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    image_url: '',
  })

  // BACKUP STORAGE for React 19/Next 16 state flickering
  const imageUrlRef = useRef('')


  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const data = await getGlobalTemplatesAction()
      setTemplates(data as any)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = useCallback((url: string) => {
    if (!url) return
    console.log('--- UPLOAD COMPLETE ---', url)
    
    // 1. PERMANENT STORAGE
    localStorage.setItem('magic_importer_last_url', url)
    
    // 2. DOM FORCE: Direct manipulation to bypass React state
    const hiddenInput = document.getElementById('indestructible-url-keeper') as HTMLInputElement
    if (hiddenInput) {
      hiddenInput.value = url
      console.log('--- DOM UPDATED ---', url)
    }
    
    globalPersistenceUrl = url
    imageUrlRef.current = url
    if (typeof window !== 'undefined') (window as any).lastUploadedUrl = url
    setNewTemplate(prev => ({ ...prev, image_url: url }))
  }, [])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // NATIVE DOM EXTRACTION
    const formData = new FormData(e.currentTarget)
    const domUrl = formData.get('image_url_fallback') as string

    const finalImageUrl = domUrl || 
                        newTemplate.image_url || 
                        imageUrlRef.current || 
                        globalPersistenceUrl || 
                        localStorage.getItem('magic_importer_last_url') ||
                        (typeof window !== 'undefined' ? (window as any).lastUploadedUrl : '')

    const payload = {
      ...newTemplate,
      image_url: finalImageUrl
    }

    try {
      await addTemplateAction(payload)
      
      // CLEANUP ALL PERSISTENCE LAYERS
      localStorage.removeItem('magic_importer_last_url')
      globalPersistenceUrl = '' 
      imageUrlRef.current = ''
      const hiddenInput = document.getElementById('indestructible-url-keeper') as HTMLInputElement
      if (hiddenInput) hiddenInput.value = ''
      if (typeof window !== 'undefined') delete (window as any).lastUploadedUrl

      setShowAddModal(false)
      fetchTemplates()
      setNewTemplate({ name: '', description: '', image_url: '' })
    } catch (err: any) {
      console.error('Save template error:', err)
      setError(err.message || 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchtest du die Vorlage "${name}" wirklich löschen?`)) return
    
    try {
      await deleteTemplateAction(id)
      fetchTemplates()
    } catch (err) {
      console.error(err)
      alert('Löschen fehlgeschlagen.')
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Service Assets</p>
          <h1 className="text-4xl font-black uppercase tracking-tight italic">Global Templates</h1>
        </div>

        <button 
          onClick={() => {
            setShowAddModal(true)
            setError(null)
          }}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Vorlage erstellen
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Vorlagen durchsuchen..."
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gesamt</p>
            <p className="text-2xl font-black">{templates.length}</p>
          </div>
          <Database className="w-8 h-8 text-primary/20" />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lade Bibliothek...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[3rem] space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black italic uppercase tracking-tight">Keine Vorlagen gefunden</h3>
            <p className="text-slate-400 text-sm font-medium">Erstelle deine erste Vorlage für den Magic Importer.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredTemplates.map(template => (
            <div key={template.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                {template.image_url ? (
                  <img 
                    src={template.image_url} 
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-black uppercase tracking-tight italic text-slate-900 line-clamp-1">{template.name}</h3>
                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 h-8">{template.description}</p>
                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="w-4 h-4" /> {/* Spacer */}
                  <button 
                    onClick={() => handleDelete(template.id, template.name)}
                    className="p-2 text-slate-300 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-300"
        >
          <div 
            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Neue Vorlage</h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false)
                    setError(null)
                  }}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error animate-in zoom-in-95 duration-300">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-6">
                {/* NATIVE DOM FALLBACK INPUT */}
                <input 
                  type="hidden" 
                  name="image_url_fallback" 
                  id="indestructible-url-keeper" 
                  defaultValue={newTemplate.image_url || imageUrlRef.current || globalPersistenceUrl || (typeof window !== 'undefined' ? localStorage.getItem('magic_importer_last_url') || '' : '')} 
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Döner Kebap"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Beschreibung</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-600 focus:outline-none focus:border-primary/30 transition-all h-24 resize-none"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Standard-Beschreibung für dieses Produkt..."
                  />
                </div>

                <div className="space-y-4">
                  <ImageUploadButton 
                    onUploadComplete={handleImageUpload}
                    currentImageUrl={newTemplate.image_url || imageUrlRef.current}
                    label="Produktbild hochladen"
                    folder="templates"
                    bucket="product-images"
                  />
                  
                  {/* Keep the hidden input for DOM Force survival */}
                  <input 
                    type="hidden"
                    name="image_url_fallback" 
                    id="indestructible-url-keeper" 
                    value={newTemplate.image_url || imageUrlRef.current || globalPersistenceUrl || (typeof window !== 'undefined' ? localStorage.getItem('magic_importer_last_url') || '' : '')} 
                  />

                  {(newTemplate.image_url || imageUrlRef.current || globalPersistenceUrl) && (
                    <div className="flex items-center gap-2 p-3 bg-success/5 border border-success/20 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-success">Bild erfolgreich verknüpft</span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-6 bg-primary text-on-primary rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Vorlage Speichern
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
