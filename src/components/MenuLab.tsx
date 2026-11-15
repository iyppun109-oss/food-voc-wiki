import { useState } from 'react'
import type { FormEvent } from 'react'
import { type BudgetOption, type MenuLabInput, type MenuRecommendationItem, recommendMenus } from '../utils/menuRecommender'
import { type CustomerType, type MenuDirection, type MealType, type VocRisk } from '../data/menuMainItems'

type AvoidIssue = VocRisk | '없음'

const mealOptions: MealType[] = ['조식', '중식', '석식', '야식']
const budgetOptions: BudgetOption[] = ['8,000원', '9,000원', '11,000원', '직접 입력']
const customerOptions: CustomerType[] = ['사무직', '생산직', '야근자', '협력사', '일반']
const directionOptions: MenuDirection[] = ['든든한 메뉴', '트렌디 메뉴', '건강식', '프리미엄', '가성비']
const avoidIssueOptions: AvoidIssue[] = ['품절', '양 부족', '염도', '느끼함', '대기시간', '보온 지연', '이물 혼입', '위생', '고객 불편', '직원 응대', '없음']

const initialForm: MenuLabInput = {
  mealType: '중식',
  budget: '9,000원',
  customBudget: '',
  customerType: '일반',
  direction: '든든한 메뉴',
  avoidIssues: ['없음'],
  memo: '',
}

function listSection(title: string, lines: string[], maxLines = 3) {
  if (lines.length === 0) return null
  return (
    <section className="menu-lab-result__section">
      <h4>{title}</h4>
      <ul className="menu-lab-result__list">
        {lines.slice(0, maxLines).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  )
}

function formatResultCard(item: MenuRecommendationItem) {
  return (
    <article className="menu-lab-result__card" key={`${item.menuName}-${item.rank}`}>
      <header className="menu-lab-result__card-head">
        <span className="menu-lab-result__rank">{item.rank}안</span>
        <h3 className="menu-lab-result__card-title">{item.menuName}</h3>
      </header>

      <dl className="menu-lab-result__composition">
        <div>
          <dt>메인</dt>
          <dd>{item.composition.main}</dd>
        </div>
        <div>
          <dt>국</dt>
          <dd>{item.composition.soup}</dd>
        </div>
        <div>
          <dt>찬</dt>
          <dd>{item.composition.sides.join(', ')}</dd>
        </div>
      </dl>

      <p className="menu-lab-result__reason">{item.reason}</p>

      <div className="menu-lab-result__sections">
        {listSection('VOC 예방 포인트', item.preventionPoints, 4)}
        {listSection('운영 주의사항', item.operationNotes, 3)}
        {listSection('업그레이드 아이디어', item.upgradeIdeas, 3)}
        {listSection('대체 메뉴', item.alternatives, 2)}
      </div>

      <p className="menu-lab-result__scenario">{item.scenario}</p>
    </article>
  )
}

export function MenuLab() {
  const [form, setForm] = useState<MenuLabInput>(initialForm)
  const [result, setResult] = useState<ReturnType<typeof recommendMenus> | null>(null)

  const handleAvoidToggle = (issue: AvoidIssue) => {
    setForm((prev) => {
      if (issue === '없음') {
        return { ...prev, avoidIssues: ['없음'] }
      }

      const next = prev.avoidIssues.includes(issue)
        ? prev.avoidIssues.filter((item) => item !== issue)
        : [...prev.avoidIssues.filter((item) => item !== '없음'), issue]

      return {
        ...prev,
        avoidIssues: next.length === 0 ? ['없음'] : next,
      }
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setResult(recommendMenus(form))
  }

  return (
    <section className="menu-lab">
      <h1 className="menu-lab__title">메뉴 추천</h1>
      <p className="menu-lab__subtitle">식사 상황과 고객 VOC 이슈를 반영해 메뉴를 추천합니다. 식단가는 참고 조건이며, 실제 식재료 원가는 계산하지 않습니다.</p>

      <form className="menu-lab__form" onSubmit={handleSubmit}>
        <label className="menu-lab__field">
          <span>식사 구분</span>
          <select
            value={form.mealType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, mealType: event.target.value as MealType }))
            }
          >
            {mealOptions.map((meal) => (
              <option key={meal} value={meal}>
                {meal}
              </option>
            ))}
          </select>
        </label>

        <label className="menu-lab__field">
          <span>단가</span>
          <select
            value={form.budget}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, budget: event.target.value as BudgetOption }))
            }
          >
            {budgetOptions.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </label>

        {form.budget === '직접 입력' ? (
          <label className="menu-lab__field">
            <span>직접 입력 단가</span>
            <input
              type="number"
              min={7000}
              max={30000}
              step={100}
              value={form.customBudget}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customBudget: event.target.value }))
              }
              placeholder="예: 10000"
            />
          </label>
        ) : null}

        <label className="menu-lab__field">
          <span>고객층</span>
          <select
            value={form.customerType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerType: event.target.value as CustomerType }))
            }
          >
            {customerOptions.map((customerType) => (
              <option key={customerType} value={customerType}>
                {customerType}
              </option>
            ))}
          </select>
        </label>

        <label className="menu-lab__field">
          <span>원하는 방향</span>
          <select
            value={form.direction}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, direction: event.target.value as MenuDirection }))
            }
          >
            {directionOptions.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
        </label>

        <div className="menu-lab__field menu-lab__field--wide">
          <span>피하고 싶은 VOC</span>
          <div className="menu-lab__checkboxes">
            {avoidIssueOptions.map((issue) => (
              <label
                className={`menu-lab__checkbox ${form.avoidIssues.includes(issue) ? 'menu-lab__checkbox--active' : ''}`}
                key={issue}
              >
                <input
                  type="checkbox"
                  checked={form.avoidIssues.includes(issue)}
                  onChange={() => handleAvoidToggle(issue)}
                />
                <span aria-hidden="true" className="menu-lab__checkbox-mark">
                  {form.avoidIssues.includes(issue) ? '✓' : ''}
                </span>
                <span className="menu-lab__checkbox-text">{issue}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="menu-lab__field menu-lab__field--wide">
          <span>추가 메모</span>
          <textarea
            value={form.memo}
            onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
            rows={3}
            placeholder="예: 염도가 높았고 국물 간을 더 가볍게 맞춰주세요."
          />
        </label>

        <div className="menu-lab__submit">
          <button type="submit" className="meal-plan__primary">
            메뉴 추천하기
          </button>
        </div>
      </form>

      {result && (
        <section className="menu-lab-result">
          <h2 className="menu-lab-result__title">추천 결과</h2>
          <div className="menu-lab-result__chips">
            {result.scenarioSummary.slice(0, 4).map((text) => (
              <span className="menu-lab-result__chip" key={text}>
                {text}
              </span>
            ))}
          </div>
          <div className="menu-lab-result__grid">{result.recommendations.map((item) => formatResultCard(item))}</div>
        </section>
      )}
    </section>
  )
}

export default MenuLab
