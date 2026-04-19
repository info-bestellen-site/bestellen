'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, Image as ImageIcon, X, Check } from 'lucide-react'
import { getGlobalTemplatesAction } from '@/app/super-admin/actions'
import { Modal } from '@/components/ui/Modal'

interface Template {
  id: string
  name: string
  description: string
  image_url: string
  categories?: { name: string }
}

interface LibraryPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string) => void
  onMatchFound?: (imageUrl: string) => void
}

export function LibraryPickerModal({ isOpen, onClose, onSelect }: LibraryPickerModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const data = await getGlobalTemplatesAction()
      setTemplates(data as any)
    } catch (err) {
      console.error('Failed to fetch library templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.categories?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aus Bibliothek wählen">
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Vorlagen durchsuchen..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lade Bibliothek...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ImageIcon className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keine Vorlagen gefunden</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template.image_url)
                    onClose()
                  }}
                  className="group flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg transition-all text-left"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    {template.image_url ? (
                      <img src={template.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={template.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <ImageIcon className="w-6 h-6 text-slate-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Check className="w-8 h-8 text-on-primary" />
                    </div>
                    {template.categories?.name && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">
                          {template.categories.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-black uppercase tracking-tight italic text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                      {template.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
