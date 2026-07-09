import { useState } from 'react'
import type { FormEvent } from 'react'
import { type BudgetOption, type AvoidIssue, type MenuLabInput, recommendMenus } from '../utils/menuRecommender'
import { type CustomerType, type MenuDirection, type MealType } from '../data/menuMainItems'

const mealOptions: MealType[] = ['조식', '중식', '석식', '야식']
const budgetOptions: BudgetOption[] = ['8,000원', '9,000원', '11,000원', '직접 입력']
const customerOptions: CustomerType[] = ['사무직', '생산직', '야근자', '협력사', '일반']
const directionOptions: MenuDirection[] = ['든든한 메뉴', '트렌디 메뉴', '건강식', '프리미엄', '가성비', '간편 운영형', '균형형']
const avoidIssueOptions: AvoidIssue[] = [
  '품절',
  '양 부족',
  '염도',
  '느끼함',
  '대기시간',
  '보온 지연',
  '이물 혼입',
  '위생',
  '고객 불편',
  '직원 응대',
  '없음',
]

const initialForm: MenuLabInput = {
  mealType: '중식',
  budget: '9,000원',
  customBudget: '',
  customerType: '일반',
  direction: '든든한 메뉴',
  avoidIssues: ['없음'],
  memo: '',
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
      <h2 className="menu-lab__title">Menu Lab</h2>
      <p className="menu-lab__subtitle">식사 구분, 단가, 고객층, 운영 방향으로 메뉴를 제안합니다.</p>

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
            <span>단가 직접 입력(원)</span>
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

        <div className="menu-lab__field">
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

        <label className="menu-lab__field">
          <span>추가 메모</span>
          <textarea
            value={form.memo}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, memo: event.target.value }))
            }
            rows={3}
            placeholder="발생 이슈(예: 2부에서 염도 이슈, 야간 대기 길어짐) 를 입력하세요."
          />
        </label>

        <button type="submit" className="report-generate-button">
          메뉴 추천
        </button>
      </form>

      {result && (
        <section className="menu-lab-result">
          <h3 className="menu-lab-result__title">추천 결과 (최대 3개)</h3>
          {result.scenarioSummary.length > 0 ? (
            <p className="menu-lab-result__summary">추천 핵심: {result.scenarioSummary.join(' / ')}</p>
          ) : null}

          <div className="menu-lab-result__grid">
            {result.recommendations.map((item) => (
              <article className="menu-lab-result__card" key={`${item.menuName}-${item.rank}`}>
                <h4 className="menu-lab-result__card-title">
                  메뉴 추천 {item.rank}위: {item.menuName}
                </h4>
                <p>
                  <strong>추천 이유:</strong> {item.reason}
                </p>
                <p>
                  <strong>구성 예시:</strong> {item.composition}
                </p>
                <p>
                  <strong>VOC 예방 포인트:</strong> {item.preventionPoints.join(' / ')}
                </p>
                <p>
                  <strong>업그레이드 아이디어:</strong> {item.upgradeIdeas.join(' / ')}
                </p>
                <p>
                  <strong>대체 메뉴:</strong> {item.alternatives}
                </p>
                <p>
                  <strong>상황 제안:</strong> {item.scenario}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

export default MenuLab
