'use client'

import { useState } from 'react'
import { Category, Product, Shop, OpeningHour } from '@/types/database'
import { CategoryFilter } from './CategoryFilter'
import { ProductCard } from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'
import { Search, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { DAYS_OF_WEEK } from '@/lib/utils/open-hours'

interface MenuListProps {
  shop: Shop
  categories: Category[]
  products: Product[]
  isAdmin?: boolean
  isCurrentlyOpen?: boolean
  hours?: OpeningHour[]
}

export function MenuList({ 
  shop, 
  categories, 
  products, 
  isAdmin = false,
  isCurrentlyOpen = true,
  hours = []
}: MenuListProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showHours, setShowHours] = useState(false)

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategoryId ? product.category_id === activeCategoryId : true
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesCategory && matchesSearch
  })

  // Group products by category if no category is selected
  const categoriesWithProducts = categories
    .map(cat => ({
      ...cat,
      products: filteredProducts.filter(p => p.category_id === cat.id)
    }))
    .filter(cat => cat.products.length > 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Search and Filter */}
      <div className="sticky top-[72px] z-40 bg-surface/95 backdrop-blur-md pt-4 pb-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Suche nach Gerichten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/40"
          />
        </div>

        <CategoryFilter
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {!isCurrentlyOpen && (
        <div className="mb-8 p-6 bg-error/5 border border-error/10 rounded-[2rem] flex flex-col items-center text-center animate-fadeIn">
          <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center mb-4">
            <span className="font-black text-xl">!</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-on-surface mb-2">Wir haben aktuell geschlossen</h2>
          <div className="text-sm text-on-surface-variant max-w-md mx-auto space-y-4">
            <p>
              Vielen Dank für dein Interesse! Wir nehmen aktuell keine Bestellungen entgegen. 
              Bitte schau zu unseren <button 
                onClick={() => setShowHours(!showHours)}
                className="text-primary font-bold underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Öffnungszeiten
              </button> wieder vorbei.
            </p>
            
            {showHours && (
              <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-outline-variant/10 text-left animate-fadeIn">
                <div className="flex items-center gap-2 mb-3 text-on-surface/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unsere Regulären Zeiten</span>
                </div>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const dayHours = hours.filter(h => h.day_of_week === index)
                    return (
                      <div key={day} className="flex justify-between items-center text-xs">
                        <span className="font-bold">{day}</span>
                        <span className="font-medium text-on-surface-variant">
                          {dayHours.length > 0 
                            ? dayHours.map(h => `${h.start_time.substring(0, 5)} - ${h.end_time.substring(0, 5)}`).join(', ')
                            : 'Geschlossen'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="space-y-12 pb-20">
        {activeCategoryId || searchQuery ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                shopSlug={shop.slug}
                onOpenDetail={setSelectedProduct}
                isAdmin={isAdmin}
                isCurrentlyOpen={isCurrentlyOpen}
              />
            ))}
          </div>
        ) : (
          categoriesWithProducts.map((category) => (
            <section key={category.id} id={category.id}>
              <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-3">
                {category.name}
                <span className="h-px flex-1 bg-outline-variant/10" />
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    shopSlug={shop.slug}
                    onOpenDetail={setSelectedProduct}
                    isAdmin={isAdmin}
                    isCurrentlyOpen={isCurrentlyOpen}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-on-surface-variant">Keine Gerichte gefunden.</p>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        shopSlug={shop.slug}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
