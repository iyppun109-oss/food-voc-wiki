/**
 * 식단표 생성 품질 점검: 목표 달성률, 나트륨 판정 가능 비율, 상한 초과 비율
 * 실행: npm run plan:check
 */
import { buildWeekdayDates, defaultPortions, generateMealPlan, sitePortions, sitePresets, summarizePlan, type MealPlanOptions } from '../src/utils/mealPlanGenerator'

const failures: string[] = []
const fail = (message: string) => failures.push(message)

interface Expect {
  /** 열량·단백질 목표를 모두 채운 날의 최소 비율 */
  onTarget: number
  /** 나트륨을 판정하지 못한 날의 최대 비율 */
  sodiumPartial: number
  /** 나트륨 상한을 넘은 날의 최대 비율 */
  sodiumHigh: number
}

function measureQuiet(extra: Partial<MealPlanOptions>, seeds: number) {
  let days = 0
  let onTarget = 0
  let sodiumPartial = 0
  let sodiumHigh = 0
  let maxSodium = 0
  for (let seed = 1; seed <= seeds; seed++) {
    for (const [startDate, season] of [['2026-11-23', '가을'], ['2026-03-02', '봄'], ['2026-07-06', '여름']] as const) {
      const options = {
        startDate, weeks: 4, mealLabel: '중식', season, oneDishPerWeek: 1, stewPerWeek: 2, avoid: [], preferPopular: true,
        target: { site: '사무직', ...sitePresets.사무직 }, portions: defaultPortions, seed, ...extra,
      } as MealPlanOptions
      const plan = generateMealPlan(options)
      summarizePlan(plan).dayNutrition.forEach((day) => {
        days += 1
        if (day.kcalStatus === 'ok' && day.proteinStatus === 'ok') onTarget += 1
        if (day.sodiumStatus === 'partial') sodiumPartial += 1
        if (day.sodiumStatus === 'high') sodiumHigh += 1
        maxSodium = Math.max(maxSodium, day.sodiumMg)
      })
    }
  }
  return { onTarget: onTarget / days, sodiumPartial: sodiumPartial / days, sodiumHigh: sodiumHigh / days, maxSodium }
}

function measure(label: string, extra: Partial<MealPlanOptions>, expect: Expect) {
  let days = 0
  let onTarget = 0
  let sodiumPartial = 0
  let sodiumHigh = 0
  for (let seed = 1; seed <= 15; seed++) {
    for (const [startDate, season] of [['2026-11-23', '가을'], ['2026-03-02', '봄'], ['2026-07-06', '여름']] as const) {
      const options = {
        startDate, weeks: 4, mealLabel: '중식', season, oneDishPerWeek: 1, stewPerWeek: 2, avoid: [], preferPopular: true,
        target: { site: '사무직', ...sitePresets.사무직 }, portions: defaultPortions, seed, ...extra,
      } as MealPlanOptions
      const plan = generateMealPlan(options)
      const summary = summarizePlan(plan)
      days += plan.days.length
      summary.dayNutrition.forEach((day) => {
        if (day.kcalStatus === 'ok' && day.proteinStatus === 'ok') onTarget += 1
        if (day.sodiumStatus === 'partial') sodiumPartial += 1
        if (day.sodiumStatus === 'high') sodiumHigh += 1
      })
    }
  }
  const ratio = (value: number) => value / days
  const pct = (value: number) => `${Math.round(ratio(value) * 100)}%`
  if (ratio(onTarget) < expect.onTarget) fail(`${label}: 목표 달성 ${pct(onTarget)} (기준 ${expect.onTarget * 100}% 이상)`)
  if (ratio(sodiumPartial) > expect.sodiumPartial) fail(`${label}: 나트륨 판정 불가 ${pct(sodiumPartial)} (기준 ${expect.sodiumPartial * 100}% 이하)`)
  if (ratio(sodiumHigh) > expect.sodiumHigh) fail(`${label}: 나트륨 상한 초과 ${pct(sodiumHigh)} (기준 ${expect.sodiumHigh * 100}% 이하)`)
  return `${label} 목표 ${pct(onTarget)} · 나트륨 판정 불가 ${pct(sodiumPartial)} · 상한 초과 ${pct(sodiumHigh)}`
}

const lines = [
  measure('사무직', {}, { onTarget: 0.85, sodiumPartial: 0.08, sodiumHigh: 0.12 }),
  measure('사무직·염도 줄이기', { avoid: ['염도'] }, { onTarget: 0.85, sodiumPartial: 0.08, sodiumHigh: 0.05 }),
  measure('생산직', { target: { site: '생산직', ...sitePresets.생산직 }, portions: sitePortions.생산직 }, { onTarget: 0.85, sodiumPartial: 0.08, sodiumHigh: 0.12 }),
]

// 화면에서 고를 수 있는 일품·탕찌개 요일 수 조합 전부(사업장 2 × 염도 2 × 일품 3 × 탕 4): 가장 나쁜 조합도 기준 안
let worst = { onTarget: 1, sodiumHigh: 0, sodiumPartial: 0 }
for (const site of ['사무직', '생산직'] as const) {
  for (const avoid of [[], ['염도']] as Array<MealPlanOptions['avoid']>) {
    for (const oneDishPerWeek of [0, 1, 2] as const) {
      for (const stewPerWeek of [0, 1, 2, 3] as const) {
        const label = `${site}${avoid.length ? '·염도' : ''} 일품${oneDishPerWeek} 탕${stewPerWeek}`
        const extra = { target: { site, ...sitePresets[site] }, portions: sitePortions[site], avoid, oneDishPerWeek, stewPerWeek }
        const result = measureQuiet(extra, 4)
        worst = {
          onTarget: Math.min(worst.onTarget, result.onTarget),
          sodiumHigh: Math.max(worst.sodiumHigh, result.sodiumHigh),
          sodiumPartial: Math.max(worst.sodiumPartial, result.sodiumPartial),
        }
        if (result.onTarget < 0.78) fail(`${label}: 목표 달성 ${Math.round(result.onTarget * 100)}% (기준 78% 이상)`)
        if (result.sodiumHigh > 0.12) fail(`${label}: 나트륨 상한 초과 ${Math.round(result.sodiumHigh * 100)}% (기준 12% 이하)`)
        if (result.sodiumPartial > 0.12) fail(`${label}: 나트륨 판정 불가 ${Math.round(result.sodiumPartial * 100)}% (기준 12% 이하)`)
        if (result.maxSodium > 2600) fail(`${label}: 한 끼 나트륨 최대 ${result.maxSodium}mg`)
      }
    }
  }
}
lines.push(`전 조합 48개 중 최저 목표 ${Math.round(worst.onTarget * 100)}% · 최고 상한 초과 ${Math.round(worst.sodiumHigh * 100)}% · 최고 판정 불가 ${Math.round(worst.sodiumPartial * 100)}%`)

// 시작일이 비었거나 주말이면 평일부터
if (buildWeekdayDates('', 1).some((date) => date.getFullYear() < 2000)) fail('빈 시작일이 1900년대로 계산됨')
if (buildWeekdayDates('2026-11-22', 1)[0].getDay() !== 1) fail('일요일 시작이 월요일로 넘어가지 않음')

if (failures.length > 0) {
  console.error(failures.map((line) => `✗ ${line}`).join('\n'))
  process.exit(1)
}
console.log(`${lines.join('\n')}\n모두 통과`)
