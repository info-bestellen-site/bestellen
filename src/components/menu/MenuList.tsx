'use client'

import { useState } from 'react'
import { Category, Product, Shop } from '@/types/database'
import { CategoryFilter } from './CategoryFilter'
import { ProductCard } from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'
import { Search } from 'lucide-react'

interface MenuListProps {
  shop: Shop
  categories: Category[]
  products: Product[]
  isAdmin?: boolean
}

export function MenuList({ shop, categories, products, isAdmin = false }: MenuListProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
