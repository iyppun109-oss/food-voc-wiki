import type { VocCase } from '../data/vocCases'
import { categoryTone } from '../data/categoryTone'

interface EntryCardProps {
  entry: VocCase
  onSelect: (id: string) => void
}

export function EntryCard({ entry, onSelect }: EntryCardProps) {
  return (
    <button
      type="button"
      className="entry-card"
      data-tone={categoryTone[entry.category] ?? 'foreign'}
      onClick={() => onSelect(entry.id)}
    >
      <span className="entry-card__category">{entry.category}</span>
      <h2 className="entry-card__title">{entry.title}</h2>
      <p className="entry-card__summary">{entry.incident}</p>
      <span className="entry-card__link">상세보기</span>
    </button>
  )
}
