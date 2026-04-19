'use client'

import { useState, useEffect } from 'react'
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
  ChevronDown
} from 'lucide-react'
import { getGlobalTemplatesAction, addTemplateAction, deleteTemplateAction } from '@/app/super-admin/actions'
import { ImageUploadButton } from './ImageUploadButton'

interface Template {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  categories?: { name: string }
}

export function GlobalTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category_name: 'Döner'
  })

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await addTemplateAction(newTemplate)
      setShowAddModal(false)
      fetchTemplates()
      setNewTemplate({ name: '', description: '', price: 0, image_url: '', category_name: 'Döner' })
    } catch (err) {
      console.error(err)
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
          onClick={() => setShowAddModal(true)}
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
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {template.categories?.name || 'Produkt'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-black uppercase tracking-tight italic text-slate-900 line-clamp-1">{template.name}</h3>
                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 h-8">{template.description}</p>
                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <p className="text-sm font-black tracking-tight">{template.price.toFixed(2)} €</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Neue Vorlage</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategorie</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={newTemplate.category_name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category_name: e.target.value })}
                      placeholder="z.B. Döner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="z.B. Döner Kebap"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Beschreibung</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-600 focus:outline-none focus:border-primary/30 transition-all h-24 resize-none"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Standard-Beschreibung für dieses Produkt..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <ImageUploadButton 
                      onUploadComplete={(url) => setNewTemplate({ ...newTemplate, image_url: url })}
                      currentImageUrl={newTemplate.image_url}
                      label="Produktbild hochladen (Wichtig)"
                      folder="templates"
                    />
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100"></span>
                      </div>
                      <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                        <span className="bg-white px-4 text-slate-300">Oder Bild-URL</span>
                      </div>
                    </div>

                    <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={newTemplate.image_url}
                      onChange={(e) => setNewTemplate({ ...newTemplate, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => {
                    const el = document.getElementById('price-optional');
                    if (el) el.classList.toggle('hidden');
                  }}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Optional: Preis (€)</label>
                    <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <div id="price-optional" className="mt-4 hidden animate-in slide-in-from-top-2">
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all"
                      value={newTemplate.price}
                      onChange={(e) => setNewTemplate({ ...newTemplate, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
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
