import { useMemo, useState } from 'react'
import { CategoryFilter } from './components/CategoryFilter'
import { EntryCard } from './components/EntryCard'
import { EntryModal } from './components/EntryModal'
import { ReportGeneratorModal } from './components/ReportGeneratorModal'
import { SearchBar } from './components/SearchBar'
import {
  categories,
  getCaseById,
  vocCases,
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const quickKeywords = ['머리카락', '애벌레', '비닐', '오징어뼈']
  const popularKeywords = ['음식이 짜요', '품절', '양이 적어요', '위생']
  const handleQuickSearch = (keyword: string) => {
    setSearchQuery(keyword)
  }

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

  const activeCategoryLabel =
    categoryFilter === 'all'
      ? '전체'
      : categories.find((item) => item.id === categoryFilter)?.label ?? '카테고리'

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__brand-wrap">
            <span className="site-header__badge" aria-hidden="true">
              FV
            </span>
            <div>
              <p className="site-header__brand">FoodVOC</p>
              <h1 className="site-header__title">단체급식 VOC 대응 플랫폼</h1>
              <p className="site-header__tagline">Quality &amp; VOC Management Platform</p>
            </div>
          </div>
        </div>
        <div className="site-header__actions">
          <button
            type="button"
            className="report-button report-button--primary"
            onClick={() => setIsReportModalOpen(true)}
          >
            VOC 보고서 작성
          </button>
        </div>
      </header>

      <main className="main">
        <section className="summary-panel" aria-label="서비스 요약">
          <article className="summary-card">
            <p className="summary-card__label">총 VOC 사례 수</p>
            <p className="summary-card__value">{vocCases.length}건</p>
          </article>
          <article className="summary-card">
            <p className="summary-card__label">주요 카테고리 수</p>
            <p className="summary-card__value">{categories.length}개</p>
          </article>
          <article className="summary-card">
            <p className="summary-card__label">보고서 작성 기능</p>
            <p className="summary-card__value">바로 생성 가능</p>
          </article>
          <article className="summary-card">
            <p className="summary-card__label">모바일 대응</p>
            <p className="summary-card__value">390px~430px 최적화</p>
          </article>
        </section>

        <section className="search-section">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredCases.length}
          />

          <section className="keyword-shortcuts" aria-label="자주 찾는 사례">
            <h3 className="keyword-shortcuts__title">🔥 자주 찾는 사례</h3>
            <div className="keyword-shortcuts__list">
              {quickKeywords.map((keyword) => {
                const isActive = searchQuery === keyword
                return (
                  <button
                    key={keyword}
                    type="button"
                    className={`chip keyword-shortcut-chip ${
                      isActive ? 'chip--active' : ''
                    }`}
                    onClick={() => handleQuickSearch(keyword)}
                    aria-pressed={isActive}
                  >
                    {keyword}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="keyword-shortcuts keyword-shortcuts--secondary" aria-label="인기 VOC">
            <h3 className="keyword-shortcuts__title">⭐ 인기 VOC</h3>
            <div className="keyword-shortcuts__list">
              {popularKeywords.map((keyword) => {
                const isActive = searchQuery === keyword
                return (
                  <button
                    key={keyword}
                    type="button"
                    className={`chip keyword-shortcut-chip ${
                      isActive ? 'chip--active' : ''
                    }`}
                    onClick={() => handleQuickSearch(keyword)}
                    aria-pressed={isActive}
                  >
                    {keyword}
                  </button>
                )
              })}
            </div>
          </section>

          <CategoryFilter
            categories={categories}
            selected={categoryFilter}
            onSelect={setCategoryFilter}
          />
        </section>

        <div className="result-summary">
          <p>{`검색 결과 ${filteredCases.length}건`}</p>
          <span>{`${activeCategoryLabel}${searchQuery ? ` · "${searchQuery}" 검색` : ''}`}</span>
        </div>

        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <p>조건에 맞는 VOC 사례가 없습니다.</p>
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

      {isReportModalOpen && (
        <ReportGeneratorModal onClose={() => setIsReportModalOpen(false)} />
      )}

      <footer className="site-footer">
        <p className="footer-copy">
          © FoodVOC · Powered by{' '}
          <span className="footer-wordmark" aria-label="2tB">
            <span className="footer-wordmark__prefix">2</span>
            <span className="footer-wordmark__t">t</span>
            <span className="footer-wordmark__suffix">B</span>
          </span>
        </p>
      </footer>
    </div>
  )
}
