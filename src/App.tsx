import { Suspense, lazy, useMemo, useState } from 'react'
import { CalendarDays, FileText, LogOut, MessageSquareWarning, Utensils } from 'lucide-react'
import { CategoryFilter } from './components/CategoryFilter'
import { EntryCard } from './components/EntryCard'
import { EntryModal } from './components/EntryModal'
import { SearchBar } from './components/SearchBar'
import { PageHero } from './components/PageHero'
import { searchCases } from './utils/vocSearch'
import {
  categories,
  getCaseById,
  vocCases,
} from './data/vocCases'
// CSS 순서는 그대로 유지합니다(탭을 나눠 불러와도 theme.css가 마지막에 적용되도록).
import './report.css'
import './mealPlan.css'
import './shell.css'
import './App.css'
import './legibility.css'
import './theme.css'

/** 식판 모양 로고 표식 */
function TrayMark() {
  return (
    <svg className="brand__mark" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="2.5" y="4.5" width="23" height="19" rx="4" />
      <path d="M2.5 14h23M10.2 4.5V14M17.8 4.5V14M14 14v9.5" />
    </svg>
  )
}

// 첫 화면(VOC 대응)에 필요 없는 탭과 보고서 창은 처음 열 때 불러옵니다.
const ReportGeneratorModal = lazy(() => import('./components/ReportGeneratorModal').then((module) => ({ default: module.ReportGeneratorModal })))
const MenuLab = lazy(() => import('./components/MenuLab').then((module) => ({ default: module.MenuLab })))
const MealPlanner = lazy(() => import('./components/MealPlanner').then((module) => ({ default: module.MealPlanner })))

function TabLoading() {
  return (
    <p className="tab-loading" role="status">
      불러오는 중입니다.
    </p>
  )
}

const PAGE_SIZE = 30

export default function App() {
  const [activeTab, setActiveTab] = useState<'voc' | 'recommend' | 'plan'>('voc')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const quickKeywords = ['머리카락', '애벌레', '비닐', '오징어뼈']
  const popularKeywords = ['짜요', '품절', '양이 적어요', '위생']
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const handleQuickSearch = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const selectedCase = selectedCaseId ? getCaseById(selectedCaseId) : null

  const { cases: filteredCases, partial: isPartialMatch } = useMemo(
    () => searchCases(vocCases, searchQuery, categoryFilter),
    [categoryFilter, searchQuery],
  )

  // 검색 조건이 바뀌면 다시 처음 30건부터 보여 줍니다.
  const [listKey, setListKey] = useState(`${categoryFilter}|${searchQuery}`)
  if (listKey !== `${categoryFilter}|${searchQuery}`) {
    setListKey(`${categoryFilter}|${searchQuery}`)
    setVisibleCount(PAGE_SIZE)
  }
  const visibleCases = filteredCases.slice(0, visibleCount)

  const activeCategoryLabel =
    categoryFilter === 'all'
      ? '전체'
      : categories.find((item) => item.id === categoryFilter)?.label ?? '카테고리'

  const navItems = [
    { id: 'voc', label: 'VOC 대응', icon: MessageSquareWarning },
    { id: 'report', label: '보고서 작성', icon: FileText },
    { id: 'recommend', label: '메뉴 추천', icon: Utensils },
    { id: 'plan', label: '식단표', icon: CalendarDays },
  ] as const

  const handleNav = (id: (typeof navItems)[number]['id']) => {
    if (id === 'report') {
      setIsReportModalOpen(true)
      return
    }
    setActiveTab(id)
  }

  const isNavActive = (id: (typeof navItems)[number]['id']) =>
    id === 'report' ? isReportModalOpen : !isReportModalOpen && activeTab === id

  const brand = (
    <div className="brand">
      <TrayMark />
      <div>
        <p className="brand__name">FoodVOC</p>
        <p className="brand__desc">단체급식 업무 도구</p>
      </div>
    </div>
  )

  const logoutLink = import.meta.env.PROD ? (
    <a className="nav-item" href="/__logout">
      <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
      로그아웃
    </a>
  ) : null

  return (
    <div className="app">
      <aside className="side-nav">
        {brand}
        <nav aria-label="주요 메뉴 (사이드바)">
          <ul className="nav-list">
            {navItems.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  className={`nav-item ${isNavActive(id) ? 'is-active' : ''}`}
                  onClick={() => handleNav(id)}
                  aria-current={isNavActive(id) ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="side-nav__foot">
          {logoutLink}
          <p className="side-nav__copy">© FoodVOC · Powered by 2tB</p>
        </div>
      </aside>

      <header className="top-bar">
        {brand}
        {logoutLink}
      </header>

      <main className="main">
        {activeTab === 'voc' ? (
        <>
          <PageHero
            tone="tomato"
            eyebrow="현장 불만 대응"
            title="VOC 대응"
            description="불만 유형을 검색하면 고객 응대 문구와 현장 조치, 재발 방지까지 한 번에 확인합니다."
            stats={[
              { value: String(vocCases.length), unit: '건', label: '대응 사례' },
              { value: String(categories.length), unit: '개', label: '불만 유형' },
            ]}
          />

          <section className="search-panel">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredCases.length}
            />

            <section className="keyword-shortcuts" aria-label="자주 찾는 사례">
              <h3 className="keyword-shortcuts__title">자주 찾는 사례</h3>
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

            <section
              className="keyword-shortcuts"
              aria-label="인기 VOC"
            >
              <h3 className="keyword-shortcuts__title">인기 VOC</h3>
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

          <div className="result-summary" aria-live="polite">
            <p>{`검색 결과 ${filteredCases.length}건`}</p>
            <span>{`${activeCategoryLabel}${searchQuery ? ` · "${searchQuery}" 검색` : ''}${isPartialMatch ? ' · 일부 단어만 일치' : ''}`}</span>
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
              {visibleCases.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onSelect={setSelectedCaseId}
                />
              ))}
            </div>
          )}
          {filteredCases.length > visibleCases.length && (
            <div className="entry-more">
              <button type="button" className="meal-plan__button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                더 보기 ({visibleCases.length}/{filteredCases.length}건)
              </button>
            </div>
          )}
        </>
        ) : (
          <Suspense fallback={<TabLoading />}>{activeTab === 'recommend' ? <MenuLab /> : <MealPlanner />}</Suspense>
        )}
      </main>

      {selectedCase && (
        <EntryModal
          entry={selectedCase}
          onClose={() => setSelectedCaseId(null)}
        />
      )}

      {isReportModalOpen && (
        <Suspense
          fallback={
            <div className="modal-overlay" role="presentation">
              <TabLoading />
            </div>
          }
        >
          <ReportGeneratorModal onClose={() => setIsReportModalOpen(false)} />
        </Suspense>
      )}

      <nav className="tab-bar" aria-label="주요 메뉴 (하단 탭)">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tab-bar__item ${isNavActive(id) ? 'is-active' : ''}`}
            onClick={() => handleNav(id)}
            aria-current={isNavActive(id) ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
