import { useMemo, useState } from 'react'
import { CategoryFilter } from './components/CategoryFilter'
import { EntryCard } from './components/EntryCard'
import { EntryModal } from './components/EntryModal'
import { SearchBar } from './components/SearchBar'
import {
  categories,
  getCaseById,
  vocCases,
  type CategoryId,
} from './data/vocCases'
import './App.css'

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function caseMatchesQuery(
  entry: (typeof vocCases)[number],
  query: string,
): boolean {
  if (!query) return true

  const categoryLabel =
    categories.find((c) => c.id === entry.category)?.label ?? ''

  const haystack = [
    entry.title,
    categoryLabel,
    entry.incident,
    entry.customerScript,
    entry.onsiteAction,
    entry.rootCause,
    entry.prevention,
    entry.reportExample,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

export default function App() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCase = selectedCaseId ? getCaseById(selectedCaseId) : null

  const filteredCases = useMemo(() => {
    const query = normalizeQuery(searchQuery)

    return vocCases.filter((entry) => {
      const matchesCategory =
        categoryFilter === 'all' || entry.category === categoryFilter
      const matchesSearch = caseMatchesQuery(entry, query)
      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, searchQuery])

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <h1 className="site-header__title">단체급식 VOC 대처 백과사전</h1>
          <p className="site-header__tagline">
            급식 현장에서 발생하는 VOC·이물 사고를 빠르게 검색하고 대응하기 위한
            실무 참고 시스템
          </p>
        </div>
      </header>

      <main className="main">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredCases.length}
        />

        <CategoryFilter
          categories={categories}
          selected={categoryFilter}
          onSelect={setCategoryFilter}
        />

        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <p>검색 결과가 없습니다.</p>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
              }}
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="entry-grid">
            {filteredCases.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onSelect={setSelectedCaseId}
              />
            ))}
          </div>
        )}
      </main>

      {selectedCase && (
        <EntryModal
          entry={selectedCase}
          onClose={() => setSelectedCaseId(null)}
        />
      )}

      <footer className="site-footer">
        <p>단체급식 VOC 대처 백과사전 — 현장 대응·보고 참고용</p>
      </footer>
    </div>
  )
}
