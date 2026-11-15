/**
 * 보고서 점검: 생성(또는 사용자가 고친) 문장이 입력 사실을 벗어나지 않는지 검사합니다.
 * 화면의 '작성 점검'과 scripts/checkReports.ts 자동 점검이 같은 규칙을 씁니다.
 */
import type { CustomerReaction, DoneAction, GeneratedReport, ReportAnalysis, ReportFormState } from './reportGenerator'
import { checkForbiddenExpressions } from './reportSafetyChecker'

export type QualityLevel = 'error' | 'warn' | 'info'
export type QualityTarget = 'customer' | 'internal' | 'client' | 'input'

export interface QualityIssue {
  level: QualityLevel
  target: QualityTarget
  message: string
}

const targetField: Record<Exclude<QualityTarget, 'input'>, keyof GeneratedReport> = {
  customer: 'customerMessage',
  internal: 'internalReport',
  client: 'clientReport',
}

const targetLabel: Record<QualityTarget, string> = {
  customer: '고객용',
  internal: '사내용',
  client: '고객사용',
  input: '입력',
}

/** 완료를 말하는 표현 */
const completionMarker = /(완료|하였|했|드렸|두었|마쳤|해\s?둠|드림|(?<!필요|요)함\.|둠\.)/

/** 조치별로 문장에 나타나는 단어. 완료 표현과 한 문장에 함께 있으면 '완료했다'는 뜻으로 봅니다. */
const actionWords: Record<DoneAction, RegExp> = {
  '고객 응대': /고객 응대/,
  '음식 교체': /(교체|바꿔\s?드|새로\s?(준비|드)|다른 메뉴로)/,
  '메뉴 회수': /(회수|수거)/,
  '동일 조리분 확인': /(동일 조리분|같은 시간에 조리된)/,
  '사진 기록': /(사진|촬영)/,
  '고객사 보고': /(고객사.{0,12}보고|1차로 말씀드린)/,
}

/** 체크하지 않은 고객 반응이 문장에 나오면 사실을 만든 것입니다. */
const reactionWords: Partial<Record<CustomerReaction, RegExp>> = {
  '보상 요청': /(보상|배상|치료비|비용을? 부담)/,
  '연락처 남김': /연락처/,
  '불쾌감 표현': /불쾌감을 (표|표현)/,
  '괜찮다고 함': /괜찮다는/,
}

/** 유형마다 고객 문장에만 나오는 단어: 다른 유형의 단어가 섞이면 유형을 잘못 잡은 것입니다. */
const categorySignature: Record<string, RegExp> = {
  머리카락: /머리카락/,
  벌레: /벌레/,
  '비닐/플라스틱': /비닐/,
  '뼈/가시': /뼈나 가시|뼈·가시/,
  품절: /소진/,
  '양 부족': /제공량/,
  염도: /간이 맞지/,
  '직원 응대': /직원 응대 과정/,
  '위생 불만': /위생 상태/,
  '시설·비품': /시설·비품/,
  '식중독 의심': /이상 증상|몸이 불편/,
  안전사고: /치아|다치셨/,
}

/** 음슴체: 마지막 글자가 ㅁ 받침(함·임·됨·밝힘·남김…)이거나 '필요.'처럼 명사로 끝남 */
function endsWithEum(line: string) {
  const trimmed = line.replace(/[)"'\s]+$/, '')
  if (!trimmed.endsWith('.')) return false
  const body = trimmed.slice(0, -1).replace(/\([^)]*\)$/, '')
  const ch = body.charCodeAt(body.length - 1)
  if (ch < 0xac00 || ch > 0xd7a3) return false
  return (ch - 0xac00) % 28 === 16
}

function sentencesOf(text: string) {
  return text
    .split(/\n+/)
    // 날짜(2026. 11. 16.)는 자르지 않도록 한글 뒤 마침표에서만 나눕니다.
    .flatMap((line) => line.split(/(?<=[가-힣)"][.!?])\s+/))
    .map((line) => line.trim())
    .filter(Boolean)
}

function bulletLines(text: string) {
  return text
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}

/** 사용자 입력을 그대로 옮긴 줄(메모·고객 표현)은 문체 검사에서 뺍니다. */
const quotedLine = /^(현장 메모|고객 표현):/

export function checkReportQuality(
  form: ReportFormState,
  analysis: ReportAnalysis,
  report: GeneratedReport,
): QualityIssue[] {
  const issues: QualityIssue[] = []
  const checked = new Set(form.onsiteActions)

  for (const target of ['customer', 'internal', 'client'] as const) {
    const text = report[targetField[target]]
    if (!text.trim()) continue
    const label = targetLabel[target]

    // 1) 체크하지 않은 조치를 완료형으로 쓰지 않았는지
    for (const sentence of sentencesOf(text)) {
      // 사용자가 메모에 직접 쓴 사실은 고칠 문장이 아니므로 제외합니다(입력 안내로 따로 알려 줌).
      if (quotedLine.test(sentence.replace(/^-\s*/, ''))) continue
      if (!completionMarker.test(sentence)) continue
      for (const [action, pattern] of Object.entries(actionWords) as Array<[DoneAction, RegExp]>) {
        if (!checked.has(action) && pattern.test(sentence)) {
          issues.push({ level: 'error', target, message: `${label}: 체크하지 않은 '${action}'이(가) 완료된 것처럼 쓰였습니다. ("${sentence}")` })
        }
      }
    }

    // 2) 체크하지 않은 고객 반응을 만들어 내지 않았는지
    for (const [reaction, pattern] of Object.entries(reactionWords) as Array<[CustomerReaction, RegExp]>) {
      if (!form.customerReactions.includes(reaction) && pattern.test(text)) {
        issues.push({ level: 'error', target, message: `${label}: 체크하지 않은 고객 반응 '${reaction}' 내용이 들어 있습니다.` })
      }
    }

    // 3) 문체가 섞이지 않았는지
    if (target === 'internal') {
      for (const line of bulletLines(text)) {
        if (quotedLine.test(line)) continue
        if (/(니다|세요|십시오)\.?$/.test(line)) {
          issues.push({ level: 'error', target, message: `${label}: 사내 보고에 합니다체 문장이 섞였습니다. ("${line}")` })
        } else if (!endsWithEum(line)) {
          issues.push({ level: 'warn', target, message: `${label}: 음슴체로 끝나지 않는 줄이 있습니다. ("${line}")` })
        }
      }
    } else {
      for (const raw of sentencesOf(text)) {
        if (/^■/.test(raw) || / 드림$/.test(raw)) continue
        // 끝에 붙은 괄호 설명((해당 메뉴: …))은 끝맺음 판단에서 뺍니다.
        const sentence = raw.replace(/\([^)]*\)(?=[.?!]$)/, '')
        if (/(함|임|됨|음)\.$/.test(sentence) && !/(니다|요)\.$/.test(sentence)) {
          issues.push({ level: 'error', target, message: `${label}: 합니다체 문장 사이에 음슴체가 섞였습니다. ("${sentence}")` })
        } else if (!/(니다|니까|십시오|세요|님)[.?!]$/.test(sentence)) {
          issues.push({ level: 'warn', target, message: `${label}: 끝맺음이 어색한 문장이 있습니다. ("${sentence}")` })
        }
      }

      // 4) 다른 유형의 상황 설명이 섞이지 않았는지
      // 사용자가 직접 쓴 말(고객 말씀·메모)은 빼고 엔진이 만든 문장만 봅니다.
      let ownText = text
      for (const userText of [form.keyword, form.memo, form.menuName].map((value) => value.trim()).filter(Boolean)) {
        ownText = ownText.split(userText).join(' ')
      }
      for (const [category, pattern] of Object.entries(categorySignature)) {
        if (category === analysis.category) continue
        if (analysis.isInjury && category === '안전사고') continue
        if (pattern.test(ownText)) {
          issues.push({ level: 'error', target, message: `${label}: '${analysis.category}' 건인데 '${category}' 상황 설명이 섞였습니다.` })
        }
      }
    }

    // 4-2) 원인을 단정하지 않았는지
    if (/원인(으로|이)\s?(확인|판명|밝혀)|원인은\s?\S+(입니다|임\.)|때문(입니다|임\.)/.test(text)) {
      issues.push({ level: 'error', target, message: `${label}: 확인 전인 원인을 단정하는 문장이 있습니다.` })
    }

    // 5) 남은 틀·기호
    if (/\{[^}]*\}|undefined|NaN|null/.test(text)) {
      issues.push({ level: 'error', target, message: `${label}: 채워지지 않은 자리표시가 남아 있습니다.` })
    }
    if (/\.\.|[^\S\n]{2,}/.test(text)) {
      issues.push({ level: 'warn', target, message: `${label}: 마침표·띄어쓰기가 겹친 곳이 있습니다.` })
    }
    if (/[을이은과]\([를가는와]\)/.test(text)) {
      issues.push({ level: 'info', target, message: `${label}: 메뉴명 끝 글자로 조사를 정하지 못해 '을(를)'처럼 함께 적었습니다.` })
    }

    // 6) 위험 표현
    for (const match of checkForbiddenExpressions(text)) {
      issues.push({ level: 'error', target, message: `${label}: 위험 표현 "${match.keyword}" — ${match.reason}` })
    }

    if (target === 'customer' && text.length > 700) {
      issues.push({ level: 'warn', target, message: `${label}: ${text.length}자로 깁니다. 메신저로 보내기 전에 줄여 주세요.` })
    }
  }

  return issues
}

/** 입력 단계에서 미리 알려 줄 점 */
export function checkInputConsistency(form: ReportFormState, analysis: ReportAnalysis): QualityIssue[] {
  const issues: QualityIssue[] = []
  const reactions = form.customerReactions

  if (reactions.includes('괜찮다고 함') && reactions.includes('불쾌감 표현')) {
    issues.push({ level: 'warn', target: 'input', message: "고객 반응에 '괜찮다고 함'과 '불쾌감 표현'이 함께 체크되어 있습니다. 응대 전후 변화라면 메모에 적어 주세요." })
  }
  if (reactions.includes('미확인') && reactions.length > 1) {
    issues.push({ level: 'warn', target: 'input', message: "'미확인'과 다른 고객 반응이 함께 체크되어 있습니다." })
  }
  if (analysis.isHighRisk && form.responseIntensity !== '중대') {
    issues.push({ level: 'warn', target: 'input', message: `'${analysis.category}' 건은 고위험 유형이라 보고서를 '중대' 기준으로 작성합니다. 대응 강도도 '중대'로 맞춰 주세요.` })
  }
  if (analysis.category === '기타' && !form.categoryOverride) {
    issues.push({ level: 'warn', target: 'input', message: 'VOC 유형을 자동으로 판정하지 못했습니다. 유형을 직접 골라 주시면 문장이 더 구체적으로 만들어집니다.' })
  }
  if (analysis.alternatives.length > 0 && !form.categoryOverride) {
    issues.push({ level: 'info', target: 'input', message: `'${analysis.alternatives.join("', '")}' 유형에도 해당하는 단어가 있습니다. 필요하면 유형을 바꿔 주세요.` })
  }
  const menuNeeded = !['위생 불만', '직원 응대', '시설·비품', '기타'].includes(analysis.category) && !analysis.isInjury
  if (menuNeeded && !form.menuName.trim()) {
    issues.push({ level: 'info', target: 'input', message: '메뉴명을 넣으면 보고서에 메뉴가 들어가 더 구체적으로 작성됩니다.' })
  }
  const done = form.onsiteActions.filter((action) => action !== '현장 확인 중')
  if (done.length === 0 && !form.onsiteActions.includes('현장 확인 중')) {
    issues.push({ level: 'info', target: 'input', message: "완료한 현장 조치가 없어 보고서에 '완료된 조치 입력 없음'으로 적힙니다." })
  }
  const memoActionHints: Array<[RegExp, string]> = [
    [/(교체|바꿔\s?드|새로\s?드)/, '음식 교체'],
    [/(회수|수거)/, '메뉴 회수'],
    [/(사진|촬영)/, '사진 기록'],
    [/고객사.{0,12}(보고|공유|연락)/, '고객사 보고'],
  ]
  for (const [pattern, action] of memoActionHints) {
    if (pattern.test(form.memo) && !form.onsiteActions.includes(action as never)) {
      issues.push({ level: 'info', target: 'input', message: `메모에 '${action}' 관련 내용이 있습니다. 실제로 했다면 '완료한 조치'에서 '${action}'을(를) 골라 주세요.` })
    }
  }
  if (form.onsiteActions.includes('메뉴 회수') && form.onsiteActions.includes('음식 교체') === false && analysis.category === '품절') {
    issues.push({ level: 'info', target: 'input', message: "품절 건에 '메뉴 회수'가 체크되어 있습니다. 맞는지 확인해 주세요." })
  }
  return issues
}
