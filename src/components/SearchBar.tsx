interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label htmlFor="voc-search" className="search-bar__label">
        VOC 검색
      </label>
      <input
        id="voc-search"
        type="search"
        className="search-bar__input"
        placeholder="예: 머리카락, 애벌레, 비닐, 품절, 염도"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <p className="search-bar__count" aria-live="polite">
        검색 대상 {resultCount}건
      </p>
    </div>
  )
}
