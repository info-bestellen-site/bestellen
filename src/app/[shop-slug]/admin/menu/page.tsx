'use client'

import { useState, useEffect, use, useRef, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product, Shop } from '@/types/database'
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  Loader2,
  Settings2,
  X,
  Upload,
  Edit2,
  Puzzle,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Modal } from '@/components/ui/Modal'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { ProductDetailModal } from '@/components/menu/ProductDetailModal'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableItem } from '@/components/admin/menu/SortableItem'
import { ModifierGroupEditor } from '@/components/admin/menu/ModifierGroupEditor'
import { UpsellEditor } from '@/components/admin/menu/UpsellEditor'

function MenuManagementPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': slug } = use(params)
  const shopSlug = decodeURIComponent(slug)
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const { t } = useTranslation()

  // Tab & modifier editor state
  const [activeTab, setActiveTab] = useState<'menu' | 'upselling'>('menu')
  const [modifierProductId, setModifierProductId] = useState<string | null>(null)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [selectedProductForImage, setSelectedProductForImage] = useState<Product | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    async function fetchData() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .single()

      if (shopData) {
        const shop = shopData as Shop
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

    if (editingCategory) {
      const { data } = await (supabase.from('categories') as any)
        .update({ name: newCategoryName.trim() })
        .eq('id', editingCategory.id)
        .select()
        .single()

      if (data) {
        const cat = data as Category
        setCategories(categories.map(c => c.id === cat.id ? cat : c))
        setIsCategoryModalOpen(false)
        setEditingCategory(null)
        setNewCategoryName('')
      }
    } else {
      const { data } = await (supabase.from('categories') as any)
        .insert({
          shop_id: shopId,
          name: newCategoryName.trim(),
          sort_order: categories.length
        })
        .select()
        .single()

      if (data) {
        const cat = data as Category
        setCategories([...categories, cat])
        setIsCategoryModalOpen(false)
        setNewCategoryName('')
      }
    }
    setIsSaving(false)
  }

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setIsCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('delete_category_confirm'))) return
    await (supabase.from('categories') as any).delete().eq('id', id)
    setCategories(categories.filter(c => c.id !== id))
    setProducts(products.filter(p => p.category_id !== id))
  }

  const openProductModal = (categoryId: string) => {
    setEditingProduct(null)
    setSelectedCategoryId(categoryId)
    setNewProduct({
      name: '',
      description: '',
      price: '',
      image_url: ''
    })
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product)
    setSelectedCategoryId(product.category_id)
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || ''
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopId || !selectedCategoryId || !newProduct.name.trim()) return
    setIsSaving(true)

    const productData = {
      shop_id: shopId,
      category_id: selectedCategoryId,
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: parseFloat(newProduct.price) || 0,
      image_url: newProduct.image_url
    }

    if (editingProduct) {
      const { data } = await (supabase.from('products') as any)
        .update(productData)
        .eq('id', editingProduct.id)
        .select()
        .single()

      if (data) {
        const prod = data as Product
        setProducts(products.map(p => p.id === prod.id ? prod : p))
        setIsProductModalOpen(false)
        setEditingProduct(null)
      }
    } else {
      const { data } = await (supabase.from('products') as any)
        .insert({
          ...productData,
          sort_order: products.filter(p => p.category_id === selectedCategoryId).length
        })
        .select()
        .single()

      if (data) {
        const prod = data as Product
        setProducts([...products, prod])
        setIsProductModalOpen(false)
      }
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
    if (!shopId) return
    setIsUploading(true)
    setImageToCrop(null)

    const fileName = `${shopId}/${Math.random()}.jpg`
    const filePath = `product-images/${fileName}`

    try {
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (selectedProductForImage) {
        // Direct update for existing product
        const { error: updateError } = await (supabase
          .from('products') as any)
          .update({ image_url: publicUrl })
          .eq('id', selectedProductForImage.id)

        if (!updateError) {
          setProducts(products.map(p => p.id === selectedProductForImage.id ? { ...p, image_url: publicUrl } : p))
        }
        setSelectedProductForImage(null)
      } else {
        // Update state for product modal
        setNewProduct(prev => ({ ...prev, image_url: publicUrl }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(t('error_occurred'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('delete_product_confirm'))) return
    await (supabase.from('products') as any).delete().eq('id', id)
    setProducts(products.filter(p => p.id !== id))
  }

  const toggleVisibility = async (product: Product) => {
    const newVal = !product.is_hidden_from_menu
    const { error } = await (supabase
      .from('products') as any)
      .update({ is_hidden_from_menu: newVal })
      .eq('id', product.id)

    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_hidden_from_menu: newVal } : p))
    }
  }

  const toggleAvailability = async (product: Product) => {
    const newVal = !product.is_available
    const { error } = await (supabase
      .from('products') as any)
      .update({ is_available: newVal })
      .eq('id', product.id)

    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_available: newVal } : p))
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'product') {
      const activeProduct = products.find(p => p.id === activeId)
      if (!activeProduct) return

      const sourceCategoryId = activeProduct.category_id
      let targetCategoryId: string | null = null

      if (overType === 'category') {
        targetCategoryId = overId
      } else if (overType === 'product') {
        const overProduct = products.find(p => p.id === overId)
        targetCategoryId = overProduct?.category_id || null
      }

      if (targetCategoryId && sourceCategoryId !== targetCategoryId) {
        setProducts((prev) => {
          const activeIndex = prev.findIndex((p) => p.id === activeId)
          const overIndex = prev.findIndex((p) => p.id === overId)

          let newIndex: number
          if (overType === 'category') {
            newIndex = prev.length
          } else {
            const isBelowOverItem =
              over &&
              active.rect.current.translated &&
              active.rect.current.translated.top >
              over.rect.top + over.rect.height

            const modifier = isBelowOverItem ? 1 : 0
            newIndex = overIndex >= 0 ? overIndex + modifier : prev.length
          }

          const updatedProducts = [...prev]
          updatedProducts[activeIndex] = {
            ...updatedProducts[activeIndex],
            category_id: targetCategoryId!
          }

          return arrayMove(updatedProducts, activeIndex, newIndex)
        })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()
    const type = active.data.current?.type

    if (type === 'category') {
      if (active.id === over.id) return
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)

      // Persist to DB
      for (let i = 0; i < newCategories.length; i++) {
        await (supabase
          .from('categories') as any)
          .update({ sort_order: i })
          .eq('id', newCategories[i].id)
      }
    } else if (type === 'product') {
      const activeIndex = products.findIndex((p) => p.id === activeId)
      const overIndex = products.findIndex((p) => p.id === overId)

      let newProducts = products
      if (activeIndex !== overIndex) {
        newProducts = arrayMove(products, activeIndex, overIndex)
        setProducts(newProducts)
      }

      // Re-calculate sort_order for ALL products within their respective categories
      const categoryGroups: Record<string, Product[]> = {}
      newProducts.forEach(p => {
        if (!categoryGroups[p.category_id]) categoryGroups[p.category_id] = []
        categoryGroups[p.category_id].push(p)
      })

      // Batch update category_id and sort_order
      for (const catId in categoryGroups) {
        const group = categoryGroups[catId]
        for (let i = 0; i < group.length; i++) {
          await (supabase
            .from('products') as any)
            .update({
              category_id: catId,
              sort_order: i
            })
            .eq('id', group[i].id)
        }
      }
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-4 sm:p-10 space-y-8 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">{t('menu_title')}</h1>
          <p className="text-sm sm:text-lg text-on-surface-variant font-medium">{t('menu_subtitle')}</p>
        </div>
        {activeTab === 'menu' && (
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            {t('category')}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-outline-variant/10 pb-0">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 ${activeTab === 'menu'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Speisekarte
        </button>
        <button
          onClick={() => setActiveTab('upselling')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 ${activeTab === 'upselling'
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          Upselling
        </button>
      </div>

      {/* Upselling Tab */}
      {activeTab === 'upselling' && shopId && (
        <div className="pb-20">
          <UpsellEditor shopId={shopId} products={products} />
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <div className="space-y-12 pb-20">
          {categories.length === 0 && (
            <div className="py-40 text-center rounded-[2rem] border-2 border-dashed border-outline-variant/20">
              <UtensilsCrossed className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-6" />
              <p className="text-on-surface-variant font-bold italic">{t('no_categories')}</p>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {categories.map((category) => (
                <SortableItem key={category.id} id={category.id} data={{ type: 'category' }}>
                  {({ attributes, listeners }) => (
                    <section className="group/cat">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/10">
                        <div className="flex items-center gap-4">
                          <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-on-surface-variant/40" />
                          </div>
                          <h2 className="text-2xl font-black tracking-tight">{category.name}</h2>
                          <div className="w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center text-[10px] font-black text-on-surface-variant shrink-0">
                            {products.filter(p => p.category_id === category.id).length}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => openProductModal(category.id)}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('product')}</span>
                          </button>
                          <button
                            onClick={() => openEditCategoryModal(category)}
                            className="p-2 sm:p-3 text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 sm:p-3 text-on-surface-variant/50 hover:text-error hover:bg-error/5 rounded-full transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <SortableContext
                        items={products.filter(p => p.category_id === category.id).map(p => p.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {products.filter(p => p.category_id === category.id).map((product) => (
                            <Fragment key={product.id}>
                              <SortableItem id={product.id} data={{ type: 'product', categoryId: category.id }}>
                                {({ attributes, listeners }) => (
                                  <div className={`flex items-center gap-3 sm:gap-6 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-outline-variant/5 transition-all bg-white hover:border-outline-variant/20 hover:shadow-xl hover:shadow-primary/5 ${!product.is_available ? 'grayscale opacity-60' : ''}`}>
                                    <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-on-surface-variant/40 hover:text-primary transition-colors">
                                      <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-surface-container-low rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative group/img">
                                      {product.image_url ? (
                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <ImageIcon className="w-6 h-6 text-on-surface-variant/20" />
                                      )}
                                      <button
                                        onClick={() => {
                                          setSelectedProductForImage(product)
                                          fileInputRef.current?.click()
                                        }}
                                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                                      >
                                        <Upload className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <button
                                            onClick={() => setPreviewProduct(product)}
                                            className="font-black text-sm truncate hover:text-primary transition-colors text-left"
                                          >
                                            {product.name}
                                          </button>
                                          {product.is_hidden_from_menu && (
                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-outline-variant/15 text-on-surface-variant/60">
                                              Nur als Option
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-sm font-black text-primary ml-2">{formatCurrency(product.price)}</span>
                                      </div>
                                      {product.description && (
                                        <p className="text-xs text-on-surface-variant font-medium line-clamp-1 mt-0.5">{product.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        <button
                                          onClick={() => toggleAvailability(product)}
                                          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-full transition-all ${product.is_available
                                            ? 'bg-success/5 text-success'
                                            : 'bg-error/5 text-error'
                                            }`}
                                        >
                                          <div className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-success animate-pulse' : 'bg-error'}`} />
                                          {product.is_available ? t('available') : t('sold_out')}
                                        </button>
                                        <button
                                          onClick={() => toggleVisibility(product)}
                                          className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${product.is_hidden_from_menu
                                            ? 'bg-outline-variant/10 text-on-surface-variant'
                                            : 'bg-surface-container-low text-on-surface-variant/50'
                                            }`}
                                          title={product.is_hidden_from_menu ? 'Im Menü versteckt' : 'Im Menü sichtbar'}
                                        >
                                          {product.is_hidden_from_menu
                                            ? <EyeOff className="w-3 h-3" />
                                            : <Eye className="w-3 h-3" />
                                          }
                                          <span className="hidden sm:inline">{product.is_hidden_from_menu ? 'Versteckt' : 'Sichtbar'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setModifierProductId(modifierProductId === product.id ? null : product.id)}
                                        className={`p-2 sm:p-3 rounded-full transition-all shrink-0 ${modifierProductId === product.id
                                          ? 'text-primary bg-primary/10'
                                          : 'text-on-surface-variant/40 hover:text-primary hover:bg-primary/5'
                                          }`}
                                        title="Modifier konfigurieren"
                                      >
                                        <Puzzle className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => openEditProductModal(product)}
                                        className="p-2 sm:p-3 text-on-surface-variant/40 hover:text-primary hover:bg-primary/5 rounded-full transition-all shrink-0"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 sm:p-3 text-on-surface-variant/40 hover:text-error hover:bg-error/5 rounded-full transition-all shrink-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </SortableItem>

                              {/* Modifier Editor - inline below product */}
                              {modifierProductId === product.id && shopId && (
                                <div className="col-span-1 md:col-span-2 mt-1 p-5 rounded-2xl border-2 border-primary/15 animate-fadeIn" style={{ background: 'color-mix(in srgb, var(--color-primary) 3%, white)' }}>
                                  <ModifierGroupEditor
                                    product={product}
                                    shopId={shopId}
                                    onClose={() => setModifierProductId(null)}
                                  />
                                </div>
                              )}
                            </Fragment>
                          ))}
                        </div>
                      </SortableContext>
                    </section>
                  )}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )} {/* end activeTab === 'menu' */}

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? t('edit_category') : t('new_category')}
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('name')}</label>
            <input
              type="text"
              autoFocus
              required
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
              placeholder={t('category_placeholder')}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingCategory ? t('update_category') : t('save_category'))}
          </button>
        </form>
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? t('edit_product') : t('new_product')}
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('name')}</label>
            <input
              type="text"
              autoFocus
              required
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
              placeholder={t('product_placeholder')}
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('description')}</label>
            <textarea
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold min-h-[100px]"
              placeholder={t('description_placeholder')}
              value={newProduct.description}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('price')} (€)</label>
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
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('image')} (Optional)</label>
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
                {isUploading ? t('uploading') : t('upload_image')}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingProduct ? t('update_product') : t('save_product'))}
          </button>
        </form>
      </Modal>

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
          onCancel={() => {
            setImageToCrop(null)
            setSelectedProductForImage(null)
          }}
          onCropComplete={onCropComplete}
        />
      )}

      <ProductDetailModal
        product={previewProduct}
        shopSlug={shopSlug}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  )
}

export default MenuManagementPage;
