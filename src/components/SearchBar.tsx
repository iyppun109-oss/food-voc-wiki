interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount?: number
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label htmlFor="voc-search" className="search-bar__label">
        VOC 검색
      </label>
      <input
        id="voc-search"
        type="search"
        className="search-bar__input"
        placeholder="이물, 품절, 염도처럼 검색"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  )
}
