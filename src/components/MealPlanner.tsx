import { useMemo, useState, type FormEvent } from 'react'
import { Copy, Printer, RefreshCw, Shuffle } from 'lucide-react'
import type { MealSlot } from '../data/mealPlanItems'
import { nutritionOf, nutritionSource } from '../data/mealPlanNutrition'
import {
  avoidFactorOptions,
  defaultPortions,
  itemNutrition,
  portionLabels,
  sitePortions,
  generateMealPlan,
  nextMonday,
  planRowLabels,
  planRows,
  planToTsv,
  replaceCell,
  sitePresets,
  summarizePlan,
  type AvoidFactor,
  type DayNutrition,
  type MealPlan,
  type MealPlanOptions,
  type NutritionStatus,
  type NutritionTarget,
  type PlanDay,
  type PlanRow,
  type Season,
  type SiteType,
} from '../utils/mealPlanGenerator'
import '../mealPlan.css'

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
  target: { site: '사무직', ...sitePresets.사무직 },
  portions: defaultPortions,
  seed: 1,
}

const statusLabel: Record<NutritionStatus, string> = {
  ok: '목표 범위',
  low: '부족',
  high: '초과',
  partial: '일부 자료 없음',
  none: '자료 없음',
}

function formatShortDate(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

interface CellProps {
  day: PlanDay
  row: PlanRow
  portions: Record<MealSlot, number>
  showNutrition: boolean
  onReplace: () => void
}

function PlanCell({ day, row, portions, showNutrition, onReplace }: CellProps) {
  const item = day.cells[row]
  if (!item) {
    return <span className="meal-plan__empty">-</span>
  }
  const nutrition = itemNutrition(item, portions)
  const source = nutritionOf(item.name)
  return (
    <span className="meal-plan__cell">
      <span className="meal-plan__cell-text">
        <span className="meal-plan__name">
          {item.name}
          {!item.preferred && (
            <span className="meal-plan__badge" title="만족도 평가 자료가 없는 보충 메뉴">
              보충
            </span>
          )}
        </span>
        {showNutrition && (
          <span
            className="meal-plan__meta"
            title={source ? `식약처 DB 음식명: ${source.dbName} (${source.basis})` : undefined}
          >
            {nutrition ? (
              <>
                <span>
                  {nutrition.servingG}g · {Math.round(nutrition.kcal)}kcal
                </span>
                <span>단백질 {nutrition.proteinG.toFixed(1)}g</span>
              </>
            ) : (
              '영양 자료 없음'
            )}
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
        <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </span>
  )
}

interface GaugeProps {
  label: string
  value: number
  unit: string
  min: number
  /** 상한이 없으면 하한만 있는 목표(단백질) */
  max?: number
  status: NutritionStatus
}

/** 하루 합계를 목표 구간과 함께 보여 주는 막대 */
function Gauge({ label, value, unit, min, max, status }: GaugeProps) {
  if (status === 'none') {
    return <span className="meal-plan__gauge-empty">{label} 자료 없음</span>
  }
  const scale = (max ?? min) * 1.3
  const percent = (amount: number) => `${Math.min(100, (amount / scale) * 100)}%`
  return (
    <span className={`meal-plan__gauge meal-plan__gauge--${status}`}>
      <span className="meal-plan__gauge-value">
        <span className="meal-plan__gauge-label">{label}</span>
        {value.toLocaleString('ko-KR')}
        <span className="meal-plan__gauge-unit">{unit}</span>
        <span className="meal-plan__gauge-status">{statusLabel[status]}</span>
      </span>
      <span className="meal-plan__gauge-track" aria-hidden="true">
        <span
          className="meal-plan__gauge-band"
          style={{ left: percent(min), width: max ? `${((max - min) / scale) * 100}%` : `calc(100% - ${percent(min)})` }}
        />
        <span className="meal-plan__gauge-fill" style={{ width: percent(value) }} />
      </span>
    </span>
  )
}

function DayTotals({ nutrition, target }: { nutrition: DayNutrition; target: NutritionTarget }) {
  return (
    <>
      <Gauge
        label="열량"
        value={nutrition.kcal}
        unit="kcal"
        min={target.kcalMin}
        max={target.kcalMax}
        status={nutrition.kcalStatus}
      />
      <Gauge label="단백질" value={nutrition.proteinG} unit="g" min={target.proteinMin} status={nutrition.proteinStatus} />
    </>
  )
}

export function MealPlanner() {
  const [options, setOptions] = useState<MealPlanOptions>(initialOptions)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [rejected, setRejected] = useState<Record<string, string[]>>({})
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  const [showNutrition, setShowNutrition] = useState(true)

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

  const setSite = (site: SiteType) => {
    setOptions((prev) =>
      site === '직접 설정'
        ? { ...prev, target: { ...prev.target, site } }
        : { ...prev, target: { site, ...sitePresets[site] }, portions: sitePortions[site] },
    )
  }

  const setTargetValue = (key: 'kcalMin' | 'kcalMax' | 'proteinMin', raw: string) => {
    const value = Math.max(0, Number(raw) || 0)
    setOptions((prev) => ({ ...prev, target: { ...prev.target, site: '직접 설정', [key]: value } }))
  }

  const setPortion = (slot: MealSlot, raw: string) => {
    const value = Math.max(0, Number(raw) || 0)
    setOptions((prev) => ({ ...prev, portions: { ...prev.portions, [slot]: value } }))
  }

  const targetInvalid = options.target.kcalMin >= options.target.kcalMax
  const target = plan?.options.target

  return (
    <section className="meal-plan">
      <div className="page-head">
        <h1 className="page-title">식단표</h1>
        <p className="page-meta">평일 {options.mealLabel} · 1인 분량 기준</p>
      </div>

      <form className="meal-plan__form" onSubmit={handleSubmit}>
        <fieldset className="meal-plan__group">
          <legend>기간과 구성</legend>
          <div className="meal-plan__fields">
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
                onChange={(event) =>
                  setOptions((prev) => ({ ...prev, weeks: Number(event.target.value) as MealPlanOptions['weeks'] }))
                }
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
                  setOptions((prev) => ({
                    ...prev,
                    stewPerWeek: Number(event.target.value) as MealPlanOptions['stewPerWeek'],
                  }))
                }
              >
                <option value={0}>없음</option>
                <option value={1}>1일</option>
                <option value={2}>2일</option>
                <option value={3}>3일</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="meal-plan__group">
          <legend>1식 영양 목표</legend>
          <div className="meal-plan__fields">
            <label className="menu-lab__field">
              <span>사업장 유형</span>
              <select value={options.target.site} onChange={(event) => setSite(event.target.value as SiteType)}>
                <option value="사무직">사무직</option>
                <option value="생산직">생산직 (활동량 많음)</option>
                <option value="직접 설정">직접 설정</option>
              </select>
            </label>

            <label className="menu-lab__field">
              <span>열량 하한 (kcal)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={options.target.kcalMin}
                onChange={(event) => setTargetValue('kcalMin', event.target.value)}
              />
            </label>

            <label className="menu-lab__field">
              <span>열량 상한 (kcal)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={options.target.kcalMax}
                onChange={(event) => setTargetValue('kcalMax', event.target.value)}
              />
            </label>

            <label className="menu-lab__field">
              <span>단백질 하한 (g)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={options.target.proteinMin}
                onChange={(event) => setTargetValue('proteinMin', event.target.value)}
              />
            </label>
          </div>
          {targetInvalid && (
            <p className="meal-plan__field-error" role="alert">
              열량 상한은 하한보다 커야 합니다
            </p>
          )}
        </fieldset>

        <fieldset className="meal-plan__group">
          <legend>1인 분량 (g)</legend>
          <div className="meal-plan__fields meal-plan__fields--narrow">
            {(Object.keys(portionLabels) as MealSlot[]).map((slot) => (
              <label key={slot} className="menu-lab__field">
                <span>{portionLabels[slot]}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  value={options.portions[slot]}
                  onChange={(event) => setPortion(slot, event.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="meal-plan__group-note">
            열량과 단백질은 식약처 DB의 100g당 수치에 이 분량을 곱해 계산합니다. 사업장 배식량에 맞게 바꿔 주세요
          </p>
        </fieldset>

        <fieldset className="meal-plan__group">
          <legend>메뉴 고르는 기준</legend>
          <div className="meal-plan__checks">
            <label className="meal-plan__check">
              <input
                type="checkbox"
                checked={options.preferPopular}
                onChange={() => setOptions((prev) => ({ ...prev, preferPopular: !prev.preferPopular }))}
              />
              만족도 높은 메뉴 우선
            </label>
            {avoidFactorOptions.map((factor) => (
              <label key={factor} className="meal-plan__check">
                <input type="checkbox" checked={options.avoid.includes(factor)} onChange={() => toggleAvoid(factor)} />
                {factor} VOC 줄이기
              </label>
            ))}
          </div>
        </fieldset>

        <div className="meal-plan__submit">
          <button type="submit" className="meal-plan__primary" disabled={targetInvalid}>
            식단표 만들기
          </button>
        </div>
      </form>

      {plan && summary && target && (
        <section className="meal-plan__result" aria-live="polite">
          <div className="meal-plan__toolbar">
            <h2 className="meal-plan__result-title">
              {plan.options.mealLabel} 식단표 · {formatShortDate(plan.days[0].date)}~
              {formatShortDate(plan.days[plan.days.length - 1].date)}
            </h2>
            <div className="meal-plan__actions">
              <label className="meal-plan__check">
                <input type="checkbox" checked={showNutrition} onChange={() => setShowNutrition((prev) => !prev)} />
                분량·영양 표시
              </label>
              <button type="button" className="meal-plan__button" onClick={handleRegenerate}>
                <Shuffle size={16} strokeWidth={1.5} aria-hidden="true" />
                다른 조합
              </button>
              <button type="button" className="meal-plan__button" onClick={handleCopy}>
                <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                {copyState === 'done' ? '복사됨' : '엑셀용 복사'}
              </button>
              <button type="button" className="meal-plan__button" onClick={() => window.print()}>
                <Printer size={16} strokeWidth={1.5} aria-hidden="true" />
                인쇄
              </button>
            </div>
          </div>
          {copyState === 'error' && (
            <p className="meal-plan__field-error" role="alert">
              복사하지 못했습니다. 표를 직접 선택해 복사해 주세요
            </p>
          )}

          <dl className="meal-plan__stats">
            <div className="meal-plan__stat">
              <dt>하루 평균 열량</dt>
              <dd>{summary.avgKcal === null ? '–' : `${summary.avgKcal.toLocaleString('ko-KR')}kcal`}</dd>
              <dd className="meal-plan__stat-note">
                목표 {target.kcalMin}~{target.kcalMax}kcal
              </dd>
            </div>
            <div className="meal-plan__stat">
              <dt>하루 평균 단백질</dt>
              <dd>{summary.avgProteinG === null ? '–' : `${summary.avgProteinG}g`}</dd>
              <dd className="meal-plan__stat-note">목표 {target.proteinMin}g 이상</dd>
            </div>
            <div className="meal-plan__stat">
              <dt>목표를 채운 날</dt>
              <dd>
                {summary.onTargetDays}/{plan.days.length}일
              </dd>
              <dd className="meal-plan__stat-note">
                {summary.completeDays < plan.days.length
                  ? `${plan.days.length - summary.completeDays}일은 영양 자료가 빠져 판정 제외`
                  : '열량과 단백질 모두 기준'}
              </dd>
            </div>
            <div className="meal-plan__stat">
              <dt>만족도 높은 메뉴</dt>
              <dd>
                {summary.preferredItems}/{summary.totalItems}개
              </dd>
              <dd className="meal-plan__stat-note">
                {summary.proteinCounts
                  .slice(0, 3)
                  .map((entry) => `${entry.protein === '없음' ? '채소·곡류' : entry.protein} ${entry.count}`)
                  .join(' · ')}
              </dd>
            </div>
          </dl>

          {summary.nutritionKnownItems < summary.totalItems && (
            <p className="meal-plan__notice">
              {summary.nutritionKnownItems === 0
                ? '영양 자료가 아직 등록되지 않아 열량과 단백질을 계산하지 못했습니다.'
                : `메뉴 ${summary.totalItems}개 중 ${summary.totalItems - summary.nutritionKnownItems}개는 영양 자료가 없어 합계에서 빠졌습니다. 해당 날짜의 합계는 실제보다 작습니다.`}
            </p>
          )}

          {summary.warnings.length > 0 && (
            <ul className="meal-plan__warnings">
              {summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          {weeks.map((week, weekIndex) => (
            <div key={week.offset} className="meal-plan__week">
              {weeks.length > 1 && <h3 className="meal-plan__week-title">{weekIndex + 1}주차</h3>}

              <div className="meal-plan__table-wrap">
                <table className="meal-plan__table">
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      {week.days.map((day) => (
                        <th scope="col" key={day.date}>
                          <span className="meal-plan__date">
                            {formatShortDate(day.date)} {day.weekdayLabel}
                          </span>
                          <span className="meal-plan__type">{day.type}</span>
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
                            <PlanCell
                              day={day}
                              row={row}
                              portions={plan.options.portions}
                              showNutrition={showNutrition}
                              onReplace={() => handleReplace(week.offset + index, row)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">하루 합계</th>
                      {week.days.map((day, index) => (
                        <td key={day.date}>
                          <span className="meal-plan__totals">
                            <DayTotals nutrition={summary.dayNutrition[week.offset + index]} target={target} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="meal-plan__cards">
                {week.days.map((day, index) => (
                  <article key={day.date} className="meal-plan__card">
                    <header className="meal-plan__card-header">
                      <span className="meal-plan__date">
                        {formatShortDate(day.date)} {day.weekdayLabel}
                      </span>
                      <span className="meal-plan__type">{day.type}</span>
                    </header>
                    <dl className="meal-plan__card-list">
                      {planRows
                        .filter((row) => day.cells[row])
                        .map((row) => (
                          <div key={row} className="meal-plan__card-row">
                            <dt>{planRowLabels[row]}</dt>
                            <dd>
                              <PlanCell
                                day={day}
                                row={row}
                                portions={plan.options.portions}
                                showNutrition={showNutrition}
                                onReplace={() => handleReplace(week.offset + index, row)}
                              />
                            </dd>
                          </div>
                        ))}
                    </dl>
                    <div className="meal-plan__totals meal-plan__totals--card">
                      <DayTotals nutrition={summary.dayNutrition[week.offset + index]} target={target} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          <p className="meal-plan__hint">
            열량·단백질은 {nutritionSource.name}
            {nutritionSource.version ? ` ${nutritionSource.version}판` : ''}의 100g당 수치에 위에서 정한 1인 분량을 곱한
            값입니다. 메뉴명이 DB와 다르면 가장 가까운 음식의 수치를 썼고, 수치 위에 마우스를 올리면 어떤 음식인지
            보입니다. 실제 레시피에 따라 달라지므로 영양 표시에 쓰기 전에 확인해 주세요. "보충"은 만족도 평가 자료가 없는
            메뉴입니다.
          </p>
        </section>
      )}
    </section>
  )
}
