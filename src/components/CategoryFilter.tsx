import { categoryTone } from '../data/categoryTone'

interface CategoryFilterProps {
  categories: { id: string; label: string }[]
  selected: string
  onSelect: (id: string) => void
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="category-filter" role="group" aria-label="카테고리 필터">
      <button
        type="button"
        aria-pressed={selected === 'all'}
        className={selected === 'all' ? 'chip chip--active' : 'chip'}
        onClick={() => onSelect('all')}
      >
        전체
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={selected === category.id}
          className={selected === category.id ? 'chip chip--active' : 'chip'}
          onClick={() => onSelect(category.id)}
          data-tone={categoryTone[category.id] ?? 'foreign'}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
