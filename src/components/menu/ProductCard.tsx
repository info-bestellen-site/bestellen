'use client'

import { Product } from '@/types/database'
import { Plus, ImageIcon, Settings2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useCartStore } from '@/lib/store/cart-store'
import { useAdminStore } from '@/lib/store/admin-store'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { Upload, Loader2 } from 'lucide-react'

interface ProductCardProps {
  product: Product
  shopSlug: string
  onOpenDetail: (product: Product) => void
  isAdmin?: boolean
  isManagementMode?: boolean
  isCurrentlyOpen?: boolean
}

export function ProductCard({ 
  product: initialProduct, 
  shopSlug, 
  onOpenDetail,
  isAdmin = false,
  isManagementMode = false,
  isCurrentlyOpen = true 
}: ProductCardProps) {
  const supabase = createClient()
  const addItem = useCartStore(s => s.addItem)
  const { editMode } = useAdminStore()
  const [product, setProduct] = useState(initialProduct)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price.toString()
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggleAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = !product.is_available
    setProduct(prev => ({ ...prev, is_available: newStatus }))

    await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', product.id)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const { data, error } = await supabase
      .from('products')
      .update({ 
        name: editForm.name, 
        price: parseFloat(editForm.price) || 0,
        description: editForm.description 
      })
      .eq('id', product.id)
      .select()
      .single()
    
    if (!error && data) {
      setProduct(data)
      setIsEditModalOpen(false)
    }
    setIsSaving(false)
  }
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true)
    setImageToCrop(null)

    const fileName = `${product.shop_id}/${Math.random()}.jpg`
    const filePath = `product-images/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const { data, error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id)
        .select()
        .single()
      
      if (!updateError && data) {
        setProduct(data)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Fehler beim Upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Produkt wirklich löschen?')) return
    setIsDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      alert('Fehler beim Löschen')
      setIsDeleting(false)
    }
  }

  if (isDeleting) return null

  return (
    <div className="group relative">
      <div
        className="aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-low mb-3 relative cursor-pointer"
        onClick={() => isAdmin ? fileInputRef.current?.click() : onOpenDetail(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-outline-variant/40" />
          </div>
        )}

        {!product.is_available && !editMode && (
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-bold text-on-surface-variant">Nicht verfügbar</span>
          </div>
        )}

        {isManagementMode && isAdmin ? (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={isUploading}
              className="w-10 h-10 rounded-full bg-white text-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditModalOpen(true)
              }}
              className="w-10 h-10 rounded-full bg-white text-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggleAvailability}
              className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${
                product.is_available ? 'bg-white text-on-surface' : 'bg-primary text-on-primary'
              }`}
            >
              <Plus className={`w-5 h-5 transition-transform ${product.is_available ? 'rotate-45' : ''}`} />
            </button>
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-full bg-white text-error shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          product.is_available && isCurrentlyOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetail(product)
              }}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-primary shadow-lg border border-white/20 active:scale-90 transition-transform hover:bg-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          )
        )}
      </div>

      {/* Edit Modal (Inline for Edit-in-Place) */}
      {isAdmin && (
        <div onClick={e => e.stopPropagation()}>
          <Modal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            title="Produkt bearbeiten"
          >
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Beschreibung</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold min-h-[100px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Preis (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Speichert...' : 'Änderungen Speichern'}
              </button>
            </form>
          </Modal>
        </div>
      )}

      <div className="flex justify-between items-start mb-1">
        <h3 className="text-base font-semibold tracking-tight text-on-surface">{product.name}</h3>
        <span className="text-sm font-bold tracking-tight text-on-surface ml-2 whitespace-nowrap">
          {formatCurrency(product.price)}
        </span>
      </div>
      {product.description && (
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{product.description}</p>
      )}

      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {imageToCrop && (
        <ImageCropper 
          image={imageToCrop} 
          onCancel={() => setImageToCrop(null)}
          onCropComplete={onCropComplete}
        />
      )}
    </div>
  )
}
