'use client'

interface CategoryFilterProps {
  categories: { id: string; name: string }[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryFilter({ categories, activeId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          activeId === null
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
        }`}
      >
        Alle
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            activeId === cat.id
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
