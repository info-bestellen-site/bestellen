'use client'

import { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/types/database'
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  GripVertical,
  ImageIcon,
  Loader2,
  Settings2,
  X,
  Upload
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Modal } from '@/components/ui/Modal'

export default function MenuManagementPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .single()
      
      if (shop) {
        setShopId(shop.id)
        
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', shop.id)
          .order('sort_order')
        
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shop.id)
          .order('sort_order')
        
        setCategories(cats || [])
        setProducts(prods || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase, shopSlug])

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopId || !newCategoryName.trim()) return
    setIsSaving(true)

    const { data } = await supabase
      .from('categories')
      .insert({
        shop_id: shopId,
        name: newCategoryName.trim(),
        sort_order: categories.length
      })
      .select()
      .single()
    
    if (data) {
      setCategories([...categories, data])
      setIsCategoryModalOpen(false)
      setNewCategoryName('')
    }
    setIsSaving(false)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Kategorie wirklich löschen? Alle zugehörigen Produkte werden ebenfalls gelöscht.')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(categories.filter(c => c.id !== id))
    setProducts(products.filter(p => p.category_id !== id))
  }

  const openProductModal = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setNewProduct({ name: '', description: '', price: '', image_url: '' })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopId || !selectedCategoryId || !newProduct.name.trim()) return
    setIsSaving(true)

    const { data } = await supabase
      .from('products')
      .insert({
        shop_id: shopId,
        category_id: selectedCategoryId,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price) || 0,
        image_url: newProduct.image_url,
        sort_order: products.filter(p => p.category_id === selectedCategoryId).length
      })
      .select()
      .single()
    
    if (data) {
      setProducts([...products, data])
      setIsProductModalOpen(false)
    }
    setIsSaving(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !shopId) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${shopId}/${Math.random()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setNewProduct(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Fehler beim Upload. Bitte versuche es erneut.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(products.filter(p => p.id !== id))
  }

  const toggleAvailability = async (product: Product) => {
    const newVal = !product.is_available
    const { error } = await supabase
      .from('products')
      .update({ is_available: newVal })
      .eq('id', product.id)
    
    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_available: newVal } : p))
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-10 space-y-10 max-w-5xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Speisekarte</h1>
          <p className="text-lg text-on-surface-variant font-medium">Kategorien und Produkte verwalten.</p>
        </div>
        <button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Kategorie hinzufügen
        </button>
      </div>

      <div className="space-y-12 pb-20">
        {categories.length === 0 && (
          <div className="py-40 text-center rounded-[2rem] border-2 border-dashed border-outline-variant/20">
            <UtensilsCrossed className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-6" />
            <p className="text-on-surface-variant font-bold italic">Noch keine Kategorien erstellt.</p>
          </div>
        )}

        {categories.map((category) => (
          <section key={category.id} className="group/cat">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-on-surface-variant/20 cursor-grab active:cursor-grabbing" />
                <h2 className="text-2xl font-black tracking-tight">{category.name}</h2>
                <div className="w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center text-[10px] font-black text-on-surface-variant">
                  {products.filter(p => p.category_id === category.id).length}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                <button 
                  onClick={() => openProductModal(category.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Produkt
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-3 text-on-surface-variant/30 hover:text-error hover:bg-error/5 rounded-full transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.category_id === category.id).map((product) => (
                <div key={product.id} className={`flex items-center gap-6 p-4 rounded-3xl border border-outline-variant/5 transition-all bg-white hover:border-outline-variant/20 hover:shadow-xl hover:shadow-primary/5 ${!product.is_available ? 'grayscale opacity-60' : ''}`}>
                  <div className="w-20 h-20 bg-surface-container-low rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative group/img">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-on-surface-variant/20" />
                    )}
                    <button className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Settings2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-sm truncate">{product.name}</h4>
                      <span className="text-sm font-black text-primary ml-2">{formatCurrency(product.price)}</span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-on-surface-variant font-medium line-clamp-1 mt-0.5">{product.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button 
                        onClick={() => toggleAvailability(product)}
                        className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                          product.is_available 
                            ? 'bg-success/5 text-success' 
                            : 'bg-error/5 text-error'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${product.is_available ? 'bg-success animate-pulse' : 'bg-error'}`} />
                        {product.is_available ? 'Verfügbar' : 'Ausverkauft'}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-3 text-on-surface-variant/10 hover:text-error hover:bg-error/5 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Category Modal */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title="Neue Kategorie"
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</label>
            <input 
              type="text" 
              autoFocus
              required
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
              placeholder="z.B. Vorspeisen"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Kategorie Speichern'}
          </button>
        </form>
      </Modal>

      {/* Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title="Neues Produkt"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</label>
            <input 
              type="text" 
              autoFocus
              required
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
              placeholder="z.B. Sushi Mix Large"
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Beschreibung</label>
            <textarea 
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold min-h-[100px]"
              placeholder="Zutaten, Allergene oder Details..."
              value={newProduct.description}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Preis (€)</label>
            <input 
              type="number" 
              step="0.01"
              required
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
              placeholder="12.50"
              value={newProduct.price}
              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bild (Optional)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant/10">
                {newProduct.image_url ? (
                  <img src={newProduct.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-on-surface-variant/20" />
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading ? 'Wird hochgeladen...' : 'Bild Hochladen'}
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Produkt Speichern'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
