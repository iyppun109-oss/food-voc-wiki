import { useMemo, useState, type FormEvent } from 'react'
import {
  avoidFactorOptions,
  generateMealPlan,
  nextMonday,
  planRowLabels,
  planRows,
  planToTsv,
  replaceCell,
  summarizePlan,
  type AvoidFactor,
  type MealPlan,
  type MealPlanOptions,
  type PlanDay,
  type PlanRow,
  type Season,
} from '../utils/mealPlanGenerator'

function currentSeason(date = new Date()): Season {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return '봄'
  if (month >= 6 && month <= 8) return '여름'
  if (month >= 9 && month <= 11) return '가을'
  return '겨울'
}

const initialOptions: MealPlanOptions = {
  startDate: nextMonday(),
  weeks: 1,
  mealLabel: '중식',
  season: currentSeason(),
  oneDishPerWeek: 1,
  stewPerWeek: 2,
  avoid: [],
  preferPopular: true,
  seed: 1,
}

const typeClass: Record<PlanDay['type'], string> = {
  정식: 'meal-plan__type--standard',
  '탕·찌개': 'meal-plan__type--stew',
  일품: 'meal-plan__type--onedish',
}

function formatShortDate(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

interface CellProps {
  day: PlanDay
  row: PlanRow
  onReplace: () => void
}

function PlanCell({ day, row, onReplace }: CellProps) {
  const item = day.cells[row]
  if (!item) {
    return <span className="meal-plan__empty">-</span>
  }
  return (
    <span className="meal-plan__cell">
      <span className="meal-plan__name">
        {item.name}
        {!item.preferred && (
          <span className="meal-plan__badge meal-plan__badge--extra" title="만족도 평가 자료가 없는 보충 메뉴">
            보충
          </span>
        )}
      </span>
      <button
        type="button"
        className="meal-plan__swap"
        onClick={onReplace}
        aria-label={`${day.date} ${planRowLabels[row]} ${item.name}을(를) 다른 메뉴로 바꾸기`}
        title="다른 메뉴로 바꾸기"
      >
        ↻
      </button>
    </span>
  )
}

export function MealPlanner() {
  const [options, setOptions] = useState<MealPlanOptions>(initialOptions)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [rejected, setRejected] = useState<Record<string, string[]>>({})
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')

  const summary = useMemo(() => (plan ? summarizePlan(plan) : null), [plan])

  const weeks = useMemo(() => {
    if (!plan) return []
    const result: Array<{ days: PlanDay[]; offset: number }> = []
    for (let i = 0; i < plan.days.length; i += 5) {
      result.push({ days: plan.days.slice(i, i + 5), offset: i })
    }
    return result
  }, [plan])

  const runGenerate = (next: MealPlanOptions) => {
    setOptions(next)
    setPlan(generateMealPlan(next))
    setRejected({})
    setCopyState('idle')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    runGenerate({ ...options, seed: 1 })
  }

  const handleRegenerate = () => runGenerate({ ...options, seed: options.seed + 1 })

  const handleReplace = (dayIndex: number, row: PlanRow) => {
    if (!plan) return
    const key = `${dayIndex}-${row}`
    const current = plan.days[dayIndex].cells[row]
    const excluded = [...(rejected[key] ?? []), ...(current ? [current.id] : [])]
    setPlan(replaceCell(plan, dayIndex, row, excluded))
    setRejected((prev) => ({ ...prev, [key]: excluded }))
    setCopyState('idle')
  }

  const handleCopy = async () => {
    if (!plan) return
    try {
      await navigator.clipboard.writeText(planToTsv(plan))
      setCopyState('done')
    } catch {
      setCopyState('error')
    }
  }

  const toggleAvoid = (factor: AvoidFactor) => {
    setOptions((prev) => ({
      ...prev,
      avoid: prev.avoid.includes(factor) ? prev.avoid.filter((item) => item !== factor) : [...prev.avoid, factor],
    }))
  }

  return (
    <section className="menu-lab meal-plan">
      <h2 className="menu-lab__title">식단표 자동 생성</h2>
      <p className="menu-lab__subtitle">
        만족도 높은 단체급식 메뉴를 중심으로 평일 식단표를 만듭니다. 영양가와 식재료 원가는 계산하지 않으니, 최종 식단은
        영양사가 확인해 주세요.
      </p>

      <form className="menu-lab__form meal-plan__form" onSubmit={handleSubmit}>
        <label className="menu-lab__field">
          <span>시작일</span>
          <input
            type="date"
            value={options.startDate}
            onChange={(event) => setOptions((prev) => ({ ...prev, startDate: event.target.value }))}
            required
          />
        </label>

        <label className="menu-lab__field">
          <span>기간</span>
          <select
            value={options.weeks}
            onChange={(event) => setOptions((prev) => ({ ...prev, weeks: Number(event.target.value) as MealPlanOptions['weeks'] }))}
          >
            <option value={1}>1주 (5일)</option>
            <option value={2}>2주 (10일)</option>
            <option value={4}>4주 (20일)</option>
          </select>
        </label>

        <label className="menu-lab__field">
          <span>끼니</span>
          <select
            value={options.mealLabel}
            onChange={(event) =>
              setOptions((prev) => ({ ...prev, mealLabel: event.target.value as MealPlanOptions['mealLabel'] }))
            }
          >
            <option value="중식">중식</option>
            <option value="석식">석식</option>
          </select>
        </label>

        <label className="menu-lab__field">
          <span>계절</span>
          <select
            value={options.season}
            onChange={(event) => setOptions((prev) => ({ ...prev, season: event.target.value as Season }))}
          >
            {(['봄', '여름', '가을', '겨울'] as Season[]).map((season) => (
              <option key={season} value={season}>
                {season}
                {season === '여름' ? ' (냉면류 포함)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="menu-lab__field">
          <span>주당 일품 요일</span>
          <select
            value={options.oneDishPerWeek}
            onChange={(event) =>
              setOptions((prev) => ({
                ...prev,
                oneDishPerWeek: Number(event.target.value) as MealPlanOptions['oneDishPerWeek'],
              }))
            }
          >
            <option value={0}>없음</option>
            <option value={1}>1일 (수)</option>
            <option value={2}>2일 (수·금)</option>
          </select>
        </label>

        <label className="menu-lab__field">
          <span>주당 탕·찌개 요일</span>
          <select
            value={options.stewPerWeek}
            onChange={(event) =>
              setOptions((prev) => ({ ...prev, stewPerWeek: Number(event.target.value) as MealPlanOptions['stewPerWeek'] }))
            }
          >
            <option value={0}>없음</option>
            <option value={1}>1일</option>
            <option value={2}>2일</option>
            <option value={3}>3일</option>
          </select>
        </label>

        <div className="menu-lab__field meal-plan__wide">
          <span id="meal-plan-avoid-label">피하고 싶은 VOC 요소</span>
          <div className="menu-lab__checkboxes" role="group" aria-labelledby="meal-plan-avoid-label">
            {avoidFactorOptions.map((factor) => {
              const active = options.avoid.includes(factor)
              return (
                <label key={factor} className={`menu-lab__checkbox ${active ? 'menu-lab__checkbox--active' : ''}`}>
                  <input type="checkbox" checked={active} onChange={() => toggleAvoid(factor)} />
                  <span aria-hidden="true" className="menu-lab__checkbox-mark">
                    {active ? '✓' : ''}
                  </span>
                  <span className="menu-lab__checkbox-text">{factor}</span>
                </label>
              )
            })}
          </div>
        </div>

        <label className={`menu-lab__checkbox meal-plan__wide ${options.preferPopular ? 'menu-lab__checkbox--active' : ''}`}>
          <input
            type="checkbox"
            checked={options.preferPopular}
            onChange={() => setOptions((prev) => ({ ...prev, preferPopular: !prev.preferPopular }))}
          />
          <span aria-hidden="true" className="menu-lab__checkbox-mark">
            {options.preferPopular ? '✓' : ''}
          </span>
          <span className="menu-lab__checkbox-text">만족도 높은 메뉴 우선</span>
        </label>

        <button type="submit" className="report-generate-button meal-plan__wide">
          식단표 생성
        </button>
      </form>

      {plan && summary && (
        <section className="menu-lab-result meal-plan__result" aria-live="polite">
          <div className="meal-plan__toolbar">
            <h3 className="menu-lab-result__title">
              {plan.options.mealLabel} 식단표 · {formatShortDate(plan.days[0].date)} ~{' '}
              {formatShortDate(plan.days[plan.days.length - 1].date)}
            </h3>
            <div className="meal-plan__actions">
              <button type="button" className="report-copy-button report-copy-button--ghost" onClick={handleRegenerate}>
                다른 조합으로 다시 생성
              </button>
              <button type="button" className="report-copy-button" onClick={handleCopy}>
                {copyState === 'done' ? '복사 완료' : '엑셀용 복사'}
              </button>
              <button type="button" className="report-copy-button report-copy-button--ghost" onClick={() => window.print()}>
                인쇄
              </button>
            </div>
          </div>
          {copyState === 'error' && (
            <p className="report-copy-error" role="alert">
              복사에 실패했습니다. 표를 직접 선택해 복사해 주세요.
            </p>
          )}

          <div className="meal-plan__summary">
            <span className="menu-lab-result__chip">
              선호 메뉴 {summary.preferredItems}/{summary.totalItems}개
            </span>
            {summary.proteinCounts.map((entry) => (
              <span key={entry.protein} className="menu-lab-result__chip">
                {entry.protein === '없음' ? '채소·곡류 중심' : entry.protein} {entry.count}
              </span>
            ))}
          </div>
          {summary.warnings.length > 0 && (
            <ul className="meal-plan__warnings">
              {summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <p className="meal-plan__hint">↻ 버튼을 누르면 해당 칸만 다른 메뉴로 바뀝니다. "보충" 표시는 만족도 평가 자료가 없는 메뉴이며, 단백질 분포는 중심 메뉴 기준입니다.</p>

          {weeks.map((week, weekIndex) => (
            <div key={week.offset} className="meal-plan__week">
              {weeks.length > 1 && <h4 className="meal-plan__week-title">{weekIndex + 1}주차</h4>}

              <div className="meal-plan__table-wrap">
                <table className="meal-plan__table">
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      {week.days.map((day) => (
                        <th scope="col" key={day.date}>
                          <span className="meal-plan__date">
                            {formatShortDate(day.date)}({day.weekdayLabel})
                          </span>
                          <span className={`meal-plan__type ${typeClass[day.type]}`}>{day.type}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planRows.map((row) => (
                      <tr key={row}>
                        <th scope="row">{planRowLabels[row]}</th>
                        {week.days.map((day, index) => (
                          <td key={day.date}>
                            <PlanCell day={day} row={row} onReplace={() => handleReplace(week.offset + index, row)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="meal-plan__cards">
                {week.days.map((day, index) => (
                  <article key={day.date} className="meal-plan__card">
                    <header className="meal-plan__card-header">
                      <span className="meal-plan__date">
                        {formatShortDate(day.date)}({day.weekdayLabel})
                      </span>
                      <span className={`meal-plan__type ${typeClass[day.type]}`}>{day.type}</span>
                    </header>
                    <dl className="meal-plan__card-list">
                      {planRows
                        .filter((row) => day.cells[row])
                        .map((row) => (
                          <div key={row} className="meal-plan__card-row">
                            <dt>{planRowLabels[row]}</dt>
                            <dd>
                              <PlanCell day={day} row={row} onReplace={() => handleReplace(week.offset + index, row)} />
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </section>
  )
}
