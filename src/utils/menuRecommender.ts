import {
  type CustomerType,
  type MainMenuItem,
  type MenuDirection,
  type MealType,
  type VocRisk,
  menuMainItems,
} from '../data/menuMainItems'
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
  composition: string
  reason: string
  preventionPoints: string[]
  upgradeIdeas: string[]
  alternatives: string
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

function dedupeText(lines: string[]) {
  const used = new Set<string>()
  const output: string[] = []

  for (const line of lines) {
    const key = line.replace(/\s+/g, '')
    if (!line.trim() || used.has(key)) continue
    used.add(key)
    output.push(line)
  }

  return output
}

function dedupeMenus(items: MainMenuItem[]) {
  const used = new Set<string>()
  return items.filter((menu) => {
    if (used.has(menu.name)) return false
    used.add(menu.name)
    return true
  })
}

function normalizeAvoidIssues(values: AvoidIssue[]): AvoidIssue[] {
  const unique = Array.from(new Set(values.filter(Boolean)))
  const normalized = unique.filter((value) => value !== '없음')
  return normalized.length > 0 ? normalized : ['없음']
}

function detectMemoRisks(memo: string): VocRisk[] {
  const text = memo.trim().toLowerCase()
  const result = new Set<VocRisk>()

  if (!text) return []

  if (text.includes('품절') || text.includes('안나오') || text.includes('공급없')) result.add('품절')
  if (text.includes('적다') || text.includes('부족') || text.includes('양이 적')) result.add('양 부족')
  if (text.includes('짠') || text.includes('염도') || text.includes('싱거')) result.add('염도')
  if (text.includes('느끼') || text.includes('기름') || text.includes('기름기')) result.add('느끼함')
  if (text.includes('기다') || text.includes('대기') || text.includes('줄어들')) result.add('대기시간')
  if (text.includes('차가') || text.includes('보온') || text.includes('식은')) result.add('보온 지연')
  if (text.includes('이물') || text.includes('돌') || text.includes('비닐')) result.add('이물 혼입')
  if (text.includes('위생') || text.includes('청결') || text.includes('오염')) result.add('위생')
  if (text.includes('불편') || text.includes('불쾌')) result.add('고객 불편')
  if (text.includes('응대') || text.includes('문의') || text.includes('안내')) result.add('직원 응대')

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
  if (menu.directions.includes(input.direction)) score += 4
  if (budgetTier === 'standard' && menu.strengths.length >= 4) score += 2

  for (const risk of risks) {
    if (menu.risks.includes(risk)) {
      score -= 6
    } else {
      score += 1
    }
  }

  return score
}

function pickTop<T>(items: T[], count: number) {
  return items.slice(0, Math.min(count, items.length))
}

function selectSides(mainCategory: string, risks: VocRisk[]) {
  const candidates = menuSideItems
    .map((side) => {
      let score = 0
      if (side.fitWith.includes(mainCategory)) score += 2
      if (!side.risks.some((risk) => risks.includes(risk))) score += 2
      if (side.roles.includes('메인 보완')) score += 1
      return { side, score }
    })
    .sort((a, b) => b.score - a.score || a.side.name.localeCompare(b.side.name))
    .map((entry) => entry.side)

  return pickTop(candidates, 2)
}

function selectSoups(mainCategory: string, risks: VocRisk[]) {
  const candidates = menuSoupItems
    .map((soup) => {
      let score = 0
      if (soup.fitWith.includes(mainCategory)) score += 2
      if (!soup.risks.some((risk) => risks.includes(risk))) score += 2
      if (soup.roles.includes('main-support')) score += 1
      return { soup, score }
    })
    .sort((a, b) => b.score - a.score || a.soup.name.localeCompare(b.soup.name))
    .map((entry) => entry.soup)

  return pickTop(candidates, 1)
}

function getRiskPreventionLines(risks: VocRisk[]) {
  const lines = risks
    .map((risk) => menuVocRiskRuleMap[risk])
    .filter((rule): rule is MenuVocRiskRule => Boolean(rule))
    .flatMap((rule) => [...rule.preventionTips, ...rule.warningSigns])

  return pickTop(dedupeText(lines), 3)
}

function getUpgradeIdeas(menu: MainMenuItem, risks: VocRisk[]) {
  const fromRisk = risks
    .map((risk) => menuVocRiskRuleMap[risk])
    .filter((rule): rule is MenuVocRiskRule => Boolean(rule))
    .flatMap((rule) => rule.preventionTips)

  return pickTop(dedupeText([...menu.upgradeIdeas, ...menu.operationNotes, ...fromRisk]), 3)
}

function buildComposition(menu: MainMenuItem, sideNames: string[], soupNames: string[]) {
  const sideText = sideNames.length > 0 ? sideNames.join(', ') : '기본 반찬 구성'
  const soupText = soupNames.length > 0 ? soupNames[0] : '기본 국물 구성'
  return `${menu.name}, ${sideText}, ${soupText}`
}

function buildAlternatives(mainItems: MainMenuItem[], selectedName: string) {
  return pickTop(mainItems.filter((menu) => menu.name !== selectedName), 2)
    .map((menu) => menu.name)
    .join(', ')
}

function buildReason(menu: MainMenuItem, scenarioSummary: string, risks: VocRisk[]) {
  const lines = [
    ...menu.strengths,
    scenarioSummary,
    ...risks
      .map((risk) => menuVocRiskRuleMap[risk]?.description)
      .filter((value): value is string => typeof value === 'string'),
  ]
  return dedupeText(lines).slice(0, 3).join(' / ')
}

export function recommendMenus(input: MenuLabInput): MenuRecommendationResult {
  const avoidInput = toRiskSet(normalizeAvoidIssues(input.avoidIssues))
  const avoidMemo = detectMemoRisks(input.memo)
  const avoidRisks = Array.from(new Set([...avoidInput, ...avoidMemo]))
  const scenarioRules = getScenarioRules(input, avoidRisks)
  const scenarioSummary = dedupeText(scenarioRules.flatMap((rule) => rule.strategy)).slice(0, 4)

  const ranked = dedupeMenus(menuMainItems)
    .map((menu) => ({ menu, score: scoreMain(menu, input, avoidRisks) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.menu.name.localeCompare(b.menu.name)
    })
    .map((entry) => entry.menu)

  const recommendations = ranked.slice(0, 3).map((menu, index) => {
    const selectedSides = selectSides(menu.category, avoidRisks)
    const selectedSoups = selectSoups(menu.category, avoidRisks)
    const preventionPoints = getRiskPreventionLines(avoidRisks)
    const upgradeIdeas = getUpgradeIdeas(menu, avoidRisks)
    const scenarioText =
      scenarioRules[index % Math.max(1, scenarioRules.length)]?.scenario ??
      '현재 조건에서 안정적인 운영 구성을 우선 제시했습니다.'

    return {
      rank: index + 1,
      menuName: menu.name,
      category: menu.category,
      composition: buildComposition(menu, selectedSides.map((item) => item.name), selectedSoups.map((item) => item.name)),
      reason: buildReason(menu, scenarioSummary.join(' / '), avoidRisks),
      preventionPoints,
      upgradeIdeas,
      alternatives: buildAlternatives(ranked, menu.name),
      scenario: scenarioText,
    }
  })

  return {
    scenarioSummary,
    recommendations,
  }
}

