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
}

export interface MenuRecommendationItem {
  rank: number
  menuName: string
  category: string
  highlights: string[]
  reason: string
  composition: {
    main: string
    soup: string
    sides: string[]
  }
  preventionPoints: string[]
  upgradeIdeas: string[]
  operationNotes: string[]
  alternatives: string[]
  scenario: string
}

export interface MenuRecommendationResult {
  scenarioSummary: string[]
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
  const text = memo.trim()
  if (!text) return []

  const result = new Set<VocRisk>()

  if (/품절|없어짐|안 들어옴/.test(text)) {
    result.add('품절')
  }
  if (/양 부족|부족|적게/.test(text)) {
    result.add('양 부족')
  }
  if (/짠|염도|간이 강|짠맛/.test(text)) {
    result.add('염도')
  }
  if (/느끼|기름|기름진/.test(text)) {
    result.add('느끼함')
  }
  if (/대기|기다리|대기시간|줄/.test(text)) {
    result.add('대기시간')
  }
  if (/식어|차갑|보온/.test(text)) {
    result.add('보온 지연')
  }
  if (/이물|이물질|입자|작은 물|돌|털|이상한 물/.test(text)) {
    result.add('이물 혼입')
  }
  if (/위생|청결|불결|위생관리/.test(text)) {
    result.add('위생')
  }
  if (/응대|설명|불편|불친절|문의/.test(text)) {
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
  if (budgetTier === 'standard' && menu.strengths.length >= 4) score += 2

  for (const risk of risks) {
    if (menu.risks.includes(risk)) {
      score -= 5
    } else {
      score += 1
    }
  }

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
]

function sideGroupForName(sideName: string): string | undefined {
  const normalized = sideName.replace(/\s+/g, '')
  return sideSimilarityGroups.find((group) =>
    group.names.some((name) => normalized.includes(name.replace(/\s+/g, ''))),
  )?.key
}

function selectSides(mainCategory: string, risks: VocRisk[]) {
  const candidates = menuSideItems
    .map((side: SideMenuItem) => {
      let score = 0
      if (side.fitWith.includes(mainCategory)) score += 2
      if (!side.risks.some((risk) => risks.includes(risk))) score += 2
      if (risks.includes('염도') && side.roles.includes('담백형')) score += 1
      if (risks.includes('느끼함') && side.roles.includes('기름 관리')) score += 1
      return { side, score }
    })
    .sort((a, b) => b.score - a.score || a.side.name.localeCompare(b.side.name))
    .map((entry) => entry.side)

  const selected: SideMenuItem[] = []
  const groupCount = new Map<string, number>()

  for (const side of candidates) {
    const groupKey = sideGroupForName(side.name)
    const limit = sideSimilarityGroups.find((group) => group.key === groupKey)?.limit ?? 2
    const used = groupCount.get(groupKey ?? side.name) ?? 0

    if (used >= limit) continue

    const nextUsed = used + 1
    groupCount.set(groupKey ?? side.name, nextUsed)
    selected.push(side)

    if (selected.length >= 3) break
  }

  return pickTop(selected, 3)
}

function selectSoups(mainCategory: string, risks: VocRisk[]) {
  const candidates = menuSoupItems
    .map((soup) => {
      let score = 0
      if (soup.fitWith.includes(mainCategory)) score += 2
      if (!soup.risks.some((risk) => risks.includes(risk))) score += 2
      if (risks.includes('염도') && soup.roles.includes('담백')) score += 1
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

function getOperationLines(menu: MainMenuItem, risks: VocRisk[]) {
  const fromRisk = risks
    .map((risk) => menuVocRiskRuleMap[risk]?.warningSigns)
    .filter((lines): lines is string[] => Boolean(lines))
    .flat()

  return dedupeText([...menu.operationNotes, ...fromRisk], 3)
}

function getUpgradeIdeas(menu: MainMenuItem, risks: VocRisk[]) {
  const fromRisk = risks
    .map((risk) => menuVocRiskRuleMap[risk])
    .filter((rule): rule is MenuVocRiskRule => Boolean(rule))
    .flatMap((rule) => rule.preventionTips)

  return dedupeText([...menu.upgradeIdeas, ...fromRisk], 3)
}

function buildComposition(menu: MainMenuItem, sideNames: string[], soupName: string) {
  return {
    main: menu.name,
    soup: soupName || '국/탕',
    sides: dedupeText(sideNames, 3),
  }
}

function buildAlternatives(mainItems: MainMenuItem[], selectedName: string) {
  const filtered = mainItems.filter((menu) => menu.name !== selectedName)
  const names = dedupeText(filtered.map((menu) => menu.name))
  return pickTop(names, 2)
}

function buildReason(menu: MainMenuItem, scenarioSummary: string, risks: VocRisk[]) {
  const strength = menu.strengths[0] ?? '균형 있는 구성입니다.'
  const riskReason = risks
    .map((risk) => menuVocRiskRuleMap[risk]?.description)
    .filter((value): value is string => typeof value === 'string')
  const line = scenarioSummary || '상황 맞춤형 운영 조합으로 안정적으로 구성 가능합니다.'
  const reason = `${menu.name}은 ${strength} ${line} ${pickTop(riskReason, 1)[0] ?? ''}`
  return dedupeText([reason], 1)[0] ?? reason
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

  const ranked = dedupeMenus(menuMainItems)
    .map((menu) => ({ menu, score: scoreMain(menu, input, avoidRisks) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.menu.name.localeCompare(b.menu.name)
    })
    .map((entry) => entry.menu)

  const recommendations = ranked.slice(0, 3).map((menu, index) => {
    const selectedSides = selectSides(menu.category, avoidRisks)
    const selectedSoup = selectSoups(menu.category, avoidRisks)
    const preventionPoints = getRiskPreventionLines(avoidRisks)
    const upgradeIdeas = getUpgradeIdeas(menu, avoidRisks)
    const operationNotes = getOperationLines(menu, avoidRisks)
    const scenarioText =
      scenarioRules[index % Math.max(1, scenarioRules.length)]?.scenario ??
      '상황에 맞춰 제공량·간 조정 기준을 미리 고정해 운영 안정성을 확보합니다.'

    return {
      rank: index + 1,
      menuName: menu.name,
      category: menu.category,
      highlights: scenarioSummary,
      reason: buildReason(menu, scenarioText, avoidRisks),
      composition: buildComposition(menu, selectedSides.map((item) => item.name), selectedSoup?.name ?? ''),
      preventionPoints,
      upgradeIdeas,
      alternatives: buildAlternatives(ranked, menu.name),
      operationNotes,
      scenario: scenarioText,
    }
  })

  return {
    scenarioSummary,
    recommendations,
  }
}
