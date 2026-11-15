import { useEffect, useMemo, useRef, useState } from 'react'
import { type FormEvent } from 'react'
import { AlertTriangle, Check, CheckCircle2, Copy, Info, RotateCcw, Wand2 } from 'lucide-react'
import { vocCases, type VocCase } from '../data/vocCases'
import {
  analyzeReportInput,
  customerReactionOptions,
  doneActionOptions,
  generateReportContents,
  reportCategoryOptions,
  reportDetailLevelOptions,
  responseIntensityOptions,
  type CategoryType,
  type CustomerReaction,
  type GeneratedReport,
  type OnsiteAction,
  type ReportFormState,
} from '../utils/reportGenerator'
import { checkInputConsistency, checkReportQuality, type QualityIssue } from '../utils/reportQuality'
import { applyRecommendedExpressions, checkForbiddenExpressions } from '../utils/reportSafetyChecker'
import '../report.css'

interface ReportGeneratorModalProps {
  onClose: () => void
}

type ReportType = 'customer' | 'internal' | 'client'

const reportTabs: Array<{ type: ReportType; field: keyof GeneratedReport; label: string; hint: string }> = [
  { type: 'customer', field: 'customerMessage', label: '고객용', hint: '고객에게 직접 전하는 사과·안내 (합니다체)' },
  { type: 'internal', field: 'internalReport', label: '사내 보고', hint: '사내 보고 양식 (음슴체)' },
  { type: 'client', field: 'clientReport', label: '고객사 보고', hint: '고객사 담당자에게 보내는 보고 (공식 합니다체)' },
]

const initialFormState: ReportFormState = {
  keyword: '',
  workplace: '',
  restaurantManagerName: '',
  clientContactName: '',
  menuName: '',
  occurredAt: '',
  customerInfo: '',
  memo: '',
  customerReactions: [],
  onsiteActions: [],
  responseIntensity: responseIntensityOptions[0],
  reportDetailLevel: reportDetailLevelOptions[1],
  categoryOverride: '',
}

const emptyReport: GeneratedReport = { customerMessage: '', internalReport: '', clientReport: '' }

const requiredFields: Array<{ key: keyof ReportFormState; label: string }> = [
  { key: 'workplace', label: '사업장' },
  { key: 'occurredAt', label: '발생 일시' },
  { key: 'keyword', label: '고객 말씀·VOC 내용' },
]

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

function IssueIcon({ level }: { level: QualityIssue['level'] }) {
  if (level === 'error') return <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
  if (level === 'warn') return <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
  return <Info size={16} strokeWidth={1.75} aria-hidden="true" />
}

export function ReportGeneratorModal({ onClose }: ReportGeneratorModalProps) {
  const [formState, setFormState] = useState<ReportFormState>(initialFormState)
  const [selectedCase, setSelectedCase] = useState<VocCase | null>(null)
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport>(emptyReport)
  const [editableReport, setEditableReport] = useState<GeneratedReport>(emptyReport)
  const [activeTab, setActiveTab] = useState<ReportType>('customer')
  const [copied, setCopied] = useState<ReportType | null>(null)
  const [copyError, setCopyError] = useState<ReportType | null>(null)
  const [showMissing, setShowMissing] = useState(false)
  const [generatedFrom, setGeneratedFrom] = useState('')
  const [occurredAtIsNow, setOccurredAtIsNow] = useState(false)
  const [pickerDefault, setPickerDefault] = useState('')
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false)
  const [tempDate, setTempDate] = useState('')
  const [tempTime, setTempTime] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLElement>(null)

  const update = <K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) =>
    setFormState((prev) => ({ ...prev, [key]: value }))

  const normalizedKeyword = useMemo(() => normalizeText(formState.keyword), [formState.keyword])

  const recommendations = useMemo(() => {
    if (!normalizedKeyword) return [] as VocCase[]
    const keywords = normalizedKeyword.split(/[\s,]+/).filter(Boolean)
    return vocCases
      .map((entry) => {
        const text = [entry.title, entry.category, entry.incident, entry.customerScript].join(' ').toLowerCase()
        return { entry, score: keywords.reduce((acc, keyword) => (text.includes(keyword) ? acc + 1 : acc), 0) }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
      .slice(0, 3)
      .map((item) => item.entry)
  }, [normalizedKeyword])

  const activeCase = selectedCase ?? null
  const analysis = useMemo(() => analyzeReportInput(formState, activeCase), [formState, activeCase])
  const inputIssues = useMemo(
    () => (formState.keyword.trim() ? checkInputConsistency(formState, analysis) : []),
    [formState, analysis],
  )

  const missing = requiredFields.filter(({ key }) => String(formState[key] ?? '').trim() === '')
  const hasResult = Object.values(generatedReport).some((text) => text.length > 0)

  const qualityIssues = useMemo(
    () => (hasResult ? checkReportQuality(formState, analysis, editableReport) : []),
    [hasResult, formState, analysis, editableReport],
  )
  const issuesByTab = (type: ReportType) => qualityIssues.filter((issue) => issue.target === type)
  const forbiddenCount = (type: ReportType) => {
    const field = reportTabs.find((tab) => tab.type === type)!.field
    return checkForbiddenExpressions(editableReport[field]).length
  }

  const openDateTimePicker = () => {
    const parsed = parseDateTimeValue(formState.occurredAt)
    setTempDate(formatDateInputValue(parsed))
    setTempTime(formatTimeInputValue(parsed))
    setPickerDefault(formState.occurredAt ? '' : `${formatDateInputValue(parsed)}T${formatTimeInputValue(parsed)}`)
    setIsDateTimePickerOpen(true)
  }

  const applyDateTimeSelection = () => {
    const next = combineDateTimeValue(tempDate, tempTime)
    if (!next) return
    update('occurredAt', next)
    setOccurredAtIsNow(next === pickerDefault)
    setIsDateTimePickerOpen(false)
  }

  const setNow = () => {
    const now = new Date()
    update('occurredAt', `${formatDateInputValue(now)}T${formatTimeInputValue(now)}`)
    setOccurredAtIsNow(true)
    setIsDateTimePickerOpen(false)
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isDateTimePickerOpen) {
        setIsDateTimePickerOpen(false)
        return
      }
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDateTimePickerOpen, onClose])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (missing.length > 0) {
      setShowMissing(true)
      return
    }
    const next = generateReportContents(formState, activeCase)
    setGeneratedReport(next)
    setEditableReport(next)
    setGeneratedFrom(JSON.stringify({ formState, caseId: activeCase?.id ?? '' }))
    setCopied(null)
    setCopyError(null)
    setShowMissing(false)
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const isStale = hasResult && generatedFrom !== JSON.stringify({ formState, caseId: activeCase?.id ?? '' })

  const activeMeta = reportTabs.find((tab) => tab.type === activeTab)!
  const activeText = editableReport[activeMeta.field]
  const isEdited = activeText !== generatedReport[activeMeta.field]

  const handleCopy = async () => {
    if (!activeText) return
    try {
      await navigator.clipboard.writeText(activeText)
      setCopyError(null)
      setCopied(activeTab)
    } catch {
      setCopyError(activeTab)
    }
  }

  const setActiveText = (value: string) => {
    setEditableReport((prev) => ({ ...prev, [activeMeta.field]: value }))
    setCopied(null)
  }

  const doneActions = formState.onsiteActions.filter((action): action is Exclude<OnsiteAction, '현장 확인 중'> => action !== '현장 확인 중')
  const isChecking = formState.onsiteActions.includes('현장 확인 중')

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header className="modal__header">
          <div>
            <h2 id="report-modal-title" className="modal__title">
              VOC 보고서 작성
            </h2>
            <p className="report-modal__lead">입력한 사실만으로 고객용·사내·고객사 보고 문장을 한 번에 만듭니다.</p>
          </div>
          <button ref={closeButtonRef} type="button" className="modal__close" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </header>

        <div className="modal__body report-modal__body">
          <form className="report-form report-form--sections" onSubmit={handleSubmit} noValidate>
            {/* 1. VOC 내용 */}
            <fieldset className="form-section">
              <legend className="form-section__head">
                <span className="form-section__title">VOC 내용</span>
                <span className="form-section__hint">고객이 한 말을 그대로 적으면 유형을 자동으로 판정합니다</span>
              </legend>
              <label className="report-form__field">
                <span>
                  고객 말씀·VOC 내용 <em className="report-required">필수</em>
                </span>
                <textarea
                  className="report-form__keyword"
                  rows={2}
                  value={formState.keyword}
                  onChange={(event) => update('keyword', event.target.value)}
                  placeholder="예: 제육볶음에서 머리카락이 나왔어요"
                  aria-invalid={showMissing && !formState.keyword.trim()}
                />
              </label>

              {formState.keyword.trim() && (
                <div className={`report-detect ${analysis.isHighRisk ? 'is-high-risk' : ''}`} aria-live="polite">
                  <div className="report-detect__main">
                    <span className="report-detect__label">판정 유형</span>
                    <strong className="report-detect__value">{analysis.label}</strong>
                    {analysis.isHighRisk && <span className="report-detect__badge">긴급</span>}
                  </div>
                  <p className="report-detect__why">
                    {analysis.isOverridden
                      ? '직접 고른 유형으로 작성합니다.'
                      : analysis.evidence.length > 0
                        ? `근거: ${analysis.evidence.map((word) => `'${word}'`).join(', ')}${analysis.evidenceFromMemo ? ' (현장 메모에서 찾음)' : ''}`
                        : analysis.fromCase
                          ? '고른 비슷한 사례의 유형을 따랐습니다.'
                          : '판정 단어가 없어 기타로 분류했습니다.'}
                  </p>
                  <label className="report-detect__override">
                    <span>유형 바꾸기</span>
                    <select
                      value={formState.categoryOverride ?? ''}
                      onChange={(event) => update('categoryOverride', event.target.value as CategoryType | '')}
                    >
                      <option value="">자동 판정 ({analysis.detected})</option>
                      {reportCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="form-section__grid">
                <label className="report-form__field">
                  <span>발생 메뉴</span>
                  <input
                    type="text"
                    value={formState.menuName}
                    onChange={(event) => update('menuName', event.target.value)}
                    placeholder="예: 제육볶음 (메뉴와 무관하면 비워 두기)"
                  />
                </label>
                <div className="report-form__field">
                  <span id="report-occurred-at-label">
                    발생 일시 <em className="report-required">필수</em>
                  </span>
                  <button
                    type="button"
                    className="report-form__datetime-trigger"
                    onClick={openDateTimePicker}
                    aria-labelledby="report-occurred-at-label"
                    aria-haspopup="dialog"
                    aria-expanded={isDateTimePickerOpen}
                    aria-invalid={showMissing && !formState.occurredAt}
                  >
                    {formatDateTime(formState.occurredAt) || <span className="report-form__placeholder">날짜와 시간 고르기</span>}
                  </button>
                  {occurredAtIsNow && !isDateTimePickerOpen && (
                    <p className="report-form__note">현재 시각으로 채웠습니다. 실제 발생 시각인지 확인해 주세요.</p>
                  )}
                  {isDateTimePickerOpen && (
                    <section className="report-datetime-picker" aria-label="발생 일시 선택">
                      <div className="report-datetime-picker__fields">
                        <label className="report-datetime-picker__field">
                          <span>날짜</span>
                          <input type="date" value={tempDate} onChange={(event) => setTempDate(event.target.value)} />
                        </label>
                        <label className="report-datetime-picker__field">
                          <span>시간</span>
                          <input type="time" value={tempTime} onChange={(event) => setTempTime(event.target.value)} />
                        </label>
                      </div>
                      <div className="report-datetime-picker__actions">
                        <button type="button" className="report-datetime-picker__cancel" onClick={setNow}>
                          지금
                        </button>
                        <button type="button" className="report-datetime-picker__cancel" onClick={() => setIsDateTimePickerOpen(false)}>
                          취소
                        </button>
                        <button type="button" className="report-generate-button" onClick={applyDateTimeSelection}>
                          적용
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              </div>

              <label className="report-form__field">
                <span>고객 정보</span>
                <input
                  type="text"
                  value={formState.customerInfo}
                  onChange={(event) => update('customerInfo', event.target.value)}
                  placeholder="예: 본관 3층 직원, 중식 이용 (사내 보고에만 들어갑니다)"
                />
              </label>

              {recommendations.length > 0 && (
                <section className="report-recommendation" aria-label="비슷한 대응 사례">
                  <h3 className="report-recommendation__title">비슷한 대응 사례</h3>
                  <div className="report-recommendation__list">
                    {recommendations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`report-recommendation__item ${selectedCase?.id === item.id ? 'is-active' : ''}`}
                        onClick={() => setSelectedCase(selectedCase?.id === item.id ? null : item)}
                        aria-pressed={selectedCase?.id === item.id}
                      >
                        <span className="report-recommendation__case-title">{item.title}</span>
                        <span className="report-recommendation__case-meta">{item.category}</span>
                      </button>
                    ))}
                  </div>
                  <p className="form-section__hint">유형을 판정하지 못했을 때 고른 사례의 유형을 참고합니다. 사례 본문은 보고서에 넣지 않습니다.</p>
                </section>
              )}
            </fieldset>

            {/* 2. 현장 상황 */}
            <fieldset className="form-section">
              <legend className="form-section__head">
                <span className="form-section__title">현장 상황</span>
                <span className="form-section__hint">실제로 한 것만 고르세요. 고르지 않은 조치는 완료형으로 쓰지 않습니다</span>
              </legend>
              <div className="report-choice-group">
                <p className="report-choice-group__label">완료한 조치</p>
                <div className="report-chips">
                  {doneActionOptions.map((action) => {
                    const active = doneActions.includes(action)
                    return (
                      <button
                        key={action}
                        type="button"
                        className={`report-chip ${active ? 'is-active' : ''}`}
                        aria-pressed={active}
                        onClick={() => setFormState((prev) => ({ ...prev, onsiteActions: toggle(prev.onsiteActions, action) }))}
                      >
                        {active && <Check size={14} strokeWidth={2.25} aria-hidden="true" />}
                        {action}
                      </button>
                    )
                  })}
                </div>
                <label className="report-switch">
                  <input
                    type="checkbox"
                    checked={isChecking}
                    onChange={() =>
                      setFormState((prev) => ({ ...prev, onsiteActions: toggle<OnsiteAction>(prev.onsiteActions, '현장 확인 중') }))
                    }
                  />
                  현장 확인이 아직 진행 중
                </label>
              </div>
              <div className="report-choice-group">
                <p className="report-choice-group__label">고객 반응</p>
                <div className="report-chips">
                  {customerReactionOptions.map((reaction) => {
                    const active = formState.customerReactions.includes(reaction)
                    return (
                      <button
                        key={reaction}
                        type="button"
                        className={`report-chip ${active ? 'is-active' : ''}`}
                        aria-pressed={active}
                        onClick={() =>
                          setFormState((prev) => ({ ...prev, customerReactions: toggle<CustomerReaction>(prev.customerReactions, reaction) }))
                        }
                      >
                        {active && <Check size={14} strokeWidth={2.25} aria-hidden="true" />}
                        {reaction}
                      </button>
                    )
                  })}
                </div>
              </div>
              <label className="report-form__field">
                <span>
                  현장 메모 <em className="report-optional">선택</em>
                </span>
                <textarea
                  value={formState.memo}
                  onChange={(event) => update('memo', event.target.value)}
                  placeholder="확인한 사실을 적으면 사내 보고에 그대로 들어갑니다. 예: 12시 10분경 수저통이 비어 있었음"
                />
              </label>
            </fieldset>

            {/* 3. 보고 정보 */}
            <fieldset className="form-section">
              <legend className="form-section__head">
                <span className="form-section__title">보고 정보</span>
              </legend>
              <div className="form-section__grid">
                <label className="report-form__field">
                  <span>
                    사업장 <em className="report-required">필수</em>
                  </span>
                  <input
                    type="text"
                    value={formState.workplace}
                    onChange={(event) => update('workplace', event.target.value)}
                    placeholder="예: 한빛전자 본관"
                    aria-invalid={showMissing && !formState.workplace.trim()}
                  />
                </label>
                <label className="report-form__field">
                  <span>식당관리자</span>
                  <input
                    type="text"
                    value={formState.restaurantManagerName}
                    onChange={(event) => update('restaurantManagerName', event.target.value)}
                    placeholder="성함"
                  />
                </label>
                <label className="report-form__field">
                  <span>고객사 담당자</span>
                  <input
                    type="text"
                    value={formState.clientContactName}
                    onChange={(event) => update('clientContactName', event.target.value)}
                    placeholder="성함 (비우면 '담당자님')"
                  />
                </label>
                <label className="report-form__field">
                  <span>대응 강도</span>
                  <select
                    value={formState.responseIntensity}
                    onChange={(event) => update('responseIntensity', event.target.value as ReportFormState['responseIntensity'])}
                  >
                    {responseIntensityOptions.map((intensity) => (
                      <option key={intensity} value={intensity}>
                        {intensity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="report-choice-group">
                <p className="report-choice-group__label">보고서 분량</p>
                <div className="report-segment" role="radiogroup" aria-label="보고서 분량">
                  {reportDetailLevelOptions.map((level) => (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={formState.reportDetailLevel === level}
                      className={`report-segment__item ${formState.reportDetailLevel === level ? 'is-active' : ''}`}
                      onClick={() => update('reportDetailLevel', level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {inputIssues.length > 0 && (
              <ul className="report-issues report-issues--input" aria-label="입력 확인">
                {inputIssues.map((issue) => (
                  <li key={issue.message} className={`report-issue is-${issue.level}`}>
                    <IssueIcon level={issue.level} />
                    <span>{issue.message}</span>
                    {issue.message.includes("'중대'로") && (
                      <button type="button" className="report-issue__fix" onClick={() => update('responseIntensity', '중대')}>
                        중대로 바꾸기
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="report-submit">
              {showMissing && missing.length > 0 && (
                <p className="report-submit__missing" role="alert">
                  {missing.map((field) => field.label).join(', ')}을(를) 입력해 주세요.
                </p>
              )}
              <button type="submit" className="meal-plan__primary report-submit__button">
                <Wand2 size={18} strokeWidth={1.75} aria-hidden="true" />
                {hasResult ? '입력대로 다시 만들기' : '보고서 만들기'}
              </button>
            </div>
          </form>

          {hasResult && (
            <section className="report-output" ref={resultRef} aria-label="생성 결과">
              {isStale && (
                <div className="report-stale" role="status">
                  <Info size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>입력이 바뀌었습니다. 아래 문장은 바꾸기 전 입력으로 만든 것입니다.</span>
                  <button type="button" className="report-issue__fix" onClick={() => resultRef.current?.closest('.modal__body')?.querySelector<HTMLFormElement>('form')?.requestSubmit()}>
                    다시 만들기
                  </button>
                </div>
              )}
              <div className="report-tabs" role="tablist" aria-label="보고서 종류">
                {reportTabs.map((tab) => {
                  const problems = issuesByTab(tab.type).filter((issue) => issue.level !== 'info').length
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      role="tab"
                      id={`report-tab-${tab.type}`}
                      aria-selected={activeTab === tab.type}
                      aria-controls="report-tabpanel"
                      className={`report-tabs__item ${activeTab === tab.type ? 'is-active' : ''}`}
                      onClick={() => setActiveTab(tab.type)}
                    >
                      {tab.label}
                      {problems > 0 && <span className="report-tabs__count">{problems}</span>}
                    </button>
                  )
                })}
              </div>

              <div className="report-panel" role="tabpanel" id="report-tabpanel" aria-labelledby={`report-tab-${activeTab}`}>
                <p className="report-panel__hint">
                  {activeMeta.hint} · {activeText.length.toLocaleString('ko-KR')}자{isEdited ? ' · 직접 고침' : ''}
                </p>
                <textarea
                  className="report-panel__text"
                  value={activeText}
                  onChange={(event) => setActiveText(event.target.value)}
                  aria-label={`${activeMeta.label} 내용`}
                  rows={Math.min(44,Math.max(10, activeText.split('\n').length + 2))}
                />
                <div className="report-panel__actions">
                  <button type="button" className="meal-plan__primary" onClick={handleCopy}>
                    {copied === activeTab ? <Check size={18} aria-hidden="true" /> : <Copy size={18} strokeWidth={1.75} aria-hidden="true" />}
                    {copied === activeTab ? '복사했습니다' : `${activeMeta.label} 복사`}
                  </button>
                  {forbiddenCount(activeTab) > 0 && (
                    <button type="button" className="meal-plan__button" onClick={() => setActiveText(applyRecommendedExpressions(activeText))}>
                      권장 표현으로 바꾸기
                    </button>
                  )}
                  {isEdited && (
                    <button type="button" className="meal-plan__button" onClick={() => setActiveText(generatedReport[activeMeta.field])}>
                      <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                      처음 만든 문장으로
                    </button>
                  )}
                </div>
                {copyError === activeTab && (
                  <p className="report-copy-error" role="alert">
                    복사에 실패했습니다. 내용을 직접 선택해 복사해 주세요.
                  </p>
                )}
              </div>

              <div className="report-check" aria-live="polite">
                <h3 className="report-check__title">작성 점검</h3>
                {issuesByTab(activeTab).length === 0 ? (
                  <p className="report-check__ok">
                    <CheckCircle2 size={18} strokeWidth={1.75} aria-hidden="true" />
                    고르지 않은 조치·반응을 쓰지 않았고, 문체와 유형이 맞습니다.
                  </p>
                ) : (
                  <ul className="report-issues">
                    {issuesByTab(activeTab).map((issue) => (
                      <li key={issue.message} className={`report-issue is-${issue.level}`}>
                        <IssueIcon level={issue.level} />
                        <span>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function padTwoDigits(value: number) {
  return String(value).padStart(2, '0')
}

function parseDateTimeValue(value: string) {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`
}

function formatTimeInputValue(date: Date) {
  return `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`
}

function combineDateTimeValue(date: string, time: string) {
  if (!date || !time) return ''
  return `${date}T${time}`
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function formatDateTime(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const hour = parsed.getHours()
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${parsed.getFullYear()}. ${parsed.getMonth() + 1}. ${parsed.getDate()}.(${weekdays[parsed.getDay()]}) ${hour < 12 ? '오전' : '오후'} ${displayHour}:${minute}`
}
