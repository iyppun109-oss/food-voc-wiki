/**
 * 메뉴 추천 데이터·결과 점검
 * 실행: npm run menu:check
 */
import { menuMainItems, type CustomerType, type MealType, type MenuDirection, type VocRisk } from '../src/data/menuMainItems'
import { menuSideItems } from '../src/data/menuSideItems'
import { menuSoupItems } from '../src/data/menuSoupItems'
import { recommendMenus, type BudgetOption } from '../src/utils/menuRecommender'

const failures: string[] = []
const fail = (message: string) => failures.push(message)

// ── 1. 데이터 ──
const sideNames = new Set(menuSideItems.map((side) => side.name))
const soupNames = new Set(menuSoupItems.map((soup) => soup.name))
if (sideNames.size !== menuSideItems.length) fail('반찬 이름 중복')
if (new Set(menuMainItems.map((menu) => menu.name)).size !== menuMainItems.length) fail('메인 이름 중복')
/** 손님이 직접 간을 맞추는 국물 메뉴(소금·후추를 따로 냄) */
const seasonAtTable = new Set(['설렁탕', '삼계탕'])
for (const menu of menuMainItems) {
  for (const name of [...menu.bestSides, ...menu.avoidSides]) if (!sideNames.has(name)) fail(`${menu.name}: 반찬 목록에 없는 '${name}'`)
  for (const name of menu.bestSoups) if (!soupNames.has(name)) fail(`${menu.name}: 국 목록에 없는 '${name}'`)
  if (menu.hasSoup && menu.bestSoups.length > 0) fail(`${menu.name}: 국물 메뉴인데 따로 붙일 국이 있음`)
  if (!menu.hasSoup && menu.bestSoups.length === 0) fail(`${menu.name}: 붙일 국 후보가 없음`)
  // 면·국물 메뉴는 국물·소스 나트륨이 많아 염도에 약한 메뉴로 표시해야 합니다.
  if ((menu.form === '면' || menu.form === '국물' || /짜장|짬뽕/.test(menu.name)) && !seasonAtTable.has(menu.name) && !menu.risks.includes('염도')) {
    fail(`${menu.name}: 면·국물 메뉴인데 '염도' 표시가 없음`)
  }
}

// ── 2. 추천 결과 ──
const meals: MealType[] = ['조식', '중식', '석식', '야식']
const budgets: BudgetOption[] = ['8,000원', '11,000원']
const customers: CustomerType[] = ['사무직', '생산직', '야근자', '일반']
const directions: MenuDirection[] = ['든든한 메뉴', '트렌디 메뉴', '건강식', '프리미엄', '가성비']
const risks: Array<VocRisk | '없음'> = ['없음', '품절', '염도', '느끼함', '보온 지연', '위생']
const seen = new Set<string>()
let runs = 0
for (const month of [1, 7]) for (const mealType of meals) for (const budget of budgets) for (const customerType of customers) for (const direction of directions) for (const risk of risks) {
  const result = recommendMenus({ mealType, budget, customBudget: '', customerType, direction, avoidIssues: [risk], memo: '', month })
  runs += 1
  const label = `${month}월 ${mealType}/${budget}/${customerType}/${direction}/${risk}`
  if (result.recommendations.length !== 3) fail(`${label}: 추천이 3안이 아님`)
  const items = result.recommendations.map((rec) => menuMainItems.find((menu) => menu.name === rec.menuName)!)
  items.forEach((menu, index) => {
    seen.add(menu.name)
    const rec = result.recommendations[index]
    if (!menu.mealFit.includes(mealType)) fail(`${label}: ${menu.name}은 ${mealType} 메뉴가 아님`)
    if (menu.months && !menu.months.includes(month)) fail(`${label}: 제철이 아닌 ${menu.name}`)
    if (menu.hasSoup !== rec.composition.soup.startsWith('따로 없음')) fail(`${label}: ${menu.name} 국 구성 오류`)
    if (rec.composition.sides.length !== 3 || new Set(rec.composition.sides).size !== 3) fail(`${label}: ${menu.name} 반찬 3개가 아님`)
    if (risk !== '없음' && menuSoupItems.find((soup) => soup.name === rec.composition.soup)?.risks.includes(risk)) {
      fail(`${label}: 피하려는 '${risk}'에 약한 국(${rec.composition.soup})`)
    }
    if (risk !== '없음' && menu.risks.includes(risk) && rec.reason.includes(`${risk} 우려가 적은`)) fail(`${label}: ${menu.name} 이유 문구가 약점과 반대`)
  })
  if (new Set(items.map((menu) => menu.form)).size === 1) fail(`${label}: 3안이 모두 같은 차림 형태`)
}
const unseen = menuMainItems.filter((menu) => !seen.has(menu.name)).map((menu) => menu.name)
if (unseen.length > 3) fail(`추천되지 않는 메뉴가 많음: ${unseen.join(', ')}`)

// ── 3. 메모 판정 ──
const memoCases: Array<[string, string | null]> = [
  ['국이 짰어요', '염도'],
  ['줄이 길어요', '대기시간'],
  ['밥에서 돌이 나왔어요', '이물 혼입'],
  ['직원이 불친절했어요', '직원 응대'],
  ['돌솥비빔밥 인기', null],
  ['줄을 줄이고 싶어요', null],
  ['직원분들이 친절하다는 칭찬', null],
  ['짜장면이 맛있었어요', null],
]
for (const [memo, expected] of memoCases) {
  const notes = recommendMenus({ mealType: '중식', budget: '9,000원', customBudget: '', customerType: '일반', direction: '든든한 메뉴', avoidIssues: ['없음'], memo, month: 11 }).notes
  const note = notes.find((line) => line.startsWith('추가 메모에서')) ?? ''
  if (expected && !note.includes(expected)) fail(`메모 "${memo}": '${expected}'로 판정되지 않음`)
  if (!expected && note) fail(`메모 "${memo}": 잘못 판정됨(${note})`)
}

if (failures.length > 0) {
  console.error(failures.slice(0, 30).map((line) => `✗ ${line}`).join('\n'))
  if (failures.length > 30) console.error(`… 외 ${failures.length - 30}건`)
  process.exit(1)
}
console.log(`메인 ${menuMainItems.length}개 · 추천 ${runs}조합 · 메모 ${memoCases.length}개 점검\n모두 통과`)
