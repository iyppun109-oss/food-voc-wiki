import { useEffect, useMemo, useRef, useState } from 'react'
import { type FormEvent } from 'react'
import { vocCases, type VocCase } from '../data/vocCases'
import {
  customerReactionOptions,
  onsiteActionOptions,
  generateClientReport,
  generateCustomerMessage,
  generateInternalReport,
  responseIntensityOptions,
  reportDetailLevelOptions,
  type CustomerReaction,
  type OnsiteAction,
  type GeneratedReport,
  type ReportFormState,
} from '../utils/reportGenerator'
import {
  applyRecommendedExpressions,
  checkForbiddenExpressions,
  type ForbiddenMatch,
} from '../utils/reportSafetyChecker'

interface ReportGeneratorModalProps {
  onClose: () => void
}

type ReportType = 'customer' | 'internal' | 'client'

type ReportTypeLabel = Record<ReportType, string>
type ReportTextField = keyof GeneratedReport

interface RecommendedCase {
  case: VocCase
  score: number
}

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
}

const initialGeneratedReport: GeneratedReport = {
  customerMessage: '',
  internalReport: '',
  clientReport: '',
}

const initialCopyState: Record<ReportType, boolean> = {
  customer: false,
  internal: false,
  client: false,
}

const initialSafetyChecks: Record<ReportType, ForbiddenMatch[]> = {
  customer: [],
  internal: [],
  client: [],
}

const reportTypeLabels: ReportTypeLabel = {
  customer: '고객용 대응 메시지',
  internal: '사내 보고용',
  client: '고객사 보고용',
}

const reportTextFieldByType: Record<ReportType, ReportTextField> = {
  customer: 'customerMessage',
  internal: 'internalReport',
  client: 'clientReport',
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function isBlank(value: string) {
  return value.trim().length === 0
}

export function ReportGeneratorModal({ onClose }: ReportGeneratorModalProps) {
  const [formState, setFormState] = useState<ReportFormState>(initialFormState)
  const [selectedCase, setSelectedCase] = useState<VocCase | null>(null)
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport>(initialGeneratedReport)
  const [editableReport, setEditableReport] = useState<GeneratedReport>(initialGeneratedReport)
  const [copiedState, setCopiedState] = useState<Record<ReportType, boolean>>(initialCopyState)
  const [safetyChecks, setSafetyChecks] = useState<Record<ReportType, ForbiddenMatch[]>>(initialSafetyChecks)
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false)
  const [tempDate, setTempDate] = useState('')
  const [tempTime, setTempTime] = useState('')
  const [copyError, setCopyError] = useState<ReportType | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const normalizedKeyword = useMemo(() => normalizeText(formState.keyword), [formState.keyword])

  const recommendations = useMemo(() => {
    if (!normalizedKeyword) return [] as VocCase[]

    const keywords = normalizedKeyword
      .split(/[\s,]+/)
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    return vocCases
      .map((entry): RecommendedCase => {
        const searchableText = [
          entry.title,
          entry.category,
          entry.incident,
          entry.customerScript,
          entry.onsiteAction,
          entry.rootCause,
          entry.prevention,
          entry.reportExample,
        ]
          .join(' ')
          .toLowerCase()

        const score = keywords.reduce(
          (acc, keyword) => (searchableText.includes(keyword) ? acc + 1 : acc),
          0,
        )

        return { case: entry, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.case.id.localeCompare(b.case.id))
      .slice(0, 3)
      .map((item) => item.case)
  }, [normalizedKeyword])

  const isFormComplete = useMemo(
    () =>
      !isBlank(formState.keyword) &&
      !isBlank(formState.workplace) &&
      !isBlank(formState.restaurantManagerName) &&
      !isBlank(formState.menuName) &&
      !isBlank(formState.occurredAt) &&
      !isBlank(formState.customerInfo),
    [formState],
  )

  const activeCase = useMemo(() => selectedCase ?? recommendations[0] ?? null, [selectedCase, recommendations])

  const getSafetyEntries = () => {
    return Object.entries(safetyChecks) as Array<[ReportType, ForbiddenMatch[]]>
  }

  const safetyTotalCount = Object.values(safetyChecks).reduce((acc, list) => acc + list.length, 0)

  const openDateTimePicker = () => {
    const parsedDate = parseDateTimeValue(formState.occurredAt)
    setTempDate(formatDateInputValue(parsedDate))
    setTempTime(formatTimeInputValue(parsedDate))
    setIsDateTimePickerOpen(true)
  }

  const applyDateTimeSelection = () => {
    const next = combineDateTimeValue(tempDate, tempTime)
    if (!next) return
    setFormState((prev) => ({ ...prev, occurredAt: next }))
    setIsDateTimePickerOpen(false)
  }

  const cancelDateTimeSelection = () => setIsDateTimePickerOpen(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDateTimePickerOpen) {
          cancelDateTimeSelection()
          return
        }
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDateTimePickerOpen, onClose])

  const handleApplyRecommendedCase = (recommended: VocCase) => {
    setSelectedCase(recommended)
  }

  const handleCustomerReactionToggle = (reaction: CustomerReaction) => {
    setFormState((prev) => {
      const next = prev.customerReactions.includes(reaction)
        ? prev.customerReactions.filter((item) => item !== reaction)
        : [...prev.customerReactions, reaction]

      return { ...prev, customerReactions: next }
    })
  }

  const handleOnsiteActionToggle = (action: OnsiteAction) => {
    setFormState((prev) => {
      const next = prev.onsiteActions.includes(action)
        ? prev.onsiteActions.filter((item) => item !== action)
        : [...prev.onsiteActions, action]

      return { ...prev, onsiteActions: next }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormComplete) return

    const nextGeneratedReport: GeneratedReport = {
      customerMessage: generateCustomerMessage(formState, activeCase),
      internalReport: generateInternalReport(formState, activeCase),
      clientReport: generateClientReport(formState, activeCase),
    }

    setGeneratedReport(nextGeneratedReport)
    setEditableReport(nextGeneratedReport)
    setSafetyChecks({
      customer: checkForbiddenExpressions(nextGeneratedReport.customerMessage),
      internal: checkForbiddenExpressions(nextGeneratedReport.internalReport),
      client: checkForbiddenExpressions(nextGeneratedReport.clientReport),
    })
    setCopiedState(initialCopyState)
  }

  const handleCopy = async (type: ReportType, text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyError(null)
      setCopiedState((prev) => ({ ...prev, [type]: true }))
    } catch {
      setCopyError(type)
    }
  }

  const handleEditableChange = (type: ReportType, value: string) => {
    const reportField = reportTextFieldByType[type]
    setEditableReport((prev) => ({ ...prev, [reportField]: value }))
    setCopyError(null)
    setCopiedState((prev) => ({ ...prev, [type]: false }))
    setSafetyChecks((prev) => ({
      ...prev,
      [type]: checkForbiddenExpressions(value),
    }))
  }

  const handleApplyRecommendation = (type: ReportType) => {
    const reportField = reportTextFieldByType[type]
    const nextText = applyRecommendedExpressions(editableReport[reportField])
    setEditableReport((prev) => ({ ...prev, [reportField]: nextText }))
    setSafetyChecks((prev) => ({
      ...prev,
      [type]: checkForbiddenExpressions(nextText),
    }))
    setCopiedState((prev) => ({ ...prev, [type]: false }))
  }

  const handleApplyAllRecommendations = () => {
    const customerField = reportTextFieldByType.customer
    const internalField = reportTextFieldByType.internal
    const clientField = reportTextFieldByType.client
    const nextEditableReport: GeneratedReport = {
      customerMessage: applyRecommendedExpressions(editableReport[customerField]),
      internalReport: applyRecommendedExpressions(editableReport[internalField]),
      clientReport: applyRecommendedExpressions(editableReport[clientField]),
    }

    setEditableReport(nextEditableReport)
    setSafetyChecks({
      customer: checkForbiddenExpressions(nextEditableReport.customerMessage),
      internal: checkForbiddenExpressions(nextEditableReport.internalReport),
      client: checkForbiddenExpressions(nextEditableReport.clientReport),
    })
    setCopiedState(initialCopyState)
  }

  const getSeverityClass = (severity: ForbiddenMatch['severity']) => {
    if (severity === '중대') return 'is-severity-high'
    if (severity === '위험') return 'is-severity-medium'
    return 'is-severity-low'
  }

  const hasResult = Object.values(generatedReport).some((text) => text.length > 0)
  const hasAnyViolation = safetyTotalCount > 0

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header className="modal__header">
          <h2 id="report-modal-title" className="modal__title">
            VOC 보고서 작성
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            닫기
          </button>
        </header>

        <div className="modal__body report-modal__body">
          <form className="report-form" onSubmit={handleSubmit}>
            <label className="report-form__field">
              <span>사업장</span>
              <input
                type="text"
                value={formState.workplace}
                onChange={(event) => setFormState((prev) => ({ ...prev, workplace: event.target.value }))}
                placeholder="OO 식당"
              />
            </label>

            <label className="report-form__field">
              <span>식당관리자 이름</span>
              <input
                type="text"
                value={formState.restaurantManagerName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, restaurantManagerName: event.target.value }))
                }
                placeholder="식당 관리자 성함"
              />
            </label>

            <label className="report-form__field">
              <span>고객사 담당자</span>
              <input
                type="text"
                value={formState.clientContactName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, clientContactName: event.target.value }))
                }
                placeholder="고객사 담당자 성함 (선택 입력)"
              />
            </label>

            <div className="report-form__field">
              <span id="report-occurred-at-label">발생 일시</span>
              <button
                type="button"
                className="report-form__datetime-trigger"
                onClick={openDateTimePicker}
                aria-labelledby="report-occurred-at-label"
                aria-haspopup="dialog"
                aria-expanded={isDateTimePickerOpen}
              >
                {formatDateTime(formState.occurredAt) || (
                  <span className="report-form__placeholder">발생 일시 선택</span>
                )}
              </button>
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
                    <button type="button" className="report-datetime-picker__cancel" onClick={cancelDateTimeSelection}>
                      취소
                    </button>
                    <button type="button" className="report-generate-button" onClick={applyDateTimeSelection}>
                      적용
                    </button>
                  </div>
                </section>
              )}
            </div>

            <label className="report-form__field">
              <span>고객 정보</span>
              <textarea
                value={formState.customerInfo}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, customerInfo: event.target.value }))
                }
                placeholder="인원, 좌석, 이용시간 등"
              />
            </label>

            <label className="report-form__field">
              <span>메뉴명 또는 발생 메뉴</span>
              <input
                type="text"
                value={formState.menuName}
                onChange={(event) => setFormState((prev) => ({ ...prev, menuName: event.target.value }))}
                placeholder="예: 제육볶음, 불고기김치찜"
              />
            </label>

            <label className="report-form__field">
              <span>사례 키워드</span>
              <input
                type="text"
                value={formState.keyword}
                onChange={(event) => setFormState((prev) => ({ ...prev, keyword: event.target.value }))}
                placeholder="VOC 키워드(고객, 증상, 메뉴), 1~2개"
              />
            </label>

            <fieldset className="report-form__field report-form__fieldset">
              <legend>고객 반응</legend>
              <div className="report-form__options-grid">
                {customerReactionOptions.map((reaction) => (
                  <label className="report-form__option" key={reaction}>
                    <input
                      type="checkbox"
                      checked={formState.customerReactions.includes(reaction)}
                      onChange={() => handleCustomerReactionToggle(reaction)}
                    />
                    {reaction}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="report-form__field report-form__fieldset">
              <legend>현장 조치 (실제로 완료한 것만 선택)</legend>
              <div className="report-form__options-grid">
                {onsiteActionOptions.map((action) => (
                  <label className="report-form__option" key={action}>
                    <input
                      type="checkbox"
                      checked={formState.onsiteActions.includes(action)}
                      onChange={() => handleOnsiteActionToggle(action)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="report-form__field">
              <span>대응 강도</span>
              <select
                value={formState.responseIntensity}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    responseIntensity: event.target.value as ReportFormState['responseIntensity'],
                  }))
                }
              >
                {responseIntensityOptions.map((intensity) => (
                  <option key={intensity} value={intensity}>
                    {intensity}
                  </option>
                ))}
              </select>
            </label>

            <label className="report-form__field">
              <span>보고서 상세도</span>
              <select
                value={formState.reportDetailLevel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    reportDetailLevel: event.target.value as ReportFormState['reportDetailLevel'],
                  }))
                }
              >
                {reportDetailLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            {recommendations.length > 0 && (
              <section className="report-recommendation">
                <h3 className="report-recommendation__title">유사 사례 추천</h3>
                <div className="report-recommendation__list">
                  {recommendations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`report-recommendation__item ${selectedCase?.id === item.id ? 'is-active' : ''}`}
                      onClick={() => handleApplyRecommendedCase(item)}
                    >
                      <span className="report-recommendation__case-title">{item.title}</span>
                      <span className="report-recommendation__case-meta">
                        {item.id} | {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <label className="report-form__field">
              <span>추가 메모</span>
              <textarea
                value={formState.memo}
                onChange={(event) => setFormState((prev) => ({ ...prev, memo: event.target.value }))}
                placeholder="현장 메모 (선택 입력)"
              />
            </label>

            <button type="submit" className="report-generate-button" disabled={!isFormComplete}>
              VOC 보고서 생성
            </button>
          </form>

          {hasResult && (
            <section className="report-result">
              <h3 className="report-result__title">생성 결과</h3>
              {copyError && (
                <p className="report-copy-error" role="alert">
                  {reportTypeLabels[copyError]} 복사에 실패했습니다. 내용을 직접 선택해 복사해 주세요.
                </p>
              )}
              <div className="report-result__cards">
                <article className="report-result-card">
                  <h4 className="report-result-card__title">1. 고객용 대응 메시지</h4>
                  <textarea
                    className="report-result__output"
                    value={editableReport.customerMessage}
                    onChange={(event) => handleEditableChange('customer', event.target.value)}
                  />
                  <div className="report-result-card__actions">
                    <button
                      type="button"
                      className="report-copy-button"
                      onClick={() => handleCopy('customer', editableReport.customerMessage)}
                    >
                      {copiedState.customer ? '복사 완료' : '복사'}
                    </button>
                    <button
                      type="button"
                      className="report-copy-button report-copy-button--ghost"
                      onClick={() => handleApplyRecommendation('customer')}
                    >
                      권장 표현으로 바꾸기
                    </button>
                  </div>
                </article>

                <article className="report-result-card">
                  <h4 className="report-result-card__title">2. 사내 보고용</h4>
                  <textarea
                    className="report-result__output"
                    value={editableReport.internalReport}
                    onChange={(event) => handleEditableChange('internal', event.target.value)}
                  />
                  <div className="report-result-card__actions">
                    <button
                      type="button"
                      className="report-copy-button"
                      onClick={() => handleCopy('internal', editableReport.internalReport)}
                    >
                      {copiedState.internal ? '복사 완료' : '복사'}
                    </button>
                    <button
                      type="button"
                      className="report-copy-button report-copy-button--ghost"
                      onClick={() => handleApplyRecommendation('internal')}
                    >
                      권장 표현으로 바꾸기
                    </button>
                  </div>
                </article>

                <article className="report-result-card">
                  <h4 className="report-result-card__title">3. 고객사 보고용</h4>
                  <textarea
                    className="report-result__output"
                    value={editableReport.clientReport}
                    onChange={(event) => handleEditableChange('client', event.target.value)}
                  />
                  <div className="report-result-card__actions">
                    <button
                      type="button"
                      className="report-copy-button"
                      onClick={() => handleCopy('client', editableReport.clientReport)}
                    >
                      {copiedState.client ? '복사 완료' : '복사'}
                    </button>
                    <button
                      type="button"
                      className="report-copy-button report-copy-button--ghost"
                      onClick={() => handleApplyRecommendation('client')}
                    >
                      권장 표현으로 바꾸기
                    </button>
                  </div>
                </article>
              </div>

              <div className="report-safety">
                <h4 className="report-safety__title">표현 안전성 검사</h4>
                <button
                  type="button"
                  className="report-safety__apply-all"
                  onClick={handleApplyAllRecommendations}
                >
                  전체 권장 표현 적용
                </button>

                {!hasAnyViolation ? (
                  <p className="report-safety__safe">위험 표현이 발견되지 않았습니다.</p>
                ) : (
                  <div className="report-safety__items">
                    {getSafetyEntries().map(([type, checks]) =>
                      checks.map((item) => (
                        <article key={`${type}-${item.keyword}`} className="report-safety-item">
                          <h5 className="report-safety-item__label">{reportTypeLabels[type]}</h5>
                          <p className={`report-safety-item__severity ${getSeverityClass(item.severity)}`}>
                            위험도: {item.severity}
                          </p>
                          <p className="report-safety-item__text">위험 표현: {`"${item.keyword}"`}</p>
                          <p className="report-safety-item__text">사유: {item.reason}</p>
                          <p className="report-safety-item__text">권장 표현: {`"${item.replacement}"`}</p>
                        </article>
                      )),
                    )}
                  </div>
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
  if (Number.isNaN(parsed.getTime())) return new Date()
  return parsed
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

function formatDateTime(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  const hour = parsed.getHours()
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  const isAm = hour < 12
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${parsed.getFullYear()}. ${month}. ${day}. ${isAm ? '오전' : '오후'} ${displayHour}:${minute}`
}
