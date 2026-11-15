import { useMemo, useState } from 'react'
import { CalendarDays, FileText, LogOut, MessageSquareWarning, Utensils } from 'lucide-react'
import { CategoryFilter } from './components/CategoryFilter'
import { EntryCard } from './components/EntryCard'
import { EntryModal } from './components/EntryModal'
import { ReportGeneratorModal } from './components/ReportGeneratorModal'
import { MenuLab } from './components/MenuLab'
import { MealPlanner } from './components/MealPlanner'
import { SearchBar } from './components/SearchBar'
import { PageHero } from './components/PageHero'
import {
  categories,
  getCaseById,
  vocCases,
} from './data/vocCases'
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

/** 띄어쓰기를 무시하고 비교합니다('머리 카락' = '머리카락'). */
function squash(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

/** 같은 뜻으로 찾을 말: 검색 단어에 왼쪽 말이 있으면 오른쪽 말로도 찾습니다(단어마다 따로 적용). */
const searchSynonyms: Array<[RegExp, string[]]> = [
  [/짜(?!장|글|파게티|증|임)|짠|짰|짭/, ['염도', '짜다', '짜요', '짜서', '짜게', '짠맛', '짬']],
  [/싱겁|싱거/, ['싱겁', '싱거', '염도']],
  [/식었|식어|미지근/, ['식었', '식어', '미지근', '차갑']],
  [/알러지|알레르기/, ['알레르기', '알러지']],
  [/양이|적어|적게/, ['양 부족', '양이 적', '양이 부족', '적게', '제공량']],
  [/품절|소진/, ['품절', '소진']],
  [/불친절|응대|태도/, ['직원 응대', '불친절', '응대', '태도']],
  [/더러|위생|청결/, ['위생', '청결', '더러']],
  [/배탈|설사|복통|구토/, ['식중독', '배탈', '설사', '복통', '구토']],
]

/** 검색에서 버릴 군말 */
const fillerWords = new Set(['너무', '정말', '진짜', '좀', '많이', '완전', '계속', '자꾸', '음식', '음식이', '나왔어요', '나왔다', '나옴', '나와요', '있어요', '있음', '있었어요', '해요', '했어요', '같아요', '같은', '것', '게'])

/** 단어 끝 조사·어미를 뗍니다('머리카락이' → '머리카락', '불친절해요' → '불친절'). 두 글자 미만이 되면 떼지 않습니다. */
function stem(word: string) {
  // 조사만 뗀 경우는 한 글자 명사도 살립니다('밥이' → '밥', '국이' → '국').
  const noParticle = word.replace(/(에서|에게|이랑|하고|이|가|은|는|을|를)$/, '')
  if (noParticle !== word && noParticle.length >= 1) return noParticle
  // '도'는 '온도'처럼 낱말 끝 글자일 수 있어 세 글자 이상일 때만 뗍니다.
  if (word.length >= 3 && word.endsWith('도')) return word.slice(0, -1)
  const stripped = word.replace(/(이에요|예요|였어요|었어요|았어요|했어요|해요|어요|아요|요|함|임|음)$/, '')
  return stripped.length >= 2 ? stripped : word
}

/** 검색어를 단어로 나누고, 단어마다 같은 뜻 말을 붙입니다. 단어끼리는 모두 맞아야 합니다(AND). */
function queryGroups(query: string): string[][] {
  return query
    .trim()
    .split(/\s+/)
    .map((word) => squash(word))
    .filter((word) => word && !fillerWords.has(word))
    .map((word) => {
      const terms = new Set([word, stem(word)])
      for (const [pattern, words] of searchSynonyms) {
        if (pattern.test(word)) words.forEach((synonym) => terms.add(squash(synonym)))
      }
      return [...terms]
    })
}

function matchedGroupCount(entry: (typeof vocCases)[number], groups: string[][]) {
  const haystack = caseHaystack(entry)
  return groups.filter((terms) => terms.some((term) => haystack.includes(term))).length
}

function caseHaystack(entry: (typeof vocCases)[number]) {
  const categoryLabel = categories.find((c) => c.id === entry.category)?.label ?? ''
  return squash(
    [entry.title, categoryLabel, entry.incident, entry.customerScript, entry.onsiteAction, entry.rootCause, entry.prevention, entry.reportExample].join(' '),
  )
}

function caseMatchesQuery(
  entry: (typeof vocCases)[number],
  groups: string[][],
): boolean {
  if (groups.length === 0) return true

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

  const squashed = squash(haystack)
  return groups.every((terms) => terms.some((term) => squashed.includes(term)))
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

  const filteredCases = useMemo(() => {
    const groups = queryGroups(searchQuery)
    const exact = squash(searchQuery)

    const inCategory = vocCases.filter((entry) => categoryFilter === 'all' || entry.category === categoryFilter)
    let matched = inCategory.filter((entry) => caseMatchesQuery(entry, groups))
    // 모든 단어가 맞는 사례가 없으면, 맞는 단어가 많은 순으로 보여 줍니다.
    if (matched.length === 0 && groups.length > 1) {
      matched = inCategory
        .map((entry) => ({ entry, count: matchedGroupCount(entry, groups) }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((item) => item.entry)
    }
    if (!exact) return matched
    // 검색어가 제목에 그대로 있으면 맨 위, 본문에 그대로 있으면 그다음으로 올립니다.
    const rank = (entry: (typeof vocCases)[number]) =>
      squash(entry.title).includes(exact) ? 0 : caseHaystack(entry).includes(exact) ? 1 : 2
    return matched
      .map((entry, index) => ({ entry, index, rank: rank(entry) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((item) => item.entry)
  }, [categoryFilter, searchQuery])

  // 검색 조건이 바뀌면 다시 처음 30건부터 보여 줍니다.
  const [listKey, setListKey] = useState(`${categoryFilter}|${searchQuery}`)
  if (listKey !== `${categoryFilter}|${searchQuery}`) {
    setListKey(`${categoryFilter}|${searchQuery}`)
    setVisibleCount(PAGE_SIZE)
  }
  const visibleCases = filteredCases.slice(0, visibleCount)
  const searchGroups = queryGroups(searchQuery)
  const isPartialMatch =
    searchGroups.length > 1 && filteredCases.length > 0 && !caseMatchesQuery(filteredCases[0], searchGroups)

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
        <nav aria-label="주요 메뉴">
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
        ) : activeTab === 'recommend' ? (
          <MenuLab />
        ) : (
          <MealPlanner />
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

      <nav className="tab-bar" aria-label="주요 메뉴">
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
