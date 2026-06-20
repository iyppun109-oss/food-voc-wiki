import type { CategoryId } from '../data/vocCases'

interface CategoryFilterProps {
  categories: { id: CategoryId; label: string }[]
  selected: CategoryId | 'all'
  onSelect: (id: CategoryId | 'all') => void
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="category-filter" role="tablist" aria-label="카테고리 필터">
      <button
        type="button"
        role="tab"
        aria-selected={selected === 'all'}
        className={selected === 'all' ? 'chip chip--active' : 'chip'}
        onClick={() => onSelect('all')}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={selected === category.id}
          className={selected === category.id ? 'chip chip--active' : 'chip'}
          onClick={() => onSelect(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
