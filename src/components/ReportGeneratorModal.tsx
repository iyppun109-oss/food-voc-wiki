import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { vocCases, type VocCase } from '../data/vocCases'
import { getReportSentenceTemplate } from '../data/reportSentenceTemplates'

interface ReportGeneratorModalProps {
  onClose: () => void
}

interface ReportFormState {
  workplace: string
  owner: string
  menuName: string
  vocType: string
  occurredAt: string
  customerInfo: string
  incidentDetails: string
  customerReaction: string
  actionPlan: string
  rootCause: string
  prevention: string
  keyword: string
}

interface RecommendedCase {
  case: VocCase
  score: number
}

type ReportSection = 'incident' | 'action' | 'cause' | 'prevention'

const initialFormState: ReportFormState = {
  workplace: '',
  owner: '',
  menuName: '',
  vocType: '',
  occurredAt: '',
  customerInfo: '',
  incidentDetails: '',
  customerReaction: '',
  actionPlan: '',
  rootCause: '',
  prevention: '',
  keyword: '',
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function isBlank(value: string) {
  return value.trim().length === 0
}

function cleanInput(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-•*·]+/, '')
    .replace(/^[\"'`]+|[\"'`]+$/g, '')
}

function shortenForSentence(value: string, maxLength = 38) {
  const cleaned = cleanInput(value).replace(/["'`]/g, '')
  if (!cleaned) return ''
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength - 1)
}

function stripVerbSuffix(value: string) {
  return value
    .trim()
    .replace(/입니다\.?$/g, '함')
    .replace(/있습니다\.?$/g, '있음')
    .replace(/합니다\.?$/g, '함')
}

function pickTemplateSentence(templates: string[], seedText: string) {
  if (templates.length === 0) return ''

  const normalized = normalizeText(seedText)
  if (!normalized) {
    return stripVerbSuffix(templates[0] ?? '')
  }

  const hash = Array.from(normalized).reduce((acc, char) => {
    return (acc * 131 + char.charCodeAt(0)) % Number.MAX_SAFE_INTEGER
  }, 17)

  return stripVerbSuffix(templates[hash % templates.length] ?? templates[0] ?? '')
}

function buildSentenceFromInput(section: ReportSection, userText: string, menuName: string) {
  const menuText = cleanInput(menuName) || '해당 메뉴'
  const content = shortenForSentence(userText, 28)
  if (!content) return ''

  switch (section) {
    case 'incident':
      return stripVerbSuffix(`${menuText} 이용 중 ${content} 확인됨`)
    case 'action':
      return stripVerbSuffix(`현장 대응으로 ${content} 처리 진행함`)
    case 'cause':
      return stripVerbSuffix(`${content}(으)로 원인 가능성 있음`)
    case 'prevention':
      return stripVerbSuffix(`${content} 개선 반영해 재발 방지 강화하겠음`)
    default:
      return ''
  }
}

function buildSentenceFromCase(
  section: ReportSection,
  caseText: string,
  menuName: string,
) {
  const menuText = cleanInput(menuName) || '해당 메뉴'
  const content = shortenForSentence(caseText, 24)
  if (!content) return ''

  switch (section) {
    case 'incident':
      return stripVerbSuffix(`${menuText}에서 유사 사례 기준 ${content}`)
    case 'action':
      return stripVerbSuffix(`유사 사례 처리 방식으로 ${content}(을)를 적용함`)
    case 'cause':
      return stripVerbSuffix(`사례 분석상 ${content}로 판단되어 원인 가능성 있음`)
    case 'prevention':
      return stripVerbSuffix(`유사 건 반영해 ${content} 보완하고 예방 조치 강화하겠음`)
    default:
      return ''
  }
}

function selectSentenceBySection(
  section: ReportSection,
  userText: string,
  caseText: string | undefined,
  templateCandidates: string[],
  seedText: string,
  menuName: string,
) {
  const userSentence = buildSentenceFromInput(section, userText, menuName)
  const caseSentence = !isBlank(userText) ? '' : buildSentenceFromCase(section, cleanInput(caseText ?? ''), menuName)

  if (userSentence) return userSentence
  if (caseSentence) return caseSentence

  return pickTemplateSentence(templateCandidates, seedText)
}

function buildCustomerReaction(userText: string, caseText: string | undefined) {
  const cleanedUser = cleanInput(userText)
  if (cleanedUser) {
    return stripVerbSuffix(`고객은 ${shortenForSentence(cleanedUser, 28)} 반응함`)
  }

  const cleanedCase = cleanInput(caseText ?? '')
  if (cleanedCase) {
    return stripVerbSuffix(`고객 코멘트는 ${shortenForSentence(cleanedCase, 28)} 반응 확인`)
  }

  return '고객 반응은 응대로 기록함'
}

export function ReportGeneratorModal({ onClose }: ReportGeneratorModalProps) {
  const [formState, setFormState] = useState<ReportFormState>(initialFormState)
  const [selectedCase, setSelectedCase] = useState<VocCase | null>(null)
  const [generatedReport, setGeneratedReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false)
  const [tempDate, setTempDate] = useState('')
  const [tempTime, setTempTime] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const normalizedKeyword = useMemo(
    () => normalizeText(formState.keyword),
    [formState.keyword],
  )

  const recommendations = useMemo(() => {
    if (!normalizedKeyword) return [] as VocCase[]

    const keywords = normalizedKeyword
      .split(/[\s,]+/)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)

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
      formState.workplace.trim().length > 0 &&
      formState.owner.trim().length > 0 &&
      formState.menuName.trim().length > 0 &&
      formState.vocType.trim().length > 0 &&
      formState.occurredAt.trim().length > 0 &&
      formState.customerInfo.trim().length > 0,
    [formState],
  )

  const openDateTimePicker = () => {
    const parsedDate = parseDateTimeValue(formState.occurredAt)

    setTempDate(formatDateInputValue(parsedDate))
    setTempTime(formatTimeInputValue(parsedDate))
    setIsDateTimePickerOpen(true)
  }

  const applyDateTimeSelection = () => {
    const nextDateTime = combineDateTimeValue(tempDate, tempTime)
    if (!nextDateTime) return

    setFormState((prev) => ({
      ...prev,
      occurredAt: nextDateTime,
    }))
    setIsDateTimePickerOpen(false)
  }

  const cancelDateTimeSelection = () => {
    setIsDateTimePickerOpen(false)
  }

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

  const applyRecommendedCase = (recommended: VocCase) => {
    setFormState((prev) => ({
      ...prev,
      vocType: recommended.category,
      incidentDetails: isBlank(prev.incidentDetails)
        ? recommended.incident
        : prev.incidentDetails,
      customerReaction: isBlank(prev.customerReaction)
        ? recommended.customerScript
        : prev.customerReaction,
      actionPlan: isBlank(prev.actionPlan)
        ? recommended.onsiteAction
        : prev.actionPlan,
      rootCause: isBlank(prev.rootCause)
        ? recommended.rootCause
        : prev.rootCause,
      prevention: isBlank(prev.prevention)
        ? recommended.prevention
        : prev.prevention,
    }))

    setSelectedCase(recommended)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const reportTemplate = getReportSentenceTemplate(formState.vocType)
    const seedBase = [
      formState.vocType,
      selectedCase?.id,
      selectedCase?.category,
      formState.keyword,
      formState.menuName,
      formState.workplace,
    ]
      .filter(Boolean)
      .join(' | ')

    const incident = selectSentenceBySection(
      'incident',
      formState.incidentDetails,
      selectedCase?.incident,
      reportTemplate.incidentSentences,
      `incident:${seedBase}`,
      formState.menuName,
    )

    const action = selectSentenceBySection(
      'action',
      formState.actionPlan,
      selectedCase?.onsiteAction,
      reportTemplate.actionSentences,
      `action:${seedBase}`,
      formState.menuName,
    )

    const cause = selectSentenceBySection(
      'cause',
      formState.rootCause,
      selectedCase?.rootCause,
      reportTemplate.causeSentences,
      `cause:${seedBase}`,
      formState.menuName,
    )

    const prevention = selectSentenceBySection(
      'prevention',
      formState.prevention,
      selectedCase?.prevention,
      reportTemplate.preventionSentences,
      `prevention:${seedBase}`,
      formState.menuName,
    )

    const customerReaction = buildCustomerReaction(
      formState.customerReaction,
      selectedCase?.customerScript,
    )

    const report = `[고객 VOC 사고 보고]

1.사업장 : ${formState.workplace}
(PM : ${formState.owner})

2.VOC 유형 : ${formState.vocType}

3.발생 일시 : ${formatDateTime(formState.occurredAt)}

4.고객 정보 : ${formState.customerInfo}

5.발생 내용
- ${incident}
- ${customerReaction}

6.조치 사항 및 계획
- ${action}
- ${cause}
- ${prevention}

이상입니다.`

    setGeneratedReport(report)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!generatedReport) return
    await navigator.clipboard.writeText(generatedReport)
    setCopied(true)
  }

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
      <div
        className="modal report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
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
            ×
          </button>
        </header>

        <div className="modal__body report-modal__body">
          <label className="report-form__field">
            <span>사례 키워드</span>
            <input
              type="text"
              value={formState.keyword}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, keyword: event.target.value }))
              }
              placeholder="예: 머리카락, 벌레, 비닐, 품절, 염도, 오징어뼈"
            />
          </label>

          {recommendations.length > 0 && (
            <section className="report-recommendation">
              <h3 className="report-recommendation__title">추천 사례</h3>
              <div className="report-recommendation__list">
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="report-recommendation__item"
                    onClick={() => applyRecommendedCase(item)}
                  >
                    <span className="report-recommendation__case-title">
                      {item.title}
                    </span>
                    <span className="report-recommendation__case-meta">
                      {item.id} | {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <form className="report-form" onSubmit={handleSubmit}>
            <label className="report-form__field">
              <span>사업장</span>
              <input
                type="text"
                value={formState.workplace}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, workplace: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>담당자</span>
              <input
                type="text"
                value={formState.owner}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, owner: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>메뉴명</span>
              <input
                type="text"
                value={formState.menuName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, menuName: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>VOC 유형</span>
              <input
                type="text"
                value={formState.vocType}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, vocType: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>발생 일시</span>
              <button
                type="button"
                className="report-form__datetime-trigger"
                onClick={openDateTimePicker}
                onFocus={openDateTimePicker}
                aria-haspopup="dialog"
                aria-expanded={isDateTimePickerOpen}
              >
                {formatDateTime(formState.occurredAt) || '발생 일시 선택'}
              </button>
              {isDateTimePickerOpen && (
                <section className="report-datetime-picker" aria-label="발생 일시 선택 패널">
                  <div className="report-datetime-picker__fields">
                    <label className="report-datetime-picker__field">
                      <span>날짜</span>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(event) => setTempDate(event.target.value)}
                      />
                    </label>
                    <label className="report-datetime-picker__field">
                      <span>시간</span>
                      <input
                        type="time"
                        value={tempTime}
                        onChange={(event) => setTempTime(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="report-datetime-picker__actions">
                    <button
                      type="button"
                      className="report-datetime-picker__cancel"
                      onClick={cancelDateTimeSelection}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="report-generate-button"
                      onClick={applyDateTimeSelection}
                    >
                      확인
                    </button>
                  </div>
                </section>
              )}
            </label>

            <label className="report-form__field">
              <span>고객 정보</span>
              <textarea
                value={formState.customerInfo}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, customerInfo: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>발생 내용</span>
              <textarea
                value={formState.incidentDetails}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    incidentDetails: event.target.value,
                  }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>고객 반응</span>
              <textarea
                value={formState.customerReaction}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    customerReaction: event.target.value,
                  }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>조치 사항</span>
              <textarea
                value={formState.actionPlan}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, actionPlan: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>원인 분석</span>
              <textarea
                value={formState.rootCause}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, rootCause: event.target.value }))
                }
              />
            </label>

            <label className="report-form__field">
              <span>재발 방지 대책</span>
              <textarea
                value={formState.prevention}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, prevention: event.target.value }))
                }
              />
            </label>

            <button
              type="submit"
              className="report-generate-button"
              disabled={!isFormComplete}
            >
              보고서 생성
            </button>
          </form>

          {generatedReport && (
            <section className="report-result">
              <h3 className="report-result__title">생성 결과</h3>
              <textarea
                className="report-result__output"
                readOnly
                value={generatedReport}
              />
              <button
                type="button"
                className="report-copy-button"
                onClick={handleCopy}
              >
                {copied ? '복사 완료' : '결과 복사'}
              </button>
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
  return `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(
    date.getDate(),
  )}`
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
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const year = parsed.getFullYear()
  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  const hour = parsed.getHours()
  const minute = padTwoDigits(parsed.getMinutes())
  const isAm = hour < 12
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${year}. ${month}. ${day}. ${isAm ? '오전' : '오후'} ${displayHour}:${minute}`
}
