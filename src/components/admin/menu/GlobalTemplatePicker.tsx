'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, Image as ImageIcon, CheckCircle2, Sparkles, X } from 'lucide-react'
import { getGlobalTemplatesAction } from '@/app/super-admin/actions'

interface Template {
  id: string
  name: string
  description: string
  image_url: string
  categories?: { name: string }
}

interface GlobalTemplatePickerProps {
  onSelect: (template: Template) => void
  onClose: () => void
}

export function GlobalTemplatePicker({ onSelect, onClose }: GlobalTemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await getGlobalTemplatesAction()
        setTemplates(data as any)
      } catch (err) {
        console.error('Failed to fetch templates:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full max-h-[70vh] bg-white rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight italic">Globale Vorlagen</h3>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Wähle ein Produkt aus der Bibliothek</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-surface-container-low rounded-full transition-all"
        >
          <X className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>

      <div className="p-6 bg-surface-container-lowest border-b border-outline-variant/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
          <input
            type="text"
            autoFocus
            placeholder="Vorlagen durchsuchen..."
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Lade Bibliothek...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-on-surface-variant/10" />
            <p className="text-sm font-bold text-on-surface-variant italic">Keine passenden Vorlagen gefunden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group flex flex-col text-left bg-surface-container-low rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary transition-all active:scale-95 border border-outline-variant/5"
              >
                <div className="aspect-[4/3] relative bg-surface-container-medium">
                  {template.image_url ? (
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-on-surface-variant/20" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-black text-xs uppercase tracking-tight line-clamp-1">{template.name}</h4>
                  {template.categories?.name && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">{template.categories.name}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
