import {
  kimchiItems,
  mainItems,
  oneDishItems,
  riceItems,
  sideItems,
  soupItems,
  stewItems,
  vegItems,
  type PlanMenuItem,
  type Protein,
} from '../data/mealPlanItems'

// ───────────────────────── 타입 ─────────────────────────

export type DayType = '정식' | '탕·찌개' | '일품'

/** 식단표의 6개 행. 일품 날에는 rice 칸에 일품 메뉴가 들어가고 main 칸은 비웁니다. */
export type PlanRow = 'rice' | 'soup' | 'main' | 'side' | 'veg' | 'kimchi'

export const planRows: PlanRow[] = ['rice', 'soup', 'main', 'side', 'veg', 'kimchi']

export const planRowLabels: Record<PlanRow, string> = {
  rice: '밥 / 일품',
  soup: '국 / 탕·찌개',
  main: '주찬',
  side: '부찬',
  veg: '무침·나물',
  kimchi: '김치',
}

export type Season = '봄' | '여름' | '가을' | '겨울'
export type AvoidFactor = '염도' | '뼈·가시' | '튀김 눅눅함' | '매운맛'
export const avoidFactorOptions: AvoidFactor[] = ['염도', '뼈·가시', '튀김 눅눅함', '매운맛']

export interface MealPlanOptions {
  startDate: string // YYYY-MM-DD, 월요일 권장
  weeks: 1 | 2 | 4
  mealLabel: '중식' | '석식'
  season: Season
  oneDishPerWeek: 0 | 1 | 2
  stewPerWeek: 0 | 1 | 2 | 3
  avoid: AvoidFactor[]
  preferPopular: boolean
  seed: number
}

export interface PlanDay {
  date: string
  weekdayLabel: string
  type: DayType
  cells: Record<PlanRow, PlanMenuItem | null>
}

export interface MealPlan {
  options: MealPlanOptions
  days: PlanDay[]
}

export interface PlanSummary {
  totalItems: number
  preferredItems: number
  proteinCounts: Array<{ protein: Protein; count: number }>
  repeatedCenterMenus: string[]
  warnings: string[]
}

// ───────────────────────── 난수 ─────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ───────────────────────── 날짜 ─────────────────────────

const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']

function parseDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 시작일부터 평일만 weeks × 5일을 만듭니다. 시작일이 주말이면 다음 월요일부터 시작합니다. */
export function buildWeekdayDates(startDate: string, weeks: number) {
  const date = parseDate(startDate)
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1)
  const result: Date[] = []
  while (result.length < weeks * 5) {
    if (date.getDay() !== 0 && date.getDay() !== 6) result.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return result
}

export function nextMonday(from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const diff = (8 - date.getDay()) % 7 || 7
  date.setDate(date.getDate() + diff)
  return formatDate(date)
}

/** 주 5일(월~금) 중 일품·탕찌개 요일 배치. 일품은 수·금, 탕·찌개는 화·목·월 순으로 배정합니다. */
function weekPattern(oneDish: number, stew: number): DayType[] {
  const pattern: DayType[] = ['정식', '정식', '정식', '정식', '정식']
  const oneDishSlots = [2, 4].slice(0, oneDish)
  oneDishSlots.forEach((index) => {
    pattern[index] = '일품'
  })
  const stewOrder = [1, 3, 0, 4, 2].filter((index) => pattern[index] === '정식')
  stewOrder.slice(0, stew).forEach((index) => {
    pattern[index] = '탕·찌개'
  })
  return pattern
}

// ───────────────────────── 점수 계산 ─────────────────────────

const centerRows: PlanRow[] = ['rice', 'soup', 'main']

function centerItemsOf(day: PlanDay) {
  return centerRows
    .map((row) => day.cells[row])
    .filter((item): item is PlanMenuItem => item !== null && (item.slot === 'main' || item.slot === 'stew' || item.slot === 'oneDish'))
}

function dayItems(day: PlanDay, exceptRow?: PlanRow) {
  return planRows
    .filter((row) => row !== exceptRow)
    .map((row) => day.cells[row])
    .filter((item): item is PlanMenuItem => item !== null)
}

interface ScoreContext {
  plan: PlanDay[]
  dayIndex: number
  row: PlanRow
  options: MealPlanOptions
  rng: () => number
}

const ignoredOverlapTokens = new Set(['양파', '대파', '쌀'])

/** 이름이 달라도 같은 계열로 보는 메뉴군. 같은 날 또는 가까운 날짜에 겹치지 않게 합니다. */
const menuFamilies: RegExp[] = [
  /짜장/,
  /짬뽕/,
  /곰탕|설렁탕|도가니/,
  /김치찌개|짜글이|부대찌개/,
  /칼국수|수제비/,
  /순두부/,
  /우동/,
  /쌀국수|라멘|소바|막국수|잔치국수/,
  /찜닭|닭볶음탕/,
  /장조림/,
  /어묵볶음/,
  /계란말이|계란찜|스크램블/,
  /만두/,
  /불고기|불백/,
  /돈까스|커틀릿/,
  /강정|탕수육|깐풍기|유린기/,
  /덮밥|볶음밥/,
  /비빔밥|솥밥|콩나물밥/,
  /감자/,
]

function familyOf(name: string) {
  return menuFamilies.findIndex((pattern) => pattern.test(name))
}

function scoreCandidate(candidate: PlanMenuItem, ctx: ScoreContext) {
  const { plan, dayIndex, row, options, rng } = ctx
  const day = plan[dayIndex]
  const sameDay = dayItems(day, row)
  let score = rng() * 2

  if (options.preferPopular && candidate.preferred) score += 3

  // 반복: 기간 전체에서 사용 횟수와 가장 가까운 사용일까지의 거리
  let uses = 0
  let nearest = Infinity
  plan.forEach((other, index) => {
    planRows.forEach((otherRow) => {
      if (index === dayIndex && otherRow === row) return
      if (other.cells[otherRow]?.id === candidate.id) {
        uses += 1
        nearest = Math.min(nearest, Math.abs(index - dayIndex))
      }
    })
  })
  const isCenter = candidate.slot === 'main' || candidate.slot === 'stew' || candidate.slot === 'oneDish'
  if (candidate.slot === 'rice') {
    if (nearest === 1) score -= 1.5
  } else if (candidate.slot === 'kimchi') {
    if (nearest === 1) score -= 6
    score -= uses * 0.5
  } else if (isCenter) {
    score -= uses * 40
    if (nearest < 10) score -= 20
  } else {
    if (nearest <= 4) score -= 25
    score -= uses * 6
  }

  // 같은 계열 메뉴: 같은 날 -20, 3일 이내 -12
  const family = familyOf(candidate.name)
  if (family >= 0 && candidate.slot !== 'rice') {
    plan.forEach((other, index) => {
      const distance = Math.abs(index - dayIndex)
      if (distance > 3) return
      planRows.forEach((otherRow) => {
        if (index === dayIndex && otherRow === row) return
        const item = other.cells[otherRow]
        if (!item || item.id === candidate.id || familyOf(item.name) !== family) return
        score -= distance === 0 ? 20 : 12
      })
    })
  }

  // 단백질: 전날·다음날 중심 메뉴와 같은 단백질, 같은 날 중심 메뉴와 같은 단백질 피하기
  if (candidate.protein !== '없음') {
    const neighbors = [plan[dayIndex - 1], plan[dayIndex + 1]].filter((value): value is PlanDay => Boolean(value))
    if (isCenter && neighbors.some((other) => centerItemsOf(other).some((item) => item.protein === candidate.protein))) {
      score -= 10
    }
    const sameDayProteins = sameDay.filter((item) => item.slot !== 'kimchi' && item.slot !== 'rice').map((item) => item.protein)
    if (sameDayProteins.includes(candidate.protein)) {
      score -= candidate.protein === '두부·계란' ? 5 : 12
    }
  }

  // 조리법: 같은 날 주찬·부찬·일품의 조리법 중복 피하기
  const methodRows: PlanRow[] = ['main', 'side']
  if (methodRows.includes(row) || candidate.slot === 'oneDish') {
    const methods = sameDay.filter((item) => item.slot === 'main' || item.slot === 'side' || item.slot === 'oneDish').map((item) => item.method)
    if (methods.includes(candidate.method)) score -= 10
    const fryCount = sameDay.filter((item) => item.flags.includes('fried')).length
    if (candidate.flags.includes('fried') && fryCount >= 1) score -= 15
  }

  // 주재료 중복
  const sameDayTokens = new Set(sameDay.flatMap((item) => item.ingredients).filter((token) => !ignoredOverlapTokens.has(token)))
  candidate.ingredients.forEach((token) => {
    if (sameDayTokens.has(token)) score -= 10
  })

  // 매운맛 균형
  if (candidate.flags.includes('spicy')) {
    const spicyCount = sameDay.filter((item) => item.flags.includes('spicy') && item.slot !== 'kimchi').length
    if (spicyCount >= 2) score -= 15
    else if (spicyCount === 1) score -= 5
  }

  // VOC 고려 요소
  if (options.avoid.includes('염도') && candidate.flags.includes('salty') && candidate.slot !== 'kimchi') {
    score -= 8
    const saltyCount = sameDay.filter((item) => item.flags.includes('salty') && item.slot !== 'kimchi').length
    if (saltyCount >= 1) score -= 10
  }
  if (options.avoid.includes('뼈·가시') && candidate.flags.includes('bones')) score -= 30
  if (options.avoid.includes('튀김 눅눅함') && candidate.flags.includes('fried')) score -= 12
  if (options.avoid.includes('매운맛') && candidate.flags.includes('spicy')) score -= 8

  // 밥: 탕·찌개 날과 일반 날 모두 쌀밥 비중을 높게, 잡곡밥은 번갈아
  if (candidate.slot === 'rice' && candidate.name === '쌀밥') score += 1.5

  return score
}

function poolFor(row: PlanRow, type: DayType, options: MealPlanOptions): PlanMenuItem[] {
  const seasonFilter = (item: PlanMenuItem) => options.season === '여름' || !item.flags.includes('cold')
  switch (row) {
    case 'rice':
      return (type === '일품' ? oneDishItems : riceItems).filter(seasonFilter)
    case 'soup':
      return type === '탕·찌개' ? stewItems : soupItems
    case 'main':
      return mainItems
    case 'side':
      return sideItems
    case 'veg':
      return vegItems
    case 'kimchi':
      return kimchiItems
  }
}

function isRowEmpty(day: PlanDay, row: PlanRow) {
  if (day.type === '일품' && row === 'main') return true
  if (day.type === '일품' && row === 'soup') return Boolean(day.cells.rice?.flags.includes('brothy'))
  return false
}

function pickBest(ctx: ScoreContext, exclude: Set<string>) {
  const day = ctx.plan[ctx.dayIndex]
  const candidates = poolFor(ctx.row, day.type, ctx.options).filter((item) => !exclude.has(item.id))
  let best: PlanMenuItem | null = null
  let bestScore = -Infinity
  for (const candidate of candidates) {
    const score = scoreCandidate(candidate, ctx)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

/** 하루 안에서 칸을 채우는 순서: 중심 메뉴 → 국 → 부찬 → 채소 → 밥 → 김치 */
function fillOrder(type: DayType): PlanRow[] {
  if (type === '일품') return ['rice', 'soup', 'side', 'veg', 'kimchi']
  if (type === '탕·찌개') return ['soup', 'main', 'side', 'veg', 'rice', 'kimchi']
  return ['main', 'soup', 'side', 'veg', 'rice', 'kimchi']
}

function emptyCells(): Record<PlanRow, PlanMenuItem | null> {
  return { rice: null, soup: null, main: null, side: null, veg: null, kimchi: null }
}

// ───────────────────────── 공개 함수 ─────────────────────────

export function generateMealPlan(options: MealPlanOptions): MealPlan {
  const rng = mulberry32(hashString(JSON.stringify({ ...options, avoid: [...options.avoid].sort() })))
  const dates = buildWeekdayDates(options.startDate, options.weeks)
  const pattern = weekPattern(options.oneDishPerWeek, options.stewPerWeek)

  const days: PlanDay[] = dates.map((date, index) => ({
    date: formatDate(date),
    weekdayLabel: weekdayNames[date.getDay()],
    type: pattern[index % 5],
    cells: emptyCells(),
  }))

  days.forEach((day, dayIndex) => {
    for (const row of fillOrder(day.type)) {
      if (isRowEmpty(day, row)) continue
      day.cells[row] = pickBest({ plan: days, dayIndex, row, options, rng }, new Set())
    }
  })

  return { options, days }
}

/**
 * 한 칸만 다시 고릅니다. 현재 메뉴와 excludeIds에 있는 메뉴는 제외합니다.
 * 일품 칸을 바꾸면 국물 유무가 달라질 수 있어 같은 날 국 칸도 다시 맞춥니다.
 */
export function replaceCell(plan: MealPlan, dayIndex: number, row: PlanRow, excludeIds: string[] = []): MealPlan {
  const days = plan.days.map((day) => ({ ...day, cells: { ...day.cells } }))
  const day = days[dayIndex]
  const current = day.cells[row]
  const exclude = new Set(excludeIds)
  if (current) exclude.add(current.id)

  const rng = mulberry32(hashString(`${plan.options.seed}|${dayIndex}|${row}|${[...exclude].join(',')}`))
  const ctx: ScoreContext = { plan: days, dayIndex, row, options: plan.options, rng }
  day.cells[row] = null
  day.cells[row] = pickBest(ctx, exclude) ?? current

  if (row === 'rice' && day.type === '일품') {
    if (isRowEmpty(day, 'soup')) {
      day.cells.soup = null
    } else if (!day.cells.soup) {
      day.cells.soup = pickBest({ ...ctx, row: 'soup' }, new Set())
    }
  }

  return { options: plan.options, days }
}

export function summarizePlan(plan: MealPlan): PlanSummary {
  const items = plan.days.flatMap((day) => dayItems(day))
  const centers = plan.days.flatMap((day) => centerItemsOf(day))

  const proteinMap = new Map<Protein, number>()
  centers.forEach((item) => proteinMap.set(item.protein, (proteinMap.get(item.protein) ?? 0) + 1))

  const nameCount = new Map<string, number>()
  centers.forEach((item) => nameCount.set(item.name, (nameCount.get(item.name) ?? 0) + 1))
  const repeatedCenterMenus = [...nameCount.entries()].filter(([, count]) => count > 1).map(([name]) => name)

  const warnings: string[] = []
  plan.days.forEach((day) => {
    const list = dayItems(day)
    const spicy = list.filter((item) => item.flags.includes('spicy') && item.slot !== 'kimchi').length
    if (spicy >= 3) warnings.push(`${day.date}(${day.weekdayLabel}) 매운 메뉴가 ${spicy}개입니다.`)
    const fried = list.filter((item) => item.flags.includes('fried')).length
    if (fried >= 2) warnings.push(`${day.date}(${day.weekdayLabel}) 튀김류가 ${fried}개입니다.`)
    if (plan.options.avoid.includes('뼈·가시') && list.some((item) => item.flags.includes('bones'))) {
      warnings.push(`${day.date}(${day.weekdayLabel}) 뼈·가시 주의 메뉴가 포함되어 있습니다.`)
    }
  })
  plan.days.forEach((day, index) => {
    const prev = plan.days[index - 1]
    if (!prev) return
    const shared = centerItemsOf(day)
      .map((item) => item.protein)
      .filter((protein) => protein !== '없음' && centerItemsOf(prev).some((item) => item.protein === protein))
    if (shared.length > 0) warnings.push(`${prev.date}와 ${day.date}의 중심 메뉴 단백질(${shared[0]})이 이어집니다.`)
  })
  if (repeatedCenterMenus.length > 0) {
    warnings.push(`기간 내 중심 메뉴가 반복됩니다: ${repeatedCenterMenus.join(', ')}`)
  }

  return {
    totalItems: items.length,
    preferredItems: items.filter((item) => item.preferred).length,
    proteinCounts: [...proteinMap.entries()].map(([protein, count]) => ({ protein, count })).sort((a, b) => b.count - a.count),
    repeatedCenterMenus,
    warnings,
  }
}

/** 엑셀에 붙여넣을 수 있는 탭 구분 텍스트 */
export function planToTsv(plan: MealPlan) {
  const header = ['구분', ...plan.days.map((day) => `${day.date.slice(5).replace('-', '/')}(${day.weekdayLabel})`)]
  const typeRow = ['유형', ...plan.days.map((day) => day.type)]
  const rows = planRows.map((row) => [planRowLabels[row], ...plan.days.map((day) => day.cells[row]?.name ?? '-')])
  return [header, typeRow, ...rows].map((cols) => cols.join('\t')).join('\n')
}
