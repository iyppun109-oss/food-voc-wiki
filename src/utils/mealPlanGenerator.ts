import { attachJosa } from './koreanJosa'
import {
  kimchiItems,
  mainItems,
  oneDishItems,
  riceItems,
  sideItems,
  soupItems,
  stewItems,
  vegItems,
  type MealSlot,
  type PlanMenuItem,
  type Protein,
} from '../data/mealPlanItems'
import { nutritionOf } from '../data/mealPlanNutrition'

// ───────────────────────── 타입 ─────────────────────────

export type DayType = '정식' | '탕·찌개' | '일품'

/** 식단표의 6개 행. 일품 날에는 rice 칸에 일품 메뉴가 들어가고 main 칸은 비웁니다. */
export type PlanRow = 'rice' | 'soup' | 'main' | 'side' | 'veg' | 'kimchi'

export const planRows: PlanRow[] = ['rice', 'soup', 'main', 'side', 'veg', 'kimchi']

export const planRowLabels: Record<PlanRow, string> = {
  rice: '밥·일품',
  soup: '국·찌개',
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
  /** 1식 영양 목표 */
  target: NutritionTarget
  /** 칸별 1인 분량(g). 열량·단백질은 100g당 수치에 이 분량을 곱해 계산합니다. */
  portions: Record<MealSlot, number>
  seed: number
}

export type SiteType = '사무직' | '생산직' | '직접 설정'

export interface NutritionTarget {
  site: SiteType
  kcalMin: number
  kcalMax: number
  proteinMin: number
  /** 한 끼 나트륨 상한(mg, 국물을 모두 먹었을 때 기준) */
  sodiumMax: number
}

/**
 * 1식 목표 기본값. 한국인 영양소 섭취기준(성인)의 하루 에너지 필요추정량·단백질 권장섭취량을
 * 세 끼로 나눈 값을 기준으로 잡은 초안이며, 화면에서 바꿀 수 있습니다.
 * 나트륨 상한 1,500mg은 하루 기준 2,300mg의 약 2/3로, 국·찌개 국물을 모두 먹는다고 계산하는 점을 감안한 초안입니다.
 */
export const sitePresets: Record<Exclude<SiteType, '직접 설정'>, Omit<NutritionTarget, 'site'>> = {
  사무직: { kcalMin: 700, kcalMax: 800, proteinMin: 20, sodiumMax: 1500 },
  생산직: { kcalMin: 850, kcalMax: 950, proteinMin: 25, sodiumMax: 1700 },
}

/**
 * 1인 분량 기본값(g). 단체급식에서 흔히 쓰는 배식량을 기준으로 잡은 초안이며,
 * 사업장 기준에 맞게 화면에서 바꿀 수 있습니다.
 */
export const defaultPortions: Record<MealSlot, number> = {
  rice: 250,
  soup: 250,
  stew: 350,
  main: 130,
  side: 70,
  veg: 60,
  kimchi: 40,
  oneDish: 550,
}

/** 사업장 유형별 1인 분량 기본값. 생산직은 활동량을 고려해 밥·주찬·일품을 늘립니다. */
export const sitePortions: Record<Exclude<SiteType, '직접 설정'>, Record<MealSlot, number>> = {
  사무직: defaultPortions,
  생산직: { rice: 300, soup: 250, stew: 400, main: 150, side: 80, veg: 60, kimchi: 40, oneDish: 650 },
}

export const portionLabels: Record<MealSlot, string> = {
  rice: '밥',
  soup: '국',
  stew: '탕·찌개',
  main: '주찬',
  side: '부찬',
  veg: '무침·나물',
  kimchi: '김치',
  oneDish: '일품',
}

export interface ItemNutrition {
  servingG: number
  kcal: number
  proteinG: number
  /** 나트륨(mg). DB에 값이 없으면 null. 국물 음식은 국물을 모두 먹었을 때 기준 */
  sodiumMg: number | null
}

/** 성인 나트륨 만성질환위험감소섭취량(하루, 한국인 영양소 섭취기준) */
export const SODIUM_DAILY_REFERENCE = 2300

export type NutritionStatus = 'ok' | 'low' | 'high' | 'partial' | 'none'

export interface DayNutrition {
  kcal: number
  proteinG: number
  /** 나트륨 합계(mg). 자료 있는 메뉴만 더한 값 */
  sodiumMg: number
  /** 열량 자료는 있지만 나트륨 자료가 없는 메뉴명 */
  sodiumMissing: string[]
  /** 손님이 소금으로 간을 하는 국물 메뉴(나트륨에 소금이 빠져 있음) */
  saltAtTable: string[]
  sodiumStatus: NutritionStatus
  servingG: number
  /** 영양 자료가 있는 메뉴 수 */
  known: number
  /** 영양 자료가 없는 메뉴명 */
  missing: string[]
  kcalStatus: NutritionStatus
  proteinStatus: NutritionStatus
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
  /** 날짜순 하루 영양 합계 */
  dayNutrition: DayNutrition[]
  /** 영양 자료가 모두 있는 날의 평균. 그런 날이 없으면 null */
  avgKcal: number | null
  avgProteinG: number | null
  avgSodiumMg: number | null
  /** 영양 자료가 모두 있는 날 수 */
  completeDays: number
  /** 그중 열량·단백질 목표를 모두 채운 날 수 */
  onTargetDays: number
  nutritionKnownItems: number
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
  // 날짜가 비었거나 잘못되면 다음 월요일부터 짭니다(화면에서는 막지만 함수 단독 호출 대비).
  const parsed = startDate ? parseDate(startDate) : null
  const date = parsed && !Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 ? parsed : parseDate(nextMonday())
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

// ───────────────────────── 영양 ─────────────────────────

function round1(value: number) {
  return Math.round(value * 10) / 10
}

/** 메뉴 하나의 1인 분량 기준 열량·단백질. 영양 자료가 없으면 null */
export function itemNutrition(item: PlanMenuItem, portions: Record<MealSlot, number>): ItemNutrition | null {
  const data = nutritionOf(item.name)
  if (!data) return null
  const servingG = portions[item.slot]
  return {
    servingG,
    kcal: (data.kcal100 * servingG) / 100,
    proteinG: (data.protein100 * servingG) / 100,
    sodiumMg: data.sodium100 === null ? null : (data.sodium100 * servingG) / 100,
  }
}

/** 하루 영양 합계. 자료 없는 메뉴는 합계에서 빼고 missing에 적습니다. */
export function computeDayNutrition(day: PlanDay, options: MealPlanOptions): DayNutrition {
  const { target, portions } = options
  let kcal = 0
  let proteinG = 0
  let sodiumMg = 0
  let servingG = 0
  let known = 0
  const missing: string[] = []
  const sodiumMissing: string[] = []
  const saltAtTable: string[] = []
  dayItems(day).forEach((item) => {
    const data = itemNutrition(item, portions)
    if (!data) {
      missing.push(item.name)
      return
    }
    known += 1
    kcal += data.kcal
    proteinG += data.proteinG
    if (nutritionOf(item.name)?.saltAtTable) saltAtTable.push(item.name)
    if (data.sodiumMg === null) sodiumMissing.push(item.name)
    else sodiumMg += data.sodiumMg
    servingG += data.servingG
  })

  const complete = missing.length === 0 && known > 0
  let kcalStatus: NutritionStatus = 'none'
  let proteinStatus: NutritionStatus = 'none'
  if (known > 0) {
    // 일부 자료가 빠진 합계는 실제보다 작으므로, 이미 넘은 경우만 확정해서 알립니다.
    // 목표 ±3%(단백질 -5%) 안은 적정으로 봅니다. 화면 경고와 같은 기준입니다.
    if (kcal > target.kcalMax * 1.03) kcalStatus = 'high'
    else if (!complete) kcalStatus = 'partial'
    else kcalStatus = kcal < target.kcalMin * 0.97 ? 'low' : 'ok'

    if (proteinG >= target.proteinMin * 0.95) proteinStatus = 'ok'
    else proteinStatus = complete ? 'low' : 'partial'
  }
  let sodiumStatus: NutritionStatus = 'none'
  if (known > 0) {
    if (sodiumMg > target.sodiumMax * 1.03) sodiumStatus = 'high'
    else sodiumStatus = complete && sodiumMissing.length === 0 ? 'ok' : 'partial'
  }

  return {
    kcal: Math.round(kcal),
    proteinG: round1(proteinG),
    sodiumMg: Math.round(sodiumMg),
    sodiumMissing,
    saltAtTable,
    sodiumStatus,
    servingG: Math.round(servingG),
    known,
    missing,
    kcalStatus,
    proteinStatus,
  }
}

const slotAverageCache = new Map<string, { kcal: number; proteinG: number; sodiumMg: number } | null>()

/** 아직 고르지 않은 칸의 예상치: 그 칸 후보 메뉴들의 평균(자료 있는 메뉴만) */
function slotAverage(row: PlanRow, type: DayType, options: MealPlanOptions) {
  const key = `${row}|${type}|${options.season}|${JSON.stringify(options.portions)}`
  if (slotAverageCache.has(key)) return slotAverageCache.get(key) ?? null
  const values = poolFor(row, type, options)
    .map((item) => itemNutrition(item, options.portions))
    .filter((data) => data !== null)
  const average =
    values.length === 0
      ? null
      : {
          kcal: values.reduce((sum, data) => sum + data.kcal, 0) / values.length,
          proteinG: values.reduce((sum, data) => sum + data.proteinG, 0) / values.length,
          sodiumMg: (() => {
            const known = values.map((data) => data.sodiumMg).filter((value): value is number => value !== null)
            return known.length === 0 ? 0 : known.reduce((sum, value) => sum + value, 0) / known.length
          })(),
        }
  slotAverageCache.set(key, average)
  return average
}

/** 후보를 넣었을 때 하루 합계가 목표에서 얼마나 벗어날지에 따른 감점 */
function nutritionPenalty(candidate: PlanMenuItem, ctx: ScoreContext) {
  const { plan, dayIndex, row, options } = ctx
  const day = plan[dayIndex]
  const data = itemNutrition(candidate, options.portions)
  // 자료 없는 메뉴는 그 칸 평균값으로 추정해 계산하고, 확인할 수 없다는 점만큼 조금 뒤로 미룹니다.
  const own = data ?? slotAverage(row, day.type, options)
  let penalty = data ? 0 : 1.5
  if (!own) return penalty + 2

  let kcal = own.kcal
  let proteinG = own.proteinG
  // 나트륨 자료가 없는 메뉴를 0으로 치면 오히려 유리해지므로 그 칸 평균으로 계산합니다.
  let sodiumMg = own.sodiumMg ?? slotAverage(row, day.type, options)?.sodiumMg ?? 0
  for (const other of planRows) {
    if (other === row) continue
    const item = day.cells[other]
    if (item) {
      const known = itemNutrition(item, options.portions) ?? slotAverage(other, day.type, options)
      if (!known) continue
      kcal += known.kcal
      proteinG += known.proteinG
      sodiumMg += known.sodiumMg ?? slotAverage(other, day.type, options)?.sodiumMg ?? 0
    } else if (!isRowEmpty(day, other)) {
      const expected = slotAverage(other, day.type, options)
      if (!expected) continue
      kcal += expected.kcal
      proteinG += expected.proteinG
      sodiumMg += expected.sodiumMg
    }
  }

  const { kcalMin, kcalMax, proteinMin } = options.target
  if (kcal > kcalMax) penalty += Math.min(14, (kcal - kcalMax) / 20)
  if (kcal < kcalMin) penalty += Math.min(14, (kcalMin - kcal) / 20)
  if (proteinG < proteinMin) penalty += Math.min(10, (proteinMin - proteinG) / 1.5)
  // 나트륨 상한을 넘는 조합은 낮추고, '염도'를 피할 요소로 고르면 더 크게 낮춥니다.
  const { sodiumMax } = options.target
  if (sodiumMg > sodiumMax) {
    penalty += options.avoid.includes('염도') ? Math.min(60, (sodiumMg - sodiumMax) / 20) : Math.min(30, (sodiumMg - sodiumMax) / 40)
  }
  return penalty
}

function scoreCandidate(candidate: PlanMenuItem, ctx: ScoreContext) {
  const { plan, dayIndex, row, options, rng } = ctx
  const day = plan[dayIndex]
  const sameDay = dayItems(day, row)
  let score = rng() * 2

  if (options.preferPopular && candidate.preferred) score += 3

  // 영양 자료 없는 메뉴는 하루 1개까지만 둡니다(그날 합계를 판정할 수 있게).
  if (!itemNutrition(candidate, options.portions) && sameDay.some((item) => !itemNutrition(item, options.portions))) score -= 12
  // 나트륨 자료가 없는 메뉴는 그날 나트륨을 판정할 수 없게 하므로 뒤로 미루고, 하루 1개까지만 둡니다.
  if (itemNutrition(candidate, options.portions)?.sodiumMg === null) {
    score -= sameDay.some((item) => itemNutrition(item, options.portions)?.sodiumMg === null) ? 12 : 6
  }

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

  score -= nutritionPenalty(candidate, ctx)

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
    // 시작일이 월요일이 아니어도 요일 배치(수·금 일품 등)가 실제 요일을 따르게 합니다.
    type: pattern[(date.getDay() + 6) % 7] ?? pattern[index % 5],
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
    if (shared.length > 0) warnings.push(`${attachJosa(prev.date, '과/와')} ${day.date}의 중심 메뉴 단백질(${shared[0]})이 이어집니다.`)
  })
  if (repeatedCenterMenus.length > 0) {
    warnings.push(`기간 내 중심 메뉴가 반복됩니다: ${repeatedCenterMenus.join(', ')}`)
  }

  const { target } = plan.options
  const dayNutrition = plan.days.map((day) => computeDayNutrition(day, plan.options))
  dayNutrition.forEach((nutrition, index) => {
    const day = plan.days[index]
    const label = `${day.date}(${day.weekdayLabel})`
    if (nutrition.kcalStatus === 'high') {
      if (nutrition.kcal > target.kcalMax * 1.03) warnings.push(`${label} 열량이 ${nutrition.kcal}kcal로 목표 상한 ${target.kcalMax}kcal를 넘습니다.`)
    } else if (nutrition.kcalStatus === 'low') {
      if (nutrition.kcal < target.kcalMin * 0.97) warnings.push(`${label} 열량이 ${nutrition.kcal}kcal로 목표 하한 ${target.kcalMin}kcal에 못 미칩니다.`)
    }
    if (nutrition.kcalStatus === 'partial' && nutrition.kcal < target.kcalMin * 0.8) {
      warnings.push(`${label} 영양 자료 없는 메뉴(${nutrition.missing.join(', ')})가 있어 합계가 ${nutrition.kcal}kcal로 낮게 나옵니다. 실제 분량을 확인해 주세요.`)
    }
    if (nutrition.sodiumStatus === 'high') {
      const overDaily = nutrition.sodiumMg > SODIUM_DAILY_REFERENCE ? ` 하루 기준 ${SODIUM_DAILY_REFERENCE.toLocaleString('ko-KR')}mg도 넘습니다.` : ''
      warnings.push(
        `${label} 나트륨이 ${nutrition.sodiumMg.toLocaleString('ko-KR')}mg으로 한 끼 상한 ${target.sodiumMax.toLocaleString('ko-KR')}mg을 넘습니다(국물을 모두 먹었을 때 기준).${overDaily}`,
      )
    }
    if (nutrition.proteinStatus === 'low') {
      if (nutrition.proteinG < target.proteinMin * 0.95) warnings.push(`${label} 단백질이 ${nutrition.proteinG}g으로 목표 ${target.proteinMin}g에 못 미칩니다.`)
    }
  })
  const completeDays = dayNutrition.filter((nutrition) => nutrition.known > 0 && nutrition.missing.length === 0)
  const average = (pick: (nutrition: DayNutrition) => number) =>
    completeDays.length === 0
      ? null
      : completeDays.reduce((sum, nutrition) => sum + pick(nutrition), 0) / completeDays.length
  const avgKcal = average((nutrition) => nutrition.kcal)
  const avgProteinG = average((nutrition) => nutrition.proteinG)
  const sodiumDays = completeDays.filter((nutrition) => nutrition.sodiumMissing.length === 0)
  const avgSodiumMg = sodiumDays.length === 0 ? null : sodiumDays.reduce((sum, nutrition) => sum + nutrition.sodiumMg, 0) / sodiumDays.length

  return {
    totalItems: items.length,
    preferredItems: items.filter((item) => item.preferred).length,
    proteinCounts: [...proteinMap.entries()].map(([protein, count]) => ({ protein, count })).sort((a, b) => b.count - a.count),
    repeatedCenterMenus,
    warnings,
    dayNutrition,
    avgKcal: avgKcal === null ? null : Math.round(avgKcal),
    avgProteinG: avgProteinG === null ? null : round1(avgProteinG),
    avgSodiumMg: avgSodiumMg === null ? null : Math.round(avgSodiumMg),
    completeDays: completeDays.length,
    onTargetDays: completeDays.filter(
      (nutrition) => nutrition.kcalStatus === 'ok' && nutrition.proteinStatus === 'ok',
    ).length,
    nutritionKnownItems: dayNutrition.reduce((sum, nutrition) => sum + nutrition.known, 0),
  }
}

/** 엑셀에 붙여넣을 수 있는 탭 구분 텍스트. 메뉴명 아래에 하루 열량·단백질·나트륨 합계를 붙입니다. */
export function planToTsv(plan: MealPlan) {
  const header = ['구분', ...plan.days.map((day) => `${day.date.slice(5).replace('-', '/')}(${day.weekdayLabel})`)]
  const typeRow = ['유형', ...plan.days.map((day) => day.type)]
  const rows = planRows.map((row) => [planRowLabels[row], ...plan.days.map((day) => day.cells[row]?.name ?? '-')])
  const totals = plan.days.map((day) => computeDayNutrition(day, plan.options))
  const mark = (nutrition: DayNutrition, value: number) =>
    nutrition.known === 0 ? '자료 없음' : nutrition.missing.length > 0 ? `${value} (일부 제외)` : String(value)
  const kcalRow = ['열량(kcal)', ...totals.map((nutrition) => mark(nutrition, nutrition.kcal))]
  const proteinRow = ['단백질(g)', ...totals.map((nutrition) => mark(nutrition, nutrition.proteinG))]
  const sodiumRow = [
    '나트륨(mg)',
    ...totals.map((nutrition) =>
      nutrition.sodiumMissing.length > 0 && nutrition.missing.length === 0 ? `${nutrition.sodiumMg} (일부 제외)` : mark(nutrition, nutrition.sodiumMg),
    ),
  ]
  return [header, typeRow, ...rows, kcalRow, proteinRow, sodiumRow].map((cols) => cols.join('\t')).join('\n')
}
