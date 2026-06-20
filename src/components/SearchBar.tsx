interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label htmlFor="voc-search" className="search-bar__label">
        사례 검색
      </label>
      <input
        id="voc-search"
        type="search"
        className="search-bar__input"
        placeholder="사고 내용, 대응 문구, 조치 방법 검색…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <p className="search-bar__count" aria-live="polite">
        {resultCount}건
      </p>
    </div>
  )
}
