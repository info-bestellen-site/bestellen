'use client'

import { useState, useRef } from 'react'
import { 
  Upload, 
  Wand2, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Loader2, 
  Table, 
  Plus,
  Trash2,
  Save,
  ImageIcon,
  ArrowRight,
  Database,
  Grid,
  Sparkles
} from 'lucide-react'
import { importMagicMenuAction, searchLibraryBulkAction } from '@/app/super-admin/actions'
import { ImageUploadButton } from './ImageUploadButton'
import { LibraryPickerModal } from './LibraryPickerModal'

interface Category {
  id: string
  name: string
  products: Product[]
}

interface Product {
  name: string
  price: number
  description: string
  image_url?: string
}

interface ShopInfo {
  id: string
  name: string
  slug: string
}

export function MagicImporter({ shops }: { shops: ShopInfo[] }) {
  const [step, setStep] = useState(1) // 1: Upload, 2: Review, 3: Deploy
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<{ categories: Category[] } | null>(null)
  const [targetShopId, setTargetShopId] = useState('')
  const [restaurantStyle, setRestaurantStyle] = useState('modern')
  const [libraryMatches, setLibraryMatches] = useState<Record<string, any[]>>({})
  const [searchingLibrary, setSearchingLibrary] = useState(false)
  const [activePickerProd, setActivePickerProd] = useState<{ catIdx: number, prodIdx: number } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch('/api/admin/ai/extract-menu', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Extraktion fehlgeschlagen')
      
      const data = await res.json()
      setExtractedData(data)
      setStep(2)
      
      // Trigger library search for all extracted products
      handleLibrarySearch(data.categories)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLibrarySearch = async (categories: Category[]) => {
    setSearchingLibrary(true)
    
    // Extract all product names for bulk search
    const productNames = categories.flatMap(cat => cat.products.map(p => p.name))
    
    try {
      const matches = await searchLibraryBulkAction(productNames)
      setLibraryMatches(matches)
    } catch (err) {
      console.error('Library search error:', err)
    } finally {
      setSearchingLibrary(false)
    }
  }

  const handleApplyAllLibraryMatches = () => {
    if (!extractedData) return
    const newData = { ...extractedData }
    let count = 0

    newData.categories.forEach(cat => {
      cat.products.forEach(prod => {
        const matches = libraryMatches[prod.name]
        if (matches && matches.length > 0 && !prod.image_url) {
          prod.image_url = matches[0].image_url
          count++
        }
      })
    })

    if (count > 0) {
      setExtractedData(newData)
      setSuccessMessage(`${count} Bilder aus der Bibliothek automatisch zugewiesen!`)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleUpdateProduct = (catIndex: number, prodIndex: number, field: string, value: any) => {
    if (!extractedData) return
    const newData = { ...extractedData }
    newData.categories[catIndex].products[prodIndex] = {
      ...newData.categories[catIndex].products[prodIndex],
      [field]: value
    }
    setExtractedData(newData)
  }

  const handleAddProduct = (catIndex: number) => {
    if (!extractedData) return
    const newData = { ...extractedData }
    newData.categories[catIndex].products.push({
      name: 'Neues Produkt',
      price: 0,
      description: ''
    })
    setExtractedData(newData)
  }

  const handleRemoveProduct = (catIndex: number, prodIndex: number) => {
    if (!extractedData) return
    const newData = { ...extractedData }
    newData.categories[catIndex].products.splice(prodIndex, 1)
    setExtractedData(newData)
  }

  const handleGenerateImages = async () => {
    if (!extractedData) return
    setLoading(true)
    setError(null)

    const newData = { ...extractedData }
    
    try {
      // We process products that have "generate image" intent (simplified here for all for now)
      // In a real app, we might want to do this sequentially or in batches to avoid timeouts
      for (const cat of newData.categories) {
        for (const prod of cat.products) {
          if (!prod.image_url) { // Only generate if no image
            const res = await fetch('/api/admin/ai/generate-images', {
              method: 'POST',
              body: JSON.stringify({ name: prod.name, description: prod.description, style: restaurantStyle })
            })
            if (res.ok) {
              const { imageUrl } = await res.json()
              prod.image_url = imageUrl
            }
          }
        }
      }
      setExtractedData(newData)
    } catch (err: any) {
      setError('Bildgenerierung fehlgeschlagen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalImport = async () => {
    if (!targetShopId || !extractedData) return
    setLoading(true)
    
    try {
      const result = await importMagicMenuAction(targetShopId, extractedData.categories)
      if (result.success) {
        alert(`Erfolg! ${result.stats.products} Produkte wurden importiert.`)
        window.location.href = '/super-admin/dashboard'
      }
    } catch (err: any) {
      setError('Import fehlgeschlagen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 sm:p-12 space-y-12">
      {/* Header & Steps */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Magic Experience</p>
          <h1 className="text-4xl font-black uppercase tracking-tight italic">AI Importer</h1>
        </div>

        <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-slate-400 bg-slate-50'}`}>1. Upload</div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 2 ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-slate-400 bg-slate-50'}`}>2. Review</div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 3 ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-slate-400 bg-slate-50'}`}>3. Deploy</div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center space-y-8 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 space-y-6">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 px-8 uppercase tracking-tight italic">Speisekarte hochladen</h2>
                <p className="text-slate-500 text-sm font-medium">Foto oder PDF per Drag & Drop oder Klick auswählen</p>
              </div>

              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={handleFileUpload}
                disabled={loading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {error && (
                <div className="flex items-center justify-center gap-2 text-error text-[10px] font-black uppercase tracking-widest bg-error/10 py-3 rounded-xl mx-8">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-2">
              <Wand2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gemini 2.0 Flash</p>
              <p className="text-xs font-medium text-slate-900 italic">Hochpräzise Menü-Extraktion</p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-2">
              <ImageIcon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Flux Pro AI</p>
              <p className="text-xs font-medium text-slate-900 italic">Perfekte Food-Fotografie</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && extractedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Schritt 2/3</p>
              <h2 className="text-4xl font-black uppercase tracking-tight italic">Review & Edit</h2>
            </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ziel-Shop</p>
                    <select 
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all shadow-sm"
                      value={targetShopId}
                      onChange={(e) => setTargetShopId(e.target.value)}
                    >
                      <option value="">Wählen...</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Zurück
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      disabled={!targetShopId}
                      className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      Weiter zu Deploy
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

          {/* Magic Match Bar */}
          {Object.keys(libraryMatches).length > 0 && (
            <div className="mb-12 p-1 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight italic text-xl">
                      {Object.keys(libraryMatches).length} Übereinstimmungen gefunden!
                    </h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Wir haben fertige Bilder in deiner Bibliothek entdeckt.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleApplyAllLibraryMatches}
                  className="w-full md:w-auto px-10 py-5 bg-primary text-on-primary rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check className="w-5 h-5" />
                  Alle Bilder anwenden
                </button>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-8 p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success animate-in zoom-in-95 duration-300">
              <Check className="w-5 h-5" />
              <p className="text-xs font-black uppercase tracking-widest">{successMessage}</p>
            </div>
          )}

          <div className="space-y-12">
            {extractedData.categories.map((cat, catIdx) => (
              <div key={cat.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Table className="w-5 h-5 text-primary" />
                    <input 
                      className="bg-transparent border-none focus:ring-0 font-black uppercase tracking-widest text-slate-900 text-lg w-auto"
                      value={cat.name}
                      onChange={(e) => {
                        const newData = { ...extractedData }
                        newData.categories[catIdx].name = e.target.value
                        setExtractedData(newData)
                      }}
                    />
                  </div>
                  <button onClick={() => handleAddProduct(catIdx)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                    <Plus className="w-4 h-4 text-primary" />
                    Produkt hinzufügen
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {cat.products.map((prod, prodIdx) => (
                    <div key={prodIdx} className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8 group hover:bg-slate-50/50 transition-colors">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Produkt & Beschreibung</label>
                          {libraryMatches[prod.name] && !prod.image_url && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">
                              <Sparkles className="w-3 h-3" />
                              Match gefunden
                            </span>
                          )}
                        </div>
                        <input 
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all mb-2"
                          value={prod.name}
                          onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'name', e.target.value)}
                        />
                        <textarea 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-600 focus:outline-none focus:border-primary/30 transition-all h-20 resize-none"
                          value={prod.description}
                          onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preis (€)</label>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-primary/30 transition-all translate-y-0.5"
                          value={prod.price}
                          onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-4">
                        <ImageUploadButton 
                          label="Eigenes Bild"
                          currentImageUrl={prod.image_url}
                          onUploadComplete={(url) => handleUpdateProduct(catIdx, prodIdx, 'image_url', url)}
                          folder="importer"
                        />
                        <button 
                          onClick={() => setActivePickerProd({ catIdx, prodIdx })}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:border-primary/20 hover:text-primary transition-all"
                        >
                          <Database className="w-4 h-4" />
                          Aus Bibliothek wählen
                        </button>
                      </div>
                      <div className="flex flex-col justify-between items-end pb-1">
                        <button 
                          onClick={() => handleRemoveProduct(catIdx, prodIdx)}
                          className="p-3 text-slate-300 hover:text-error hover:bg-error/5 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          Bild generieren?
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-md border-slate-200 bg-slate-50 text-primary focus:ring-0" 
                            checked={!prod.image_url} 
                            onChange={() => {}} // Controlled by image_url presence
                          />
                        </div>
                      </div>

                      {/* Library Suggestions */}
                      {libraryMatches[prod.name] && !prod.image_url && (
                        <div className="md:col-span-4 mt-4 p-6 bg-primary/[0.03] border border-primary/10 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">In Bibliothek gefunden</p>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {libraryMatches[prod.name].map((match: any) => (
                              <button 
                                key={match.id}
                                onClick={() => handleUpdateProduct(catIdx, prodIdx, 'image_url', match.image_url)}
                                className="flex-shrink-0 group relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm"
                              >
                                <div className="w-full h-full relative">
                                  {match.image_url ? (
                                    <img src={match.image_url} className="w-full h-full object-cover" alt={match.name} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                      <ImageIcon className="w-4 h-4 text-slate-200" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Check className="w-8 h-8 text-on-primary" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preview of chosen image */}
                      {prod.image_url && (
                        <div className="md:col-span-4 mt-4 flex items-center gap-6 p-4 bg-success/5 border border-success/10 rounded-3xl">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md">
                            <img src={prod.image_url} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-success italic">Bild ausgewählt</p>
                            <p className="text-xs font-medium text-slate-500">Dieses Bild wird importiert. Es wird keine KI-Generierung durchgeführt.</p>
                          </div>
                          <button 
                            onClick={() => handleUpdateProduct(catIdx, prodIdx, 'image_url', undefined)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-error transition-colors"
                          >
                            Entfernen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Deploy */}
      {step === 3 && extractedData && (
        <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
              <Database className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight italic text-slate-900">Finaler Import</h2>
            <p className="text-slate-500 text-sm font-medium">Wähle den Ziel-Shop aus, in den das Menü eingespielt werden soll.</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Ziel-Shop auswählen</label>
              <select 
                value={targetShopId}
                onChange={(e) => setTargetShopId(e.target.value)}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-900 font-bold focus:outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">Wähle einen Shop...</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name} (/{shop.slug})</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Foto-Stil (Hintergrund & Licht)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'imbiss', label: 'Imbiss', desc: 'Pappteller & Tageslicht' },
                  { id: 'fine_dining', label: 'High-End', desc: 'Porzellan & Ambiente' },
                  { id: 'rustic', label: 'Rustikal', desc: 'Holz & Gusseisen' },
                  { id: 'modern', label: 'Modern', desc: 'Minimalistisch & Hell' },
                  { id: 'fast_food', label: 'Fast Food', desc: 'Werbe-Optik' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => setRestaurantStyle(style.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      restaurantStyle === style.id 
                        ? 'border-primary bg-primary/[0.02] ring-4 ring-primary/5' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest ${restaurantStyle === style.id ? 'text-primary' : 'text-slate-900'}`}>{style.label}</p>
                    <p className="text-[9px] font-medium text-slate-400 leading-tight mt-1">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Voraussichtliche Kosten</span>
                <span className="text-primary font-black">BETA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 italic">AI Bild-Generierung ({extractedData.categories.reduce((acc, c) => acc + c.products.length, 0)} Bilder)</span>
                <span className="text-lg font-black tracking-tight underline decoration-primary/30 underline-offset-4 text-slate-900">~ {(extractedData.categories.reduce((acc, c) => acc + c.products.length, 0) * 0.02).toFixed(2)} EUR</span>
              </div>
              <button 
                onClick={handleGenerateImages}
                disabled={loading}
                className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-slate-800"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4 text-primary" />}
                Alle Bilder generieren
              </button>
            </div>

            <button
              onClick={handleFinalImport}
              disabled={!targetShopId || loading}
              className="w-full flex items-center justify-center gap-4 py-6 bg-primary text-on-primary rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Grid className="w-6 h-6" />
                  Magie starten & importieren
                </>
              )}
            </button>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-4 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors">
            Zurück zur Korrektur
          </button>
        </div>
      )}
      {/* Library Picker Modal */}
      <LibraryPickerModal 
        isOpen={!!activePickerProd}
        onClose={() => setActivePickerProd(null)}
        onSelect={(url) => {
          if (activePickerProd) {
            handleUpdateProduct(activePickerProd.catIdx, activePickerProd.prodIdx, 'image_url', url)
          }
        }}
      />
    </div>
  )
}
