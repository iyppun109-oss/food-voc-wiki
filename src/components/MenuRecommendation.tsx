import { useMemo, useState, type FormEvent } from 'react'

type MealType = '조식' | '중식' | '석식' | '야식'
type PriceOption = '8,000원' | '9,000원' | '11,000원' | '직접 입력'
type CustomerType = '사무직' | '생산직' | '야근자' | '협력사' | '일반'
type MenuDirection = '든든한 메뉴' | '트렌디 메뉴' | '건강식' | '프리미엄' | '가성비'
type AvoidIssue = '염도' | '품절' | '양 부족' | '느끼함' | '대기시간' | '없음'

interface MenuRecommendationInput {
  mealType: MealType
  priceOption: PriceOption
  customPrice: string
  customerType: CustomerType
  direction: MenuDirection
  avoidIssues: AvoidIssue[]
}

interface MenuTemplate {
  menuName: string
  composition: string
  description: string
  reasons: string
  upgrade: string
  alternative: string
  avoidHints: string[]
  direction: MenuDirection
  mealTypeWeight?: MealType[]
  customerWeight?: CustomerType[]
  priceTier: 'economy' | 'standard' | 'premium'
}

const mealOptions: MealType[] = ['조식', '중식', '석식', '야식']

const priceOptions: PriceOption[] = ['8,000원', '9,000원', '11,000원', '직접 입력']

const customerTypes: CustomerType[] = ['사무직', '생산직', '야근자', '협력사', '일반']

const directionOptions: MenuDirection[] = ['든든한 메뉴', '트렌디 메뉴', '건강식', '프리미엄', '가성비']

const avoidOptions: AvoidIssue[] = ['염도', '품절', '양 부족', '느끼함', '대기시간', '없음']

const issueToGuide: Record<AvoidIssue, string> = {
  염도: '양념·국물의 간을 단계적으로 줄이고 소금/간장류 비중을 낮춰 출고 전 맛 점검을 강화합니다.',
  품절: '재료별 대체 가능성을 미리 정하고, 수급 이슈 대응용 대체 메뉴 라인을 준비합니다.',
  '양 부족': '중량 기준을 명확히 하고 추가 배식 가능 수량을 사전 배정합니다.',
  느끼함: '기름 사용을 최소화하고 튀김·가공육은 줄여 구수한 국물/채소 비중을 높입니다.',
  대기시간: '전 메뉴는 1차 반조리 기준으로 작업량을 나누고 출고 타이밍을 고정합니다.',
  없음: '고객 피드백 기준으로 VOC 발생 이슈를 사전 점검해 반복 발생을 방지합니다.',
}

const menuTemplates: MenuTemplate[] = [
  {
    direction: '든든한 메뉴',
    menuName: '매콤제육 철판정식',
    composition: '매콤제육, 계란찜, 콩나물국, 상추겉절이, 김치',
    description: '단백질과 탄수·채소 조합이 안정적이고 대량 조리 효율이 좋아 생산직 운영에 적합합니다.',
    reasons: '기본 식단 대비 포만감이 높고 제조 공정이 단순해 단가 관리가 쉽습니다.',
    upgrade: '계란후라이 또는 미니음료를 추가해 만족감을 보완할 수 있습니다.',
    alternative: '소고기 불고기 덮밥, 간장닭볶음 정식',
    avoidHints: ['고기량 기준을 명확히 하고 추가 배식 가능 수량을 안내', '메뉴 구성량 고정을 사전 점검'],
    mealTypeWeight: ['중식', '석식'],
    customerWeight: ['생산직', '야근자', '협력사'],
    priceTier: 'standard',
  },
  {
    direction: '든든한 메뉴',
    menuName: '매운 닭다리살 정식',
    composition: '닭다리살 조림, 콩나물국, 무생채, 깍두기, 밥',
    description: '단백질 비중이 높아 체력 회복이 필요한 시간대 운영에 적합합니다.',
    reasons: '재료 공정이 반복적이라 대량 제조와 맛 균일도 관리가 용이합니다.',
    upgrade: '부재료로 단백질 토핑 1종을 추가해 만족감을 높일 수 있습니다.',
    alternative: '수제닭갈비 정식, 매콤감자탕 덮밥',
    avoidHints: ['추가 배식 안내 문구를 사전 고지', '조리 완료 후 중량 확인 절차 강화'],
    mealTypeWeight: ['중식', '석식', '야식'],
    customerWeight: ['생산직', '일반'],
    priceTier: 'standard',
  },
  {
    direction: '트렌디 메뉴',
    menuName: '로제소시지볼 크림파스타',
    composition: '로제소시지볼, 베이컨 토핑, 샐러드, 오븐구이 빵',
    description: '젊은 층 선호 메뉴로 구성해 호응도를 높일 수 있습니다.',
    reasons: '조리 동선이 단순하고 메뉴 노출력이 높아 선호도 반응이 빠릅니다.',
    upgrade: '올리브유 토핑이나 미니샐러드로 계절 메뉴감각을 추가합니다.',
    alternative: '크림카레 볶음밥, 매운치킨텐더 정식',
    avoidHints: ['간 편차를 줄이기 위해 소스 분할 제공', '출고 직전 시식 포인트 체크'],
    mealTypeWeight: ['중식', '야식'],
    customerWeight: ['사무직', '일반'],
    priceTier: 'premium',
  },
  {
    direction: '건강식',
    menuName: '두부채소 비빔정식',
    composition: '두부채소 반찬, 현미밥, 맑은 채소국, 오이무침, 나물',
    description: '국민식 기반의 담백한 구성이 반복 VOC를 줄이는 데 유리합니다.',
    reasons: '기름 사용량이 적고 자극적 요소가 낮아 전 연령대가 무난하게 이용하기 좋습니다.',
    upgrade: '저지방 단백질 토핑을 추가해 포만감을 보완합니다.',
    alternative: '연어 샐러드볼, 닭가슴살 곤약볶음',
    avoidHints: ['개별 소스 제공으로 입맛 조절 가능', '채소 상태 및 생채 소분량 체크'],
    mealTypeWeight: ['조식', '중식'],
    customerWeight: ['사무직', '일반', '협력사'],
    priceTier: 'economy',
  },
  {
    direction: '프리미엄',
    menuName: '한우채끝 스테이크 정식',
    composition: '한우채끝 안심, 채소구이, 버터감자, 미역국, 계절 과일',
    description: '차별화된 구성으로 고객 만족 지수가 높고 상향 피드백이 기대됩니다.',
    reasons: '식사 만족도 개선이 필요한 구간에서 신뢰도 높은 이미지 제고에 적합합니다.',
    upgrade: '디저트 또는 미니음료를 한 줄로 묶어 서비스감 강화가 가능합니다.',
    alternative: '연어테린 정식, 특제 불고기 모듬정식',
    avoidHints: ['출고 전 중량 및 조리 온도 확인 2중 체크', '서비스 제공 순서 기준을 고정'],
    mealTypeWeight: ['석식', '야식'],
    customerWeight: ['사무직', '일반'],
    priceTier: 'premium',
  },
  {
    direction: '가성비',
    menuName: '제육덮밥 도시락식',
    composition: '제육볶음, 브로콜리, 계란후라이, 배추겉절이, 공기밥',
    description: '재료 대비 단가 효율이 좋고 구성 조정이 쉬워 운영 리스크를 낮출 수 있습니다.',
    reasons: '단가 통제와 조리 표준화가 쉬워 자주 바뀌는 인원 변동에도 대응이 빠릅니다.',
    upgrade: '반찬 1종 추가 또는 미니 후식으로 체감가치를 보완합니다.',
    alternative: '야채김치찌개+반찬세트, 닭날개조림 정식',
    avoidHints: ['품목 대체 후보를 사전 점검', '추가 반찬 규격/제공 시점 정형화'],
    mealTypeWeight: ['중식', '야식'],
    customerWeight: ['일반', '협력사', '생산직'],
    priceTier: 'economy',
  },
]

function toPriceValue(priceOption: PriceOption, customPrice: string) {
  if (priceOption !== '직접 입력') {
    return Number(priceOption.replace(/,/g, '').replace('원', ''))
  }

  const normalized = Number(customPrice.replace(/[^0-9]/g, ''))
  return Number.isNaN(normalized) ? 0 : normalized
}

function detectPriceTier(price: number) {
  if (price > 10000) return 'premium'
  if (price > 8500) return 'standard'
  return 'economy'
}

function hashText(value: string) {
  return value
    .split('')
    .reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 2147483647, 7)
}

function buildAvoidText(issues: AvoidIssue[]) {
  const normalized: AvoidIssue[] =
    issues.includes('없음') || issues.length === 0 ? ['없음'] : issues

  const hints = normalized.map((issue) => issueToGuide[issue])
  return Array.from(new Set(hints)).filter((line): line is string => Boolean(line))
}

export function MenuRecommendationSection() {
  const [formState, setFormState] = useState<MenuRecommendationInput>({
    mealType: '중식',
    priceOption: '9,000원',
    customPrice: '',
    customerType: '일반',
    direction: '든든한 메뉴',
    avoidIssues: ['없음'],
  })

  const [recommendation, setRecommendation] = useState<MenuTemplate | null>(null)
  const [recommendationSummary, setRecommendationSummary] = useState('')

  const priceValue = useMemo(
    () => toPriceValue(formState.priceOption, formState.customPrice),
    [formState.priceOption, formState.customPrice],
  )

  const avoidList = useMemo(
    () => {
      if (formState.avoidIssues.includes('없음') && formState.avoidIssues.length > 1) {
        return formState.avoidIssues.filter((issue) => issue !== '없음')
      }
      return formState.avoidIssues.includes('없음') ? [] : formState.avoidIssues
    },
    [formState.avoidIssues],
  )

  const avoidSummary = useMemo(() => buildAvoidText(avoidList), [avoidList])

  const scoreMenu = (menu: MenuTemplate, avoidIssues: AvoidIssue[], input: MenuRecommendationInput) => {
    let score = 0
    if (menu.direction === input.direction) score += 5
    if (!menu.priceTier || menu.priceTier === detectPriceTier(priceValue)) score += 2
    if (menu.mealTypeWeight?.includes(input.mealType)) score += 1
    if (menu.customerWeight?.includes(input.customerType)) score += 1
    if (!avoidIssues.includes('없음')) {
      if (avoidIssues.includes('양 부족') && menu.avoidHints.some((text) => text.includes('중량') || text.includes('추가 배식'))) score += 2
      if (avoidIssues.includes('염도') && menu.avoidHints.some((text) => text.includes('간을'))) score += 1
      if (avoidIssues.includes('대기시간') && menu.avoidHints.some((text) => text.includes('조리') || text.includes('출고'))) score += 1
      if (avoidIssues.includes('느끼함') && menu.avoidHints.some((text) => text.includes('기름'))) score += 1
      if (avoidIssues.includes('품절') && menu.avoidHints.some((text) => text.includes('대체'))) score += 1
    }
    return score
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const avoidIssues: AvoidIssue[] = avoidList.length === 0 ? ['없음'] : avoidList
    const selectedTier = detectPriceTier(priceValue)

    const candidates = menuTemplates.filter((menu) => menu.direction === formState.direction)

    const candidatesByTier = candidates.filter((menu) => menu.priceTier === selectedTier)
    const baseCandidates = candidatesByTier.length > 0 ? candidatesByTier : candidates

    const sorted = baseCandidates
      .map((menu) => ({
        menu,
        score: scoreMenu(menu, avoidIssues, formState),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.menu.menuName.localeCompare(b.menu.menuName)
      })

    const seed = hashText(
      `${formState.mealType}|${formState.priceOption}|${formState.customPrice}|${formState.customerType}|${formState.direction}|${avoidIssues.join(',')}`,
    )
    const selected = sorted[seed % sorted.length]?.menu ?? sorted[0]?.menu ?? menuTemplates[0]

    const nextSummary = `${formState.mealType} / ${priceValue.toLocaleString()}원 / ${formState.customerType} / ${formState.direction}`

    setRecommendation(selected)
    setRecommendationSummary(nextSummary)
  }

  const handleAvoidToggle = (issue: AvoidIssue) => {
    setFormState((prev) => {
      if (issue === '없음') {
        return {
          ...prev,
          avoidIssues: prev.avoidIssues.includes('없음') ? [] : ['없음'],
        }
      }

      const next = prev.avoidIssues.includes(issue)
        ? prev.avoidIssues.filter((item) => item !== issue)
        : [...prev.avoidIssues.filter((item) => item !== '없음'), issue]

      return {
        ...prev,
        avoidIssues: next,
      }
    })
  }

  return (
    <section className="recommend">
      <h2 className="recommend__title">메뉴 추천</h2>
      <p className="recommend__subtitle">상황, 단가, 고객 VOC 이슈를 반영해 메뉴 구성을 제안합니다.</p>

      <form className="recommend-form" onSubmit={handleSubmit}>
        <label className="recommend-form__field">
          <span>식사 구분</span>
          <select
            value={formState.mealType}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, mealType: event.target.value as MealType }))
            }
          >
            {mealOptions.map((meal) => (
              <option key={meal} value={meal}>
                {meal}
              </option>
            ))}
          </select>
        </label>

        <label className="recommend-form__field">
          <span>단가</span>
          <select
            value={formState.priceOption}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, priceOption: event.target.value as PriceOption }))
            }
          >
            {priceOptions.map((price) => (
              <option key={price} value={price}>
                {price}
              </option>
            ))}
          </select>
        </label>

        {formState.priceOption === '직접 입력' && (
          <label className="recommend-form__field">
            <span>직접 입력 단가</span>
            <input
              type="number"
              min={5000}
              max={25000}
              step={500}
              value={formState.customPrice}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, customPrice: event.target.value }))
              }
              placeholder="예: 10000"
            />
          </label>
        )}

        <label className="recommend-form__field">
          <span>고객층</span>
          <select
            value={formState.customerType}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, customerType: event.target.value as CustomerType }))
            }
          >
            {customerTypes.map((customerType) => (
              <option key={customerType} value={customerType}>
                {customerType}
              </option>
            ))}
          </select>
        </label>

        <label className="recommend-form__field">
          <span>원하는 방향</span>
          <select
            value={formState.direction}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, direction: event.target.value as MenuDirection }))
            }
          >
            {directionOptions.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
        </label>

        <div className="recommend-form__field">
          <span>피하고 싶은 VOC</span>
          <div className="recommend-form__options">
            {avoidOptions.map((issue) => (
              <label className="recommend-form__option" key={issue}>
                <input
                  type="checkbox"
                  checked={formState.avoidIssues.includes(issue)}
                  onChange={() => handleAvoidToggle(issue)}
                />
                {issue}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="report-generate-button">
          메뉴 추천하기
        </button>
      </form>

      {recommendation && (
        <section className="recommend-result">
          <h3 className="recommend-result__title">추천 결과</h3>
          <p className="recommend-result__summary">입력 기준: {recommendationSummary}</p>
          <article className="recommend-result__card">
            <p>
              <strong>추천 메뉴명:</strong> {recommendation.menuName}
            </p>
            <p>
              <strong>구성 예시:</strong> {recommendation.composition}
            </p>
            <p>
              <strong>추천 이유:</strong> {recommendation.reasons}
            </p>
            <p>
              <strong>VOC 예방 포인트:</strong>{' '}
              {avoidSummary.length > 0 ? avoidSummary.join(' / ') : recommendation.avoidHints.join(' / ')}
            </p>
            <p>
              <strong>업그레이드 아이디어:</strong> {recommendation.upgrade}
            </p>
            <p>
              <strong>대체 메뉴:</strong> {recommendation.alternative}
            </p>
          </article>
        </section>
      )}
    </section>
  )
}



