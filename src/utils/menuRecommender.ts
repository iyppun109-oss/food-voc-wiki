import {
  type CustomerType,
  type MainMenuItem,
  type MenuDirection,
  type MealType,
  type VocRisk,
  menuMainItems,
} from '../data/menuMainItems'
import type { SideMenuItem } from '../data/menuSideItems'
import { menuSideItems } from '../data/menuSideItems'
import { menuSoupItems } from '../data/menuSoupItems'
import { menuVocRiskRuleMap, type MenuVocRiskRule } from '../data/menuVocRiskRules'
import { menuScenarioRules, scenarioByAvoidRisk } from '../data/menuScenarioRules'
import { attachJosa } from './koreanJosa'

export type AvoidIssue = VocRisk | '없음'

export type BudgetOption = '8,000원' | '9,000원' | '11,000원' | '직접 입력'

export interface MenuLabInput {
  mealType: MealType
  budget: BudgetOption
  customBudget: string
  customerType: CustomerType
  direction: MenuDirection
  avoidIssues: AvoidIssue[]
  memo: string
  /** 계절 메뉴 판단에 쓰는 달(1~12). 없으면 오늘 날짜의 달 */
  month?: number
}

export interface MenuRecommendationItem {
  rank: number
  menuName: string
  category: string
  highlights: string[]
  reason: string
  /** 메뉴 자체의 강점(짧은 명사구) */
  strengths: string[]
  composition: {
    main: string
    soup: string
    sides: string[]
  }
  preventionPoints: string[]
  upgradeIdeas: string[]
  operationNotes: string[]
  alternatives: string[]
}

export interface MenuRecommendationResult {
  /** 조건끼리 부딪혀 점수를 조정한 경우의 안내 */
  notes: string[]
  scenarioSummary: string[]
  /** 고른 VOC에 대한 예방 포인트(세 안에 공통이라 한 번만 보여 줌) */
  preventionPoints: string[]
  /** 이런 신호가 보이면 바로 점검할 항목(관찰 사실이 아니라 점검 기준) */
  watchSigns: string[]
  /** 운영 시나리오 문장 */
  scenarios: string[]
  recommendations: MenuRecommendationItem[]
}

type BudgetTier = 'economy' | 'standard'

const budgetThreshold: Record<BudgetTier, number> = {
  economy: 9000,
  standard: 10500,
}

const issueToRisk: Record<AvoidIssue, VocRisk[]> = {
  품절: ['품절'],
  '양 부족': ['양 부족'],
  염도: ['염도'],
  느끼함: ['느끼함'],
  대기시간: ['대기시간'],
  '보온 지연': ['보온 지연'],
  '이물 혼입': ['이물 혼입'],
  위생: ['위생'],
  '고객 불편': ['고객 불편'],
  '직원 응대': ['직원 응대'],
  없음: [],
}

function parseBudgetValue(option: BudgetOption, customBudget: string): number {
  if (option !== '직접 입력') {
    return Number(option.replace(/,/g, '').replace('원', ''))
  }

  const raw = Number(customBudget.replace(/[^\d]/g, ''))
  return Number.isNaN(raw) ? 0 : raw
}

function detectBudgetTier(budget: number): BudgetTier {
  return budget >= budgetThreshold.standard ? 'standard' : 'economy'
}

function dedupeText(lines: string[], limit?: number) {
  const used = new Set<string>()
  const output: string[] = []

  for (const line of lines) {
    const key = line.replace(/\s+/g, '')
    if (!line.trim() || used.has(key)) continue
    used.add(key)
    output.push(line)
  }

  return typeof limit === 'number' ? output.slice(0, limit) : output
}

function normalizeAvoidIssues(values: AvoidIssue[]): AvoidIssue[] {
  const unique = Array.from(new Set(values.filter(Boolean)))
  const normalized = unique.filter((value) => value !== '없음')
  return normalized.length > 0 ? normalized : ['없음']
}

function detectMemoRisks(memo: string): VocRisk[] {
  // '짜장면이 맛있었어요'처럼 칭찬한 구절은 판정에서 뺍니다.
  const text = memo
    .split(/[\n,.!?]|그리고|근데|하지만|지만|는데|은데/)
    .filter((clause) => !/(맛있|좋았|좋아요|좋다|괜찮|만족|칭찬|친절하|인기)/.test(clause))
    .join(' ')
    .trim()
  if (!text) return []

  const result = new Set<VocRisk>()

  if (/품절|없어짐|안 들어옴/.test(text)) {
    result.add('품절')
  }
  if (/양 부족|양이 (적|부족)|적게|모자/.test(text)) {
    result.add('양 부족')
  }
  if (/짜(?!장|글|파게티|증)|짠|짰|짭|염도|간이 (강|세|쎄)|싱겁/.test(text)) {
    result.add('염도')
  }
  if (/느끼|기름|기름진/.test(text)) {
    result.add('느끼함')
  }
  if (/대기|기다리|줄(이|을)?\s?(길|서|섰|많)/.test(text)) {
    result.add('대기시간')
  }
  if (/식어|차갑|보온/.test(text)) {
    result.add('보온 지연')
  }
  if (/이물|이물질|돌(멩이|\s?조각|이 (나|씹))|머리카락|털이|이상한 게/.test(text)) {
    result.add('이물 혼입')
  }
  if (/위생|청결|불결|위생관리/.test(text)) {
    result.add('위생')
  }
  if (/불친절|응대|태도|반말/.test(text)) {
    result.add('직원 응대')
  }
  if (/안내(가|를)?\s?(없|부족|못)|불편/.test(text)) {
    result.add('고객 불편')
  }

  return Array.from(result)
}

function toRiskSet(avoidIssues: AvoidIssue[]) {
  const normalized = avoidIssues

  return Array.from(
    new Set(
      normalized.flatMap((issue) => {
        const risks = issueToRisk[issue]
        return risks
      }),
    ),
  )
}

function getScenarioRules(input: MenuLabInput, risks: VocRisk[]) {
  const byRisk = risks.flatMap((risk) => scenarioByAvoidRisk[risk] ?? [])
  const byDirection = menuScenarioRules
    .filter((rule) => rule.recommendedDirections.includes(input.direction))
    .map((rule) => rule.id)

  const merged = dedupeText([...byRisk, ...byDirection])
  return merged
    .map((id) => menuScenarioRules.find((rule) => rule.id === id))
    .filter((rule): rule is (typeof menuScenarioRules)[number] => rule !== undefined)
}

function scoreMain(menu: MainMenuItem, input: MenuLabInput, risks: VocRisk[]) {
  const budgetTier = detectBudgetTier(parseBudgetValue(input.budget, input.customBudget))
  let score = 0

  if (menu.mealFit.includes(input.mealType)) score += 4
  if (menu.customerFit.includes(input.customerType)) score += 3
  if (menu.directions.includes(input.direction)) score += 3
  // 단가: 기본 단가 이하는 가성비 메뉴, 높은 단가는 프리미엄 메뉴를 우선합니다.
  if (budgetTier === 'economy' && menu.directions.includes('가성비')) score += 2
  if (budgetTier === 'economy' && menu.directions.includes('프리미엄')) score -= 2
  if (budgetTier === 'standard' && menu.directions.includes('프리미엄')) score += 2

  for (const risk of risks) {
    if (menu.risks.includes(risk)) {
      score -= 5
    } else {
      score += 1
    }
  }

  // 야식·보온 지연·대기시간 조건에서는 붇거나 식기 쉬운 메뉴를 낮춥니다.
  const timeRisk = input.mealType === '야식' || risks.includes('보온 지연') || risks.includes('대기시간')
  if (timeRisk && menu.timeSensitive) score -= 8

  return score
}

function pickTop<T>(items: T[], count: number) {
  return items.slice(0, Math.min(count, items.length))
}

const sideSimilarityGroups: Array<{ key: string; names: string[]; limit: number }> = [
  { key: 'potato-group', names: ['감자볶음', '감자채볶음', '감자조림'], limit: 1 },
  { key: 'kimchi-group', names: ['김치', '깍두기', '무생채'], limit: 2 },
  { key: 'egg-group', names: ['계란찜', '계란말이', '스크램블에그', '오믈렛'], limit: 1 },
  { key: 'bean-sprout-group', names: ['콩나물무침', '콩나물'], limit: 1 },
  { key: 'pickle-group', names: ['피클', '단무지', '짜사이'], limit: 1 },
  { key: 'raw-salad-group', names: ['겉절이', '샐러드'], limit: 1 },
  { key: 'pancake-group', names: ['김치전', '두부부침', '군만두'], limit: 1 },
]

function sideGroupForName(sideName: string): string | undefined {
  const normalized = sideName.replace(/\s+/g, '')
  return sideSimilarityGroups.find((group) =>
    group.names.some((name) => normalized.includes(name.replace(/\s+/g, ''))),
  )?.key
}

/**
 * 메뉴명에서 주재료를 추정하는 토큰. 메인·국·찬 사이 주재료 중복(예: 두부김치 정식 + 두부조림)을 막습니다.
 * Phase 3에서 메뉴 DB에 재료 속성을 추가하면 이 목록은 대체됩니다.
 */
const ingredientTokens = [
  '감자',
  '고구마',
  '두부',
  '계란',
  '김치',
  '오징어',
  '어묵',
  '버섯',
  '콩나물',
  '멸치',
  '새우',
  '오이',
  '미역',
  '가지',
  '연근',
  '마늘쫑',
  '묵',
  '숙주',
  '양배추',
  '만두',
  '잡채',
]

function tokensOf(name: string) {
  return ingredientTokens.filter((token) => name.includes(token))
}

function selectSides(menu: MainMenuItem, risks: VocRisk[], usedElsewhere: Set<string>, soupName: string) {
  const blockedTokens = new Set([...tokensOf(menu.name), ...tokensOf(soupName)])
  const candidates = menuSideItems
    .map((side: SideMenuItem) => {
      let score = 0
      if (menu.bestSides.includes(side.name)) score += 4
      if (menu.avoidSides.includes(side.name)) score -= 10
      if (side.fitWith.includes(menu.category)) score += 1
      if (!side.risks.some((risk) => risks.includes(risk))) score += 2
      if (risks.includes('염도') && side.roles.includes('담백형')) score += 1
      if (risks.includes('느끼함') && side.roles.includes('기름 관리')) score += 1
      if (usedElsewhere.has(side.name)) score -= 3
      return { side, score }
    })
    .sort((a, b) => b.score - a.score || a.side.name.localeCompare(b.side.name))
    .map((entry) => entry.side)

  const selected: SideMenuItem[] = []
  const selectedNames = new Set<string>()
  const groupCount = new Map<string, number>()

  for (const side of candidates) {
    if (selectedNames.has(side.name)) continue
    const sideTokens = tokensOf(side.name)
    if (sideTokens.some((token) => blockedTokens.has(token))) continue

    const groupKey = sideGroupForName(side.name)
    const limit = sideSimilarityGroups.find((group) => group.key === groupKey)?.limit ?? 2
    const used = groupCount.get(groupKey ?? side.name) ?? 0
    if (used >= limit) continue

    groupCount.set(groupKey ?? side.name, used + 1)
    sideTokens.forEach((token) => blockedTokens.add(token))
    selectedNames.add(side.name)
    selected.push(side)

    if (selected.length >= 3) break
  }

  return pickTop(selected, 3)
}

function selectSoups(menu: MainMenuItem, risks: VocRisk[], usedElsewhere: Set<string>, mealType: MealType) {
  const mainTokens = new Set(tokensOf(menu.name))
  const compatible = menuSoupItems.filter((soup) => !tokensOf(soup.name).some((token) => mainTokens.has(token)))
  // 다른 추천안에서 이미 쓴 국은 대안이 있는 한 제외해 3개 안의 국이 겹치지 않게 합니다.
  const unused = compatible.filter((soup) => !usedElsewhere.has(soup.name))
  const candidates = (unused.length > 0 ? unused : compatible)
    .map((soup) => {
      let score = 0
      if (menu.bestSoups.includes(soup.name)) score += 4
      // 고른 VOC에 약한 국은 메인과 잘 어울려도 뒤로 미룹니다(예: 염도를 피할 때 된장국·장국).
      if (soup.risks.some((risk) => risks.includes(risk))) score -= 8
      else score += 2
      if (risks.includes('염도') && soup.roles.includes('담백')) score += 1
      if (soup.fitWith.includes(mealType)) score += 2
      // 조식에는 무거운 찌개·탕보다 맑은 국을 우선합니다.
      if (mealType === '조식' && /(찌개|탕|전골)/.test(soup.name)) score -= 4
      return { soup, score }
    })
    .sort((a, b) => b.score - a.score || a.soup.name.localeCompare(b.soup.name))
    .map((entry) => entry.soup)

  return candidates[0] ?? menuSoupItems[0]
}

function getRiskPreventionLines(risks: VocRisk[]) {
  const lines = risks
    .map((risk) => menuVocRiskRuleMap[risk])
    .filter((rule): rule is MenuVocRiskRule => Boolean(rule))
    .flatMap((rule) => [...rule.preventionTips])

  return dedupeText(lines, 4)
}

function getWatchSigns(risks: VocRisk[]) {
  return dedupeText(
    risks.flatMap((risk) => menuVocRiskRuleMap[risk]?.warningSigns ?? []),
    4,
  )
}

function getOperationLines(menu: MainMenuItem) {
  return dedupeText(menu.operationNotes, 3)
}

function getUpgradeIdeas(menu: MainMenuItem) {
  return dedupeText(menu.upgradeIdeas, 3)
}

function buildComposition(menu: MainMenuItem, sideNames: string[], soupName: string) {
  return {
    main: menu.name,
    soup: soupName || '따로 없음(국물 메뉴)',
    sides: dedupeText(sideNames, 3),
  }
}

/** 대체 메뉴: 이미 추천안으로 제시한 메인은 제외합니다. */
function buildAlternatives(mainItems: MainMenuItem[], excludedNames: Set<string>, offset: number) {
  const names = dedupeText(mainItems.filter((menu) => !excludedNames.has(menu.name)).map((menu) => menu.name))
  return names.slice(offset * 2, offset * 2 + 2)
}

/** 메뉴가 직접 낮출 수 있는 VOC만 이유로 씁니다(직원 응대·고객 불편은 메뉴와 무관). */
const menuControllableRisks: VocRisk[] = ['품절', '양 부족', '염도', '느끼함', '대기시간', '보온 지연', '이물 혼입', '위생']

function buildReason(menu: MainMenuItem, input: MenuLabInput, risks: VocRisk[]) {
  const fits: string[] = []
  if (menu.mealFit.includes(input.mealType)) fits.push(input.mealType)
  if (menu.customerFit.includes(input.customerType) && input.customerType !== '일반') fits.push(`${input.customerType} 고객`)
  if (menu.directions.includes(input.direction)) fits.push(`'${input.direction}' 방향`)
  const fitLine = fits.length > 0 ? `${attachJosa(menu.name, '은/는')} ${fits.join(', ')}에 잘 맞는 메뉴입니다.` : `${attachJosa(menu.name, '은/는')} 조건에 무난하게 맞는 메뉴입니다.`
  // 면·튀김류는 시간이 지나면 붇거나 눅눅해지므로 보온 지연·대기시간에 약한 메뉴로 봅니다.
  const isWeakTo = (risk: VocRisk) =>
    menu.risks.includes(risk) || ((risk === '보온 지연' || risk === '대기시간') && menu.timeSensitive)
  const avoided = risks.filter((risk) => menuControllableRisks.includes(risk) && !isWeakTo(risk))
  const weak = risks.filter((risk) => menuControllableRisks.includes(risk) && isWeakTo(risk))
  const lines = [fitLine]
  if (avoided.length > 0) lines.push(`피하려는 VOC 중 ${avoided.join(', ')} 우려가 적은 편입니다.`)
  if (weak.length > 0) lines.push(`다만 ${weak.join(', ')}에는 주의가 필요합니다.`)
  return lines.join(' ')
}

/**
 * 상위 3안을 고를 때 같은 차림 형태(정식·덮밥·면·국물·세트)가 겹치면 3점 낮춰 다시 비교합니다.
 * 점수 차이가 크면 같은 형태라도 그대로 올라옵니다.
 */
function pickVaried(ranked: MainMenuItem[], scoreOf: (menu: MainMenuItem) => number) {
  const picked: MainMenuItem[] = []
  const remaining = [...ranked]
  while (picked.length < 3 && remaining.length > 0) {
    let bestIndex = 0
    let bestScore = -Infinity
    remaining.forEach((menu, index) => {
      const sameForm = picked.filter((item) => item.form === menu.form).length
      const sameCategory = picked.filter((item) => item.category === menu.category).length
      const score = scoreOf(menu) - sameForm * 3 - sameCategory
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })
    picked.push(remaining.splice(bestIndex, 1)[0])
  }
  return picked
}

/** 점수가 같을 때 쓰는 순서. 입력 조건마다 달라져서 이름 순으로 늘 같은 메뉴가 올라오지 않게 합니다. */
function tieOrder(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function dedupeMenus(items: MainMenuItem[]) {
  const used = new Set<string>()
  return items.filter((menu) => {
    if (used.has(menu.name)) return false
    used.add(menu.name)
    return true
  })
}

export function recommendMenus(input: MenuLabInput): MenuRecommendationResult {
  const avoidInput = toRiskSet(normalizeAvoidIssues(input.avoidIssues))
  const avoidMemo = detectMemoRisks(input.memo)
  const avoidRisks = Array.from(new Set([...avoidInput, ...avoidMemo]))
  const scenarioRules = getScenarioRules(input, avoidRisks)
  const scenarioSummary = dedupeText(
    scenarioRules.flatMap((rule) => rule.strategy),
    4,
  )
  const scenarios = dedupeText(scenarioRules.map((rule) => rule.scenario), 2)
  const preventionPoints = getRiskPreventionLines(avoidRisks)
  const watchSigns = getWatchSigns(avoidRisks)

  const month = input.month ?? new Date().getMonth() + 1
  // 계절이 맞지 않는 메뉴(여름 냉면 등)는 빼고, 식사 구분에 맞는 메뉴가 3개 이상이면 그 안에서만 고릅니다.
  const inSeason = dedupeMenus(menuMainItems).filter((menu) => !menu.months || menu.months.includes(month))
  const mealFitting = inSeason.filter((menu) => menu.mealFit.includes(input.mealType))
  const pool = mealFitting.length >= 3 ? mealFitting : inSeason
  const conditionKey = [input.mealType, input.budget, input.customBudget, input.customerType, input.direction, avoidRisks.join(',')].join('|')
  const ranked = pool
    .map((menu) => ({ menu, score: scoreMain(menu, input, avoidRisks), tie: tieOrder(`${conditionKey}|${menu.name}`) }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .map((entry) => entry.menu)

  const topMenus = pickVaried(ranked, (menu) => scoreMain(menu, input, avoidRisks))
  const recommendedNames = new Set(topMenus.map((menu) => menu.name))
  const usedSides = new Set<string>()
  const usedSoups = new Set<string>()

  const recommendations = topMenus.map((menu, index) => {
    const hasOwnSoup = menu.hasSoup
    const selectedSoup = hasOwnSoup ? null : selectSoups(menu, avoidRisks, usedSoups, input.mealType)
    const selectedSides = selectSides(menu, avoidRisks, usedSides, selectedSoup?.name ?? '')
    selectedSides.forEach((side) => usedSides.add(side.name))
    if (selectedSoup) usedSoups.add(selectedSoup.name)

    return {
      rank: index + 1,
      menuName: menu.name,
      category: menu.category,
      highlights: scenarioSummary,
      reason: buildReason(menu, input, avoidRisks),
      strengths: menu.strengths,
      composition: buildComposition(menu, selectedSides.map((item) => item.name), selectedSoup?.name ?? ''),
      preventionPoints,
      upgradeIdeas: getUpgradeIdeas(menu),
      alternatives: buildAlternatives(ranked, recommendedNames, index),
      operationNotes: getOperationLines(menu),
    }
  })

  const notes: string[] = []
  const memoOnly = avoidMemo.filter((risk) => !avoidInput.includes(risk))
  if (memoOnly.length > 0) notes.push(`추가 메모에서 ${memoOnly.join(', ')} 관련 내용을 찾아 피할 VOC로 함께 반영했습니다.`)
  const budgetValue = parseBudgetValue(input.budget, input.customBudget)
  if (input.direction === '프리미엄' && detectBudgetTier(budgetValue) === 'economy') {
    notes.push(`식단가 ${budgetValue.toLocaleString('ko-KR')}원은 프리미엄 메뉴를 운영하기 빠듯해, 단가에 맞는 메뉴 위주로 골랐습니다.`)
  }

  return {
    notes,
    scenarioSummary,
    preventionPoints,
    watchSigns,
    scenarios,
    recommendations,
  }
}
