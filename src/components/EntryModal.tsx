import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { VocCase } from '../data/vocCases'
import { useModalFocus } from '../utils/useModalFocus'

interface EntryModalProps {
  entry: VocCase
  onClose: () => void
}

const SECTIONS: { key: keyof VocCase; label: string }[] = [
  { key: 'incident', label: '발생 내용' },
  { key: 'customerScript', label: '고객 응대 문구' },
  { key: 'onsiteAction', label: '현장 조치' },
  { key: 'rootCause', label: '원인 분석' },
  { key: 'prevention', label: '재발 방지' },
  { key: 'reportExample', label: '보고서 예시' },
]

/**
 * 사례에 적힌 응대 문구가 '불편 사과'처럼 짧을 때 보여 줄 유형별 기본 문구.
 * 사례 데이터는 그대로 두고, 화면에서만 바로 읽어 줄 수 있는 문장을 함께 보여 줍니다.
 */
const defaultScriptByCategory: Record<string, string> = {
  '이물 혼입': '드신 음식에서 이물이 나와 정말 죄송합니다. 바로 새 음식으로 바꿔 드리고, 원인을 확인해 다시 안내드리겠습니다.',
  벌레: '음식에서 벌레가 나와 많이 놀라셨을 텐데 정말 죄송합니다. 바로 새 음식으로 바꿔 드리고, 세척 과정을 다시 확인하겠습니다.',
  머리카락: '음식에서 머리카락이 나와 정말 죄송합니다. 바로 새 음식으로 바꿔 드리고, 위생모 착용을 다시 점검하겠습니다.',
  '비닐/플라스틱': '음식에 비닐 조각이 섞여 정말 죄송합니다. 바로 새 음식으로 바꿔 드리고, 포장재 제거 과정을 다시 확인하겠습니다.',
  '뼈/가시': '뼈나 가시 때문에 불편하셨을 텐데 죄송합니다. 다치신 곳은 없으신지요? 손질 과정을 다시 확인하겠습니다.',
  품질: '음식이 기대에 못 미쳐 죄송합니다. 원하시면 다른 메뉴로 바꿔 드리고, 말씀하신 부분을 다시 확인하겠습니다.',
  염도: '간이 맞지 않아 죄송합니다. 원하시면 다른 음식으로 바꿔 드리고, 간 기준을 다시 맞추겠습니다.',
  품절: '찾으신 메뉴가 일찍 소진되어 죄송합니다. 지금 드실 수 있는 메뉴를 안내해 드리겠습니다.',
  '양 부족': '양이 부족하셨다니 죄송합니다. 원하시면 더 담아 드리겠습니다.',
  '위생 불만': '불편을 드려 죄송합니다. 말씀하신 곳은 바로 정리하고 다시 확인하겠습니다.',
  '직원 응대': '응대 과정에서 불쾌하셨을 텐데 진심으로 사과드립니다. 말씀하신 내용은 바로 확인하고 개선하겠습니다.',
  '식중독 의심': '식사 후 불편하시다니 걱정됩니다. 지금 상태는 어떠신지요? 필요하시면 진료를 안내해 드리고, 드신 메뉴를 바로 확인하겠습니다.',
  안전사고: '많이 놀라셨을 텐데 죄송합니다. 다치신 곳은 괜찮으신지요? 필요하시면 바로 진료를 안내해 드리겠습니다.',
}

function isThinScript(script: string) {
  return script.replace(/\s/g, '').length < 15
}

/** 음식 자체가 아닌 비품·설비·요청 사례: 상황을 단정하는 문구 대신 공통 문구를 씁니다. */
const nonFoodCase = /(요청|방역|해충|컵|수저|젓가락|숟가락|냅킨|물티슈|얼음|소음|파티션|텀블러|커피|음료|사진|점검|탐지기|기계|펌프|장비|좌석|자리|실내|온도|에어컨|난방|조명|휴식|대기|주문|결제|키오스크|안내)/

const neutralScript = '불편을 드려 죄송합니다. 말씀하신 내용을 바로 확인해 다시 안내드리겠습니다.'

/** 실제로 일어난 일을 가리키는 말이 있을 때만 유형별 문구를 씁니다. */
const happenedWords = /(발견|나와|나옴|나왔|씹|섞|혼입|짜|짠|짬|싱겁|싱거|매움|매워|질기|질겨|딱딱|식어|식었|미지근|눅눅|비린|냄새|덜 익|설익|불친절|반말|소진|품절|떨어)/
const uncertainWords = /(우려|문의|오류|고장|요청|확인 필요|가능성)/
/** 품절이지만 대상이 음식이 아닌 비품인 경우 */
const supplyWords = /(식판|빨대|뚜껑|수저|젓가락|숟가락|컵|냅킨|물티슈|얼음|용기|봉투|차수)/

function referenceScriptFor(entry: VocCase) {
  if (!isThinScript(entry.customerScript)) return undefined
  const text = `${entry.title} ${entry.incident}`
  if (nonFoodCase.test(text) || uncertainWords.test(text) || !happenedWords.test(text)) return neutralScript
  if (entry.category === '품절' && supplyWords.test(text)) return neutralScript
  // 품질은 범위가 넓어 기본값을 공통 문구로 두고, 맛·상태를 직접 말한 경우에만 유형 문구를 씁니다.
  if (entry.category === '품질' && !/(맛|식어|식었|미지근|눅눅|비린|냄새|질기|질겨|딱딱|덜 익|설익)/.test(text)) return neutralScript
  return defaultScriptByCategory[entry.category] ?? neutralScript
}

export function EntryModal({ entry, onClose }: EntryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  useModalFocus(dialogRef, closeButtonRef, onClose)

  const fallback = referenceScriptFor(entry)
  const scriptToCopy = fallback ?? entry.customerScript

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptToCopy)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <div>
            <span className="modal__category">{entry.category}</span>
            <h2 id="modal-title" className="modal__title">
              {entry.title}
            </h2>
          </div>

          <button ref={closeButtonRef} type="button" className="modal__close" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </header>

        <div className="modal__body">
          <div className="modal__details">
            {SECTIONS.map(({ key, label }) => (
              <section key={key} className="modal__section">
                <h3>{label}</h3>
                {key === 'customerScript' ? (
                  <>
                    <p className="modal__script">{entry.customerScript}</p>
                    {fallback && (
                      <div className="modal__script-fallback">
                        <p className="modal__script-fallback-label">참고 문구 · 상황에 맞게 고쳐 쓰세요</p>
                        <p className="modal__script">{fallback}</p>
                      </div>
                    )}
                    <button type="button" className="meal-plan__button modal__copy" onClick={copyScript}>
                      {copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
                      {copyState === 'copied' ? '복사했습니다' : '응대 문구 복사'}
                    </button>
                    {copyState === 'error' && (
                      <p className="meal-plan__field-error" role="alert">
                        복사하지 못했습니다. 문구를 직접 선택해 복사해 주세요.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="modal__text">{entry[key]}</p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
