/**
 * VOC 보고서 생성 엔진 (규칙 기반, 외부 호출 없음)
 *
 * 1) 내용 정하기: 입력값에서 사실(완료 조치·고객 반응·메모)과 계획(확인·재발 방지)을 분리합니다.
 *    - 완료형 문장은 사용자가 체크한 조치에서만 만듭니다.
 *    - 원인은 '원인 후보(확인 전)'로만 쓰고 단정하지 않습니다.
 * 2) 문장 만들기: 같은 내용을 세 문체로 씁니다.
 *    - 고객용: 공손한 합니다체 / 사내용: 음슴체(~함.) / 고객사용: 공식 합니다체
 * 3) 점검: reportQuality.ts가 완료형·문체·유형 혼동을 검사합니다.
 */
import {
  detectReportCategoryDetailed,
  QUALITY_COOKING_STATUS_KEYWORDS,
  QUALITY_COOKING_STATUS_PATTERNS,
  type ReportCategory,
} from '../data/reportCategoryRules'
import { type VocCase } from '../data/vocCases'
import { attachJosa, joinKorean } from './koreanJosa'

export type CustomerReaction = '괜찮다고 함' | '불쾌감 표현' | '연락처 남김' | '보상 요청' | '고객사 공유 필요' | '미확인'

export type OnsiteAction = '고객 응대' | '음식 교체' | '메뉴 회수' | '동일 조리분 확인' | '사진 기록' | '고객사 보고' | '현장 확인 중'

export type DoneAction = Exclude<OnsiteAction, '현장 확인 중'>

export type ResponseIntensity = '일반' | '주의' | '중대'

export type ReportDetailLevel = '짧게' | '보통' | '자세히'

export type CategoryType = ReportCategory

export const customerReactionOptions: CustomerReaction[] = ['괜찮다고 함', '불쾌감 표현', '연락처 남김', '보상 요청', '고객사 공유 필요', '미확인']

/** 완료한 조치만 고르는 칸. '현장 확인 중'은 진행 상태라 따로 보여 줍니다. */
export const doneActionOptions: DoneAction[] = ['고객 응대', '음식 교체', '메뉴 회수', '동일 조리분 확인', '사진 기록', '고객사 보고']

export const onsiteActionOptions: OnsiteAction[] = [...doneActionOptions, '현장 확인 중']

export const responseIntensityOptions: ResponseIntensity[] = ['일반', '주의', '중대']

export const reportDetailLevelOptions: ReportDetailLevel[] = ['짧게', '보통', '자세히']

export const reportCategoryOptions: CategoryType[] = [
  '머리카락',
  '벌레',
  '비닐/플라스틱',
  '뼈/가시',
  '이물 혼입',
  '품질',
  '염도',
  '품절',
  '양 부족',
  '위생 불만',
  '직원 응대',
  '시설·비품',
  '식중독 의심',
  '안전사고',
  '기타',
]

export interface ReportFormState {
  keyword: string
  workplace: string
  restaurantManagerName: string
  clientContactName: string
  menuName: string
  occurredAt: string
  customerInfo: string
  memo: string
  customerReactions: CustomerReaction[]
  onsiteActions: OnsiteAction[]
  responseIntensity: ResponseIntensity
  reportDetailLevel: ReportDetailLevel
  /** 자동 판정 대신 사용자가 고른 유형. 비어 있으면 자동 판정을 씁니다. */
  categoryOverride?: CategoryType | ''
}

export interface GeneratedReport {
  customerMessage: string
  internalReport: string
  clientReport: string
}

// ───────────────────────── 유형별 지식 ─────────────────────────

interface CategoryKnowledge {
  /** 사내 보고 유형 표기 */
  label: string
  /** 고객사 보고 유형 표기 */
  clientLabel: string
  /** 메뉴와 관련된 유형인지(아니면 메뉴명을 문장에 넣지 않음) */
  menuRelated: boolean
  /** 사내 발생 내용 첫 줄(음슴체). {m}=메뉴, {kw}=고객 표현 */
  incident: string
  /** 고객용 공감 문장(합니다체). {t}=메뉴(없으면 '음식'), {kw}=고객 표현 */
  customerEmpathy: string
  /** 고객용 사과 범위 */
  apologyScope: '식사' | '식당 이용'
  /** 고객용 확인 계획 */
  customerCheck: string
  /** 고객용 재발 방지 */
  customerPrevention: string
  /** 사내 확인 계획(음슴체). 동일 조리분 확인을 이미 했으면 sameBatch 줄은 뺍니다. */
  internalChecks: Array<{ text: string; sameBatch?: boolean; topic?: RegExp }>
  /** 원인 후보(명사구). 확인 전 추정으로만 씁니다. 고위험 유형은 비웁니다. */
  causes: string[]
  /** 사내 재발 방지 계획(음슴체) */
  internalPrevention: string[]
  /** 고객사용 원인 확인 계획 */
  clientCheck: string
  /** 고객사용 재발 방지 */
  clientPrevention: string
  /** 문의처럼 사과할 일이 아닌 경우 고객용 사과 문장을 넣지 않습니다. */
  noApology?: boolean
}

const sameBatchCheck = (what: string) => ({ text: `동일 조리분 내 ${what} 여부 확인 예정임.`, sameBatch: true, topic: /동일 조리분|같은 시간/ })

const knowledge: Record<CategoryType, CategoryKnowledge> = {
  머리카락: {
    label: '머리카락 이물',
    clientLabel: '머리카락 이물',
    menuRelated: true,
    incident: '{m}에서 머리카락이 나왔다는 고객 제보 접수됨.',
    customerEmpathy: '제공해 드린 {t}에서 머리카락이 발견되어 많이 불쾌하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '조리·배식 직원의 위생모와 작업복 착용 상태, 배식 전 최종 확인 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 전 직원과 위생 기준을 다시 공유하겠습니다.',
    internalChecks: [
      { text: '조리·배식 인원의 위생모·작업복 착용 상태 확인 예정임.', topic: /위생모|작업복/ },
      { text: '배식 전 최종 확인 절차 이행 여부 확인 예정임.', topic: /최종 확인|배식 전/ },
      sameBatchCheck('추가 이물'),
      { text: '현물 보관 및 사진 확보 여부 확인 예정임.', topic: /현물|지퍼백|보관/ },
    ],
    causes: ['위생모·작업복 착용 미흡', '배식 전 최종 확인 누락', '식사 공간 등 외부 유입'],
    internalPrevention: [
      '배식 전 최종 확인 담당을 지정하고 점검을 강화하겠음.',
      '출근 시 위생모·작업복 착용 점검을 매일 기록하겠음.',
      '전 직원 대상 이물 관리 교육을 실시하겠음.',
    ],
    clientCheck: '원인 확인을 위해 위생모·작업복 착용 상태와 배식 전 최종 확인 절차, 동일 조리분 상태를 점검하겠습니다.',
    clientPrevention: '향후 위생모 착용 점검과 배식 전 최종 확인을 강화해 같은 사례를 예방하겠습니다.',
  },
  벌레: {
    label: '벌레 이물',
    clientLabel: '벌레 이물',
    menuRelated: true,
    incident: '{m}에서 벌레가 나왔다는 고객 제보 접수됨.',
    customerEmpathy: '제공해 드린 {t}에서 벌레가 발견되어 많이 놀라고 불쾌하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '채소 세척·선별 과정과 식재료 보관 상태를 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 식재료 입고부터 조리까지 확인을 강화하겠습니다.',
    internalChecks: [
      { text: '채소 세척·선별 과정과 잎 사이 확인 여부 점검 예정임.', topic: /세척|선별/ },
      { text: '식재료 보관 상태와 방충 관리 상태 점검 예정임.', topic: /보관 상태|방충/ },
      sameBatchCheck('추가 혼입'),
      { text: '현물 보관 및 사진 확보 여부 확인 예정임.', topic: /현물|지퍼백|보관/ },
    ],
    causes: ['채소 세척·선별 미흡', '식재료 보관 중 유입', '입고 원물 단계 혼입'],
    internalPrevention: [
      '잎채소 세척 기준(횟수·방법)을 재교육하겠음.',
      '식재료 보관 구역 방충 점검 주기를 강화하겠음.',
      '입고 검수 시 이물 확인을 강화하겠음.',
    ],
    clientCheck: '원인 확인을 위해 채소 세척·선별 과정과 잎 사이 확인 여부, 식재료 보관 상태 등 전처리 공정을 점검하겠습니다.',
    clientPrevention: '향후 잎채소류 세척·선별 기준을 재교육하고 전처리 단계 확인을 강화하겠습니다.',
  },
  '비닐/플라스틱': {
    label: '비닐·플라스틱 이물',
    clientLabel: '비닐·플라스틱 이물',
    menuRelated: true,
    incident: '{m}에서 비닐·플라스틱 이물이 나왔다는 고객 제보 접수됨.',
    customerEmpathy: '제공해 드린 {t}에서 비닐·플라스틱 같은 이물이 나와 많이 놀라셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '포장재 제거와 조리·담음 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 제공 전 최종 확인을 강화하겠습니다.',
    internalChecks: [
      { text: '포장재 제거 절차 이행 여부 확인 예정임.', topic: /포장재/ },
      { text: '전처리·조리·담음 공정 중 유입 지점 확인 예정임.' },
      sameBatchCheck('추가 이물'),
      { text: '현물 보관 및 사진 확보 여부 확인 예정임.', topic: /현물|지퍼백|보관/ },
    ],
    causes: ['포장재 제거 누락', '조리 도구·용기 파손 조각', '원재료 입고 단계 혼입'],
    internalPrevention: [
      '포장재 제거 후 확인 절차를 공정에 명시하겠음.',
      '제공 전 최종 확인을 강화하겠음.',
      '파손된 용기·도구는 즉시 교체하는 기준을 운영하겠음.',
    ],
    clientCheck: '원인 확인을 위해 포장재 제거 여부와 전처리 검수, 조리·담음 공정, 제공 전 최종 확인 절차를 점검하겠습니다.',
    clientPrevention: '향후 포장재 제거 후 확인 절차와 제공 전 최종 점검을 강화하겠습니다.',
  },
  '뼈/가시': {
    label: '뼈·가시 혼입',
    clientLabel: '뼈·가시 혼입',
    menuRelated: true,
    incident: '{m}에 뼈·가시가 남아 있었다는 고객 제보 접수됨.',
    customerEmpathy: '{t}에 뼈나 가시가 남아 있어 식사 중 많이 불편하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '원재료 손질 상태와 조리 후 확인 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 손질 기준과 조리 후 확인을 강화하겠습니다.',
    internalChecks: [
      { text: '원재료 규격(뼈·가시 제거 상태) 확인 예정임.', topic: /규격/ },
      { text: '전처리 선별과 조리 후 확인 절차 점검 예정임.' },
      sameBatchCheck('잔여 뼈·가시'),
    ],
    causes: ['원재료 규격 미달(뼈·가시 잔존)', '전처리 선별 미흡', '조리 후 확인 누락'],
    internalPrevention: [
      '원재료 규격서와 입고 검수 기준을 재확인하겠음.',
      '전처리 선별 기준을 재교육하겠음.',
      '필요 시 메뉴 안내 문구(뼈·가시 주의) 게시를 검토하겠음.',
    ],
    clientCheck: '원인 확인을 위해 원재료 규격과 전처리 선별, 조리 후 확인 절차를 점검하겠습니다.',
    clientPrevention: '향후 원재료 전처리 선별과 조리 후 확인을 강화하고, 필요 시 메뉴 안내 문구를 보완하겠습니다.',
  },
  '이물 혼입': {
    label: '이물 혼입',
    clientLabel: '이물 혼입',
    menuRelated: true,
    incident: '{m}에서 이물이 나왔다는 고객 제보 접수됨.',
    customerEmpathy: '제공해 드린 {t}에서 이물이 발견되어 많이 불쾌하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '이물이 들어갈 수 있는 조리·배식 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 공정별 확인을 강화하겠습니다.',
    internalChecks: [
      { text: '이물의 종류·크기 확인 및 현물 보관 예정임.', topic: /(이물|현물|지퍼백).{0,8}(보관|확보|보존)|지퍼백/ },
      { text: '유입 가능 공정(입고·전처리·조리·배식) 점검 예정임.' },
      sameBatchCheck('추가 이물'),
    ],
    causes: ['조리 도구·설비 파손', '원재료 입고 단계 혼입', '전처리 선별 미흡'],
    internalPrevention: [
      '공정별 이물 점검 항목을 보완하겠음.',
      '조리 도구·설비 파손 점검 주기를 운영하겠음.',
      '입고 검수 시 이물 확인을 강화하겠음.',
    ],
    clientCheck: '원인 확인을 위해 이물의 성상과 유입 가능 공정, 동일 조리분 상태를 확인하겠습니다.',
    clientPrevention: '향후 공정별 이물 점검과 제공 전 최종 확인을 강화하겠습니다.',
  },
  품질: {
    label: '음식 품질',
    clientLabel: '음식 품질',
    menuRelated: true,
    incident: '{m}의 맛·상태가 좋지 않다는 고객 의견 접수됨.',
    customerEmpathy: '{t}의 맛과 상태가 기대에 미치지 못해 식사가 만족스럽지 않으셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '해당 메뉴의 조리 기준과 제공 상태를 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 조리 기준 준수를 더 꼼꼼히 확인하겠습니다.',
    internalChecks: [
      { text: '표준 레시피 준수 여부 확인 예정임.', topic: /레시피/ },
      { text: '조리 후 보관 시간과 배식 온도 확인 예정임.', topic: /보관 시간|배식 온도/ },
      { text: '식재료 입고 상태 확인 예정임.' },
    ],
    causes: ['레시피 미준수', '조리 후 장시간 보관', '식재료 품질 편차'],
    internalPrevention: [
      '표준 레시피 준수 점검을 강화하겠음.',
      '조리 후 보관 시간 기준을 재교육하겠음.',
      '제공 전 시식 확인을 강화하겠음.',
    ],
    clientCheck: '원인 확인을 위해 해당 메뉴의 조리 기준 준수 여부와 제공 상태를 점검하겠습니다.',
    clientPrevention: '향후 조리 기준 준수 여부와 제공 전 품질 확인을 강화하겠습니다.',
  },
  염도: {
    label: '염도(간)',
    clientLabel: '염도(간)',
    menuRelated: true,
    incident: '{m}의 간이 맞지 않다는 고객 의견 접수됨.',
    customerEmpathy: '{t}의 간이 맞지 않아 식사가 불편하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '표준 레시피와 조리 중 간 확인 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 메뉴별 간 기준을 조리 담당자와 다시 맞추겠습니다.',
    internalChecks: [
      { text: '표준 레시피 대비 양념 투입량 확인 예정임.', topic: /레시피|양념/ },
      { text: '조리 중간 간 확인 기록 확인 예정임.', topic: /간 확인|염도/ },
      { text: '배식 중 보온에 따른 농도 변화 확인 예정임.' },
    ],
    causes: ['양념 계량 편차', '보온 중 수분 증발에 따른 농축', '개인 기호 차이'],
    internalPrevention: [
      '양념 계량 기준을 재교육하겠음.',
      '조리 중간 염도를 측정하고 기록하겠음.',
      '장시간 보온 메뉴의 농도 변화를 점검하겠음.',
    ],
    clientCheck: '원인 확인을 위해 표준 레시피와 기준 염도, 조리 중간 점검 기록, 국물·소스의 편차를 점검하겠습니다.',
    clientPrevention: '향후 표준 레시피 준수와 조리 중간 염도 점검을 강화하겠습니다.',
  },
  품절: {
    label: '조기 품절',
    clientLabel: '조기 품절',
    menuRelated: true,
    incident: '{m:이/가} 이용 시간 중 조기 소진되어 고객 불편 의견 접수됨.',
    customerEmpathy: '찾으신 {t:이/가} 일찍 소진되어 원하시는 식사를 하지 못하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '시간대별 준비 수량과 소진 시 안내 방법을 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 이용 현황을 반영해 준비 수량을 조정하겠습니다.',
    internalChecks: [
      { text: '예상 식수 대비 실제 이용 인원 확인 예정임.', topic: /식수|이용 인원/ },
      { text: '시간대별 준비량과 소진 시각 확인 예정임.', topic: /소진|준비량/ },
      { text: '추가 조리·대체 메뉴 준비 가능 여부 확인 예정임.' },
    ],
    causes: ['식수 예측 편차', '특정 메뉴 선호 집중', '추가 조리 판단 지연'],
    internalPrevention: [
      '이용 현황을 반영해 차수별 준비량을 조정하겠음.',
      '소진 예상 시 추가 조리·대체 메뉴 안내 기준을 정비하겠음.',
      '메뉴별 소진 시각을 기록하겠음.',
    ],
    clientCheck: '원인 확인을 위해 예상 식수와 실제 이용 인원, 시간대별 준비량을 비교하겠습니다.',
    clientPrevention: '향후 이용 데이터를 반영해 차수별 준비량을 조정하고, 소진 시 추가 조리·대체 메뉴 기준을 보완하겠습니다.',
  },
  '양 부족': {
    label: '제공량 부족',
    clientLabel: '제공량 부족',
    menuRelated: true,
    incident: '{m}의 제공량이 적다는 고객 의견 접수됨.',
    customerEmpathy: '{t}의 제공량이 충분하지 않아 식사가 부족하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '기준 제공량과 배식 방법을 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 배식 기준량을 지키도록 관리하겠습니다.',
    internalChecks: [
      { text: '기준 제공량과 실제 배식량 비교 예정임.', topic: /배식량|제공량/ },
      { text: '배식 도구 사용 여부와 담당자별 편차 확인 예정임.', topic: /배식 도구|국자|스쿱/ },
      { text: '추가 배식 안내 여부 확인 예정임.' },
    ],
    causes: ['배식 도구 미사용', '담당자별 배식 편차', '기준 제공량 설정 부족'],
    internalPrevention: [
      '배식 도구 사용과 기준 제공량 준수를 교육하겠음.',
      '배식 중 제공량을 수시로 점검하겠음.',
      '추가 배식 안내 기준을 정비하겠음.',
    ],
    clientCheck: '원인 확인을 위해 기준 제공량과 실제 배식량, 배식 담당자별 편차를 확인하겠습니다.',
    clientPrevention: '향후 기준 제공량에 맞춘 배식 도구 사용과 배식 편차 점검을 강화하겠습니다.',
  },
  '위생 불만': {
    label: '위생 상태',
    clientLabel: '위생 상태',
    menuRelated: false,
    incident: '식당 위생 상태에 대한 고객 불편 의견 접수됨.',
    customerEmpathy: '식당의 위생 상태로 식사 중 불쾌하셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck: '말씀해 주신 부분의 청결 상태와 점검 주기를 다시 확인하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 식사 시간 중 청결 점검을 강화하겠습니다.',
    internalChecks: [
      { text: '지적된 구역의 청결 상태 확인 예정임.', topic: /청결|청소/ },
      { text: '청소·점검 주기 준수 기록 확인 예정임.' },
      { text: '식기·집기 세척 상태 확인 예정임.' },
    ],
    causes: ['청소 주기 미준수', '식사 시간 중 정리 인력 부족', '세척 공정 미흡'],
    internalPrevention: [
      '식사 시간 중 청결 점검 주기를 단축하겠음.',
      '청소 점검표를 기록·관리하겠음.',
      '식기·집기 세척 상태 점검을 강화하겠음.',
    ],
    clientCheck: '지적해 주신 구역의 청결 상태와 점검 주기 준수 여부를 확인하겠습니다.',
    clientPrevention: '향후 식사 시간대 청결 점검 주기를 보완하고 점검 기록을 관리하겠습니다.',
  },
  '직원 응대': {
    label: '직원 응대',
    clientLabel: '직원 응대',
    menuRelated: false,
    incident: '직원 응대에 대한 고객 불편 의견 접수됨.',
    customerEmpathy: '직원 응대 과정에서 많이 불쾌하셨을 것 같습니다.',
    apologyScope: '식당 이용',
    customerCheck: '당시 상황을 확인하고 응대 방법을 다시 점검하겠습니다.',
    customerPrevention: '같은 일이 반복되지 않도록 직원 응대 교육을 다시 진행하겠습니다.',
    internalChecks: [
      { text: '당시 응대 상황과 관련 직원 진술 확인 예정임.', topic: /진술|당시 상황|경위/ },
      { text: '응대 기준 숙지 여부 확인 예정임.' },
      { text: '유사 의견 발생 이력 확인 예정임.' },
    ],
    causes: ['응대 기준 미숙지', '혼잡 시간대 업무 부담', '의사소통 오해'],
    internalPrevention: [
      '고객 응대 기준을 재교육하겠음.',
      '혼잡 시간대 인력 배치를 점검하겠음.',
      '응대 사례를 공유하고 모니터링하겠음.',
    ],
    clientCheck: '당시 응대 상황과 안내 내용을 확인하고, 고객님의 의견을 바탕으로 응대 방식을 점검하겠습니다.',
    clientPrevention: '향후 고객 응대 교육을 실시하고 현장 관리를 강화하겠습니다.',
  },
  '시설·비품': {
    label: '시설·비품',
    clientLabel: '시설·비품 이용 불편',
    menuRelated: false,
    incident: '"{kw}" 관련 시설·비품 불편 의견 접수됨.',
    customerEmpathy: '식당 시설·비품을 이용하시면서 번거로우셨을 것 같습니다.',
    apologyScope: '식당 이용',
    customerCheck: '해당 시설·비품 상태를 확인하고 보충·정비 기준을 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 식사 전후 시설·비품 점검을 강화하겠습니다.',
    internalChecks: [
      { text: '해당 시설·비품 상태 확인 예정임.', topic: /보충|비품|시설/ },
      { text: '보충·점검 주기 준수 여부 확인 예정임.' },
    ],
    causes: ['보충 주기 미준수', '시설 노후·고장', '이용 인원 대비 비품 부족'],
    internalPrevention: [
      '식사 전후 시설·비품 점검표를 운영하겠음.',
      '비품 보충 주기를 조정하겠음.',
      '고장 시설은 수리를 요청하고 결과를 확인하겠음.',
    ],
    clientCheck: '말씀해 주신 시설·비품 상태와 보충·점검 주기 준수 여부를 확인하겠습니다.',
    clientPrevention: '향후 식사 전후 시설·비품 점검을 강화하고 필요한 보수·보충을 진행하겠습니다.',
  },
  '식중독 의심': {
    label: '식사 후 이상 증상(식중독 의심)',
    clientLabel: '식사 후 이상 증상',
    menuRelated: true,
    incident: '{m} 섭취 후 이상 증상이 있다는 고객 제보 접수됨(긴급 확인 대상).',
    customerEmpathy: '식사 후 몸이 불편하셨다는 말씀을 듣고 걱정이 큽니다.',
    apologyScope: '식사',
    customerCheck:
      '무엇보다 고객님의 건강 상태가 가장 중요합니다. 증상이 계속되시면 의료기관 진료를 받으시길 권해 드리며, 필요하신 사항은 말씀해 주시면 도와드리겠습니다.',
    customerPrevention: '섭취하신 메뉴와 관련 기록을 확인하고 관련 기준에 따라 신속히 조치하겠으며, 확인되는 내용은 안내드리겠습니다.',
    internalChecks: [
      { text: '고객 증상·발생 시각·섭취 메뉴 확인 필요함(원인 단정 금지).' },
      { text: '보존식 확보 및 보관 상태 확인 필요함.', topic: /보존식/ },
      { text: '동일 메뉴 섭취자 중 유사 증상 여부 확인 필요함.' },
      { text: '조리·보관 온도 기록 확인 필요함.' },
    ],
    causes: [],
    internalPrevention: ['확인 결과에 따라 개선 조치를 수립하겠음.', '보관·조리 온도 관리 기록 점검을 강화하겠음.'],
    clientCheck:
      '동일 메뉴 섭취자 중 유사 증상 발생 여부와 보관·조리 온도 기록을 확인하겠으며, 원인은 확인 결과에 따라 판단하겠습니다.',
    clientPrevention: '확인 결과에 따라 필요한 개선 조치를 마련하고, 관련 지침에 따른 후속 절차를 이행하겠습니다.',
  },
  안전사고: {
    label: '안전사고 / 치아 불편',
    clientLabel: '식사 중 치아 불편',
    menuRelated: true,
    incident: '{m} 식사 중 딱딱한 물질을 씹어 치아 불편을 호소한 고객 제보 접수됨(긴급 확인 대상).',
    customerEmpathy: '식사 중 딱딱한 물질로 치아에 불편을 겪으셨다는 말씀을 듣고 많이 놀라셨을 것 같습니다.',
    apologyScope: '식사',
    customerCheck:
      '무엇보다 고객님의 상태가 가장 중요합니다. 통증이 있으시면 바로 말씀해 주시고, 진료 안내 등 필요한 사항을 도와드리겠습니다.',
    customerPrevention: '해당 메뉴의 원재료와 조리·배식 과정을 확인하겠으며, 확인되는 내용은 신속히 안내드리겠습니다.',
    internalChecks: [
      { text: '고객 상태 확인 및 필요 시 진료 안내 필요함.' },
      { text: '현물(이물)·잔식 보존 및 원재료 규격 확인 필요함.', topic: /(현물|이물|잔식|지퍼백).{0,8}(보존|보관|확보)|지퍼백/ },
      { text: '전처리 선별·조리·배식 과정 점검 예정임.' },
    ],
    causes: [],
    internalPrevention: ['확인 결과에 따라 원재료 선별·최종 검수 절차를 보완하겠음.', '고위험 메뉴(잡곡·견과·뼈 있는 메뉴) 사전 점검 항목 추가를 검토하겠음.'],
    clientCheck: '원재료 특성과 전처리 선별, 조리·배식 과정을 점검하겠으며, 확인 전까지 원인을 단정하지 않겠습니다.',
    clientPrevention: '확인 결과에 따라 원재료 선별과 배식 전 최종 검수 절차를 보완하겠습니다.',
  },
  기타: {
    label: '기타 이용 불편',
    clientLabel: '이용 불편',
    menuRelated: true,
    incident: '"{kw}" 관련 고객 의견 접수됨.',
    customerEmpathy: '식당을 이용하시면서 번거로우셨을 것 같습니다.',
    apologyScope: '식당 이용',
    customerCheck: '접수해 주신 내용을 확인하고 관련 운영 과정을 다시 점검하겠습니다.',
    customerPrevention: '같은 불편이 반복되지 않도록 관련 기준을 보완하겠습니다.',
    internalChecks: [{ text: '접수 내용의 사실관계 확인 예정임.' }, { text: '관련 운영 기준 확인 예정임.' }],
    causes: ['운영 기준 미비', '이용 안내 부족'],
    internalPrevention: ['관련 운영 기준을 보완하겠음.', '유사 의견 발생 여부를 모니터링하겠음.'],
    clientCheck: '접수 내용의 사실관계를 확인하고 관련 운영 과정을 점검하겠습니다.',
    clientPrevention: '확인 결과에 따라 필요한 개선 조치를 마련하겠습니다.',
  },
}

/** 덜 익음 등 조리 상태 불량: 품질 유형의 세부 갈래 */
const cookingQuality: Partial<CategoryKnowledge> = {
  label: '품질 / 조리 상태 불량',
  clientLabel: '조리 상태 불량',
  incident: '{m}의 조리 상태(익힘)가 충분하지 않다는 고객 의견 접수됨.',
  customerEmpathy: '{t}의 조리 상태가 충분하지 않아 식사가 만족스럽지 않으셨을 것 같습니다.',
  customerCheck: '해당 메뉴의 가열 시간과 조리 온도, 배식 전 익힘 상태 확인 과정을 다시 점검하겠습니다.',
  customerPrevention: '같은 불편이 반복되지 않도록 메뉴별 가열 기준을 다시 교육하고 제공 전 확인을 강화하겠습니다.',
  internalChecks: [
    { text: '가열 시간·조리 온도 기록 확인 예정임.', topic: /가열|조리 온도/ },
    { text: '동일 조리분의 중심부 익힘 상태 확인 예정임.', sameBatch: true, topic: /중심|익힘/ },
    { text: '조리 담당자의 가열 기준 숙지 여부 확인 예정임.' },
  ],
  causes: ['가열 시간 부족', '대량 조리 시 열 전달 편차', '조리 후 익힘 확인 누락'],
  internalPrevention: [
    '메뉴별 가열 시간·중심 온도 기준을 재교육하겠음.',
    '제공 전 익힘 상태 확인을 강화하겠음.',
    '대량 조리 시 분할 조리 기준을 검토하겠음.',
  ],
  clientCheck: '원인 확인을 위해 해당 메뉴의 가열 시간과 조리 온도, 중심부 조리 상태, 동일 조리분 상태를 점검하겠습니다.',
  clientPrevention: '향후 메뉴별 가열 시간과 조리 온도 기준을 재교육하고, 제공 전 조리 상태 확인을 강화하겠습니다.',
}

/** 상했거나 유통기한이 지난 음식: 품질의 세부 갈래(중대 기준) */
const spoiledQuality: Partial<CategoryKnowledge> = {
  label: '품질 / 변질·유통기한 경과 의심',
  clientLabel: '변질·유통기한 경과 의심',
  incident: '{m}의 변질 또는 유통기한 경과가 의심된다는 고객 제보 접수됨(긴급 확인 대상).',
  customerEmpathy: '{t}의 상태가 좋지 않아 많이 놀라셨을 것 같습니다.',
  customerCheck:
    '드신 뒤 몸이 불편하시면 바로 말씀해 주십시오. 해당 제품의 유통기한과 보관 상태, 같은 날 들어온 제품을 바로 확인하겠습니다.',
  customerPrevention: '확인 결과에 따라 입고 검수와 보관 기준을 다시 점검하겠으며, 확인되는 내용은 신속히 안내드리겠습니다.',
  internalChecks: [
    { text: '해당 제품 회수·보관 및 유통기한·제조번호 확인 필요함.', topic: /유통기한|제조번호|회수|보관/ },
    { text: '고객 건강 이상 여부 확인 필요함.' },
    { text: '동일 입고분의 유통기한·보관 상태 확인 예정임.', sameBatch: true, topic: /입고분|동일/ },
    { text: '냉장·냉동 보관 온도 기록 확인 예정임.', topic: /온도/ },
  ],
  causes: [],
  internalPrevention: ['입고 검수 시 유통기한 확인을 강화하겠음.', '선입선출과 보관 온도 점검을 강화하겠음.'],
  clientCheck: '해당 제품의 유통기한과 제조번호, 동일 입고분, 보관 온도 기록을 확인하겠으며, 확인 전까지 원인을 단정하지 않겠습니다.',
  clientPrevention: '확인 결과에 따라 입고 검수와 선입선출, 보관 온도 관리를 강화하겠습니다.',
}

/** 유통기한·보관 상태를 확인해 달라는 문의: 불만이나 변질을 단정하지 않습니다. */
const storageInquiry: Partial<CategoryKnowledge> = {
  label: '품질 / 유통기한·보관 상태 문의',
  clientLabel: '유통기한·보관 상태 문의',
  incident: '{m}의 유통기한·보관 상태 확인 요청 접수됨.',
  customerEmpathy: '{t}의 유통기한과 보관 상태를 문의해 주셔서 감사합니다.',
  customerCheck: '해당 제품의 유통기한과 보관 상태를 바로 확인해 안내드리겠습니다.',
  customerPrevention: '앞으로도 입고 검수와 보관 관리를 꼼꼼히 하겠습니다.',
  internalChecks: [
    { text: '해당 제품의 유통기한·제조번호 확인 예정임.', topic: /유통기한|제조번호/ },
    { text: '보관 온도 기록 확인 예정임.', topic: /온도/ },
    { text: '확인 결과 고객 안내 필요함.' },
  ],
  causes: [],
  internalPrevention: ['입고 검수 시 유통기한 확인을 유지하겠음.'],
  clientCheck: '해당 제품의 유통기한과 보관 상태를 확인해 고객에게 안내하겠습니다.',
  clientPrevention: '입고 검수와 보관 관리를 계속 점검하겠습니다.',
  noApology: true,
}

/** 알레르기 유발 성분·원재료를 묻는 문의: 증상이 있었다고 쓰지 않습니다. */
const allergyInquiry: Partial<CategoryKnowledge> = {
  label: '알레르기·원재료 문의',
  clientLabel: '알레르기·원재료 문의',
  incident: '{m}의 알레르기 유발 성분·원재료 문의 접수됨.',
  customerEmpathy: '{t}의 알레르기 유발 성분에 대해 말씀해 주셔서 감사합니다.',
  customerCheck: '해당 메뉴의 원재료와 알레르기 유발 성분을 확인해 안내드리고, 표시가 필요한 부분은 보완하겠습니다. 식사 후 불편한 증상이 있으시면 바로 말씀해 주십시오.',
  customerPrevention: '앞으로도 메뉴별 알레르기 유발 성분 표시를 꼼꼼히 하겠습니다.',
  internalChecks: [
    { text: '해당 메뉴의 원재료·알레르기 유발 성분 확인 예정임.', topic: /원재료|성분/ },
    { text: '확인 결과 고객 안내 필요함.' },
  ],
  causes: [],
  internalPrevention: ['메뉴별 알레르기 유발 성분 표시를 점검하겠음.'],
  clientCheck: '해당 메뉴의 원재료와 알레르기 유발 성분을 확인해 고객에게 안내하겠습니다.',
  clientPrevention: '메뉴별 알레르기 유발 성분 표시를 계속 점검하겠습니다.',
  noApology: true,
}

/** 알레르기 표시·안내가 부족하다는 불만: 증상이 있었다고 쓰지 않고, 표시 누락을 사과합니다. */
const allergyLabelComplaint: Partial<CategoryKnowledge> = {
  label: '알레르기 표시·안내 불만',
  clientLabel: '알레르기 표시·안내 부족',
  incident: '{m}의 알레르기 유발 성분 표시·안내가 부족하다는 고객 의견 접수됨.',
  customerEmpathy: '{t}의 알레르기 유발 성분 안내가 부족해 식사에 어려움이 있으셨을 것 같습니다.',
  apologyScope: '식사',
  customerCheck: '해당 메뉴의 원재료와 알레르기 유발 성분을 확인해 안내드리고, 표시가 빠진 부분은 바로 보완하겠습니다.',
  customerPrevention: '메뉴별 알레르기 유발 성분 표시를 다시 점검하겠습니다. 혹시 식사 후 불편한 증상이 있으시면 바로 말씀해 주십시오.',
  internalChecks: [
    { text: '해당 메뉴의 원재료·알레르기 유발 성분 확인 예정임.', topic: /원재료|성분/ },
    { text: '배식대 알레르기 표시 상태 확인 예정임.', topic: /표시/ },
    { text: '고객 증상 여부 확인 필요함.' },
  ],
  causes: ['알레르기 표시 누락', '메뉴 변경 후 표시 미갱신'],
  internalPrevention: ['메뉴별 알레르기 유발 성분 표시를 점검하겠음.', '메뉴가 바뀌면 표시도 함께 갱신하겠음.'],
  clientCheck: '해당 메뉴의 원재료와 배식대 알레르기 표시 상태를 확인하겠습니다.',
  clientPrevention: '메뉴별 알레르기 유발 성분 표시 점검을 강화하겠습니다.',
}

/** 알레르기 유발 식품 이름(성분 문의 판단용) */
const allergenNames = /(땅콩|새우|게살|우유|계란|달걀|밀가루|대두|견과|호두|잣|조개|굴|홍합|복숭아|토마토|메밀|고등어|오징어|돼지고기|쇠고기|소고기|닭고기)/

/** 불만 없이 묻기만 한 문의(원산지·운영 시간 등): 불편·사과 문장을 쓰지 않습니다. */
const generalInquiry: Partial<CategoryKnowledge> = {
  label: '고객 문의',
  clientLabel: '고객 문의',
  menuRelated: false,
  incident: '"{kw}" 관련 고객 문의·요청 접수됨.',
  customerEmpathy: '말씀해 주셔서 감사합니다.',
  customerCheck: '말씀하신 내용을 확인해 안내드리겠습니다.',
  customerPrevention: '앞으로도 궁금하신 점은 언제든 말씀해 주십시오.',
  internalChecks: [{ text: '문의 내용 확인 예정임.' }, { text: '확인 결과 고객 안내 필요함.' }],
  causes: [],
  internalPrevention: ['자주 받는 문의는 안내문에 반영하겠음.'],
  clientCheck: '문의 내용을 확인해 고객에게 안내하겠습니다.',
  clientPrevention: '자주 받는 문의는 안내문에 반영하겠습니다.',
  noApology: true,
}

/** 화상·베임·넘어짐 등 부상: 안전사고의 세부 갈래 */
const injurySafety: Partial<CategoryKnowledge> = {
  label: '안전사고 / 부상',
  clientLabel: '식당 이용 중 부상',
  menuRelated: false,
  incident: '식당 이용 중 고객이 다쳤다는 제보 접수됨(긴급 확인 대상).',
  customerEmpathy: '식당 이용 중 다치셨다는 말씀을 듣고 많이 놀라셨을 것 같습니다.',
  apologyScope: '식당 이용',
  customerCheck:
    '무엇보다 고객님의 상태가 가장 중요합니다. 통증이 있으시면 바로 말씀해 주시고, 진료 안내 등 필요한 사항을 도와드리겠습니다.',
  customerPrevention: '사고가 난 장소와 경위를 확인해 위험 요소를 정비하겠으며, 확인되는 내용은 신속히 안내드리겠습니다.',
  internalChecks: [
    { text: '고객 상태 확인 및 필요 시 의료기관 안내 필요함.' },
    { text: '사고 장소·경위 확인 및 위험 요소 즉시 조치 필요함.' },
    { text: '관련 시설·동선 점검 예정임.' },
  ],
  internalPrevention: ['위험 요소 점검 및 안전 표지를 보완하겠음.', '확인 결과에 따라 시설 개선을 요청하겠음.'],
  clientCheck: '사고 장소와 경위, 관련 시설 상태를 확인하겠으며, 확인 전까지 원인을 단정하지 않겠습니다.',
  clientPrevention: '확인 결과에 따라 위험 요소를 정비하고 안전 관리를 강화하겠습니다.',
}

const injuryKeywords = /(화상|데었|데였|데임|베었|베임|베였|찔림|찔렸|미끄러(졌|짐|져)|넘어(졌|짐|져)|다쳤|다침)/
/** 치아 사고로 볼 단어. '돌솥'의 '돌'처럼 다른 낱말 속 글자는 빼도록 좁혀 둡니다. */
const dentalKeywords = /(치아|이빨|이가\s?(깨|부러|빠|아프)|파절|돌(을|이)?\s?씹|돌조각|돌멩이|딱딱한\s?(물질|이물|것))/
const allergyKeywords = /(알레르기|알러지|두드러기|가려|간지|발진|부었|부어|붓|따끔|빨갛|빨개|숨\s?(이|을)?\s?(차|막|가빠|쉬기|못\s?쉬)|호흡)/

/** 알레르기 의심: 식사 후 이상 증상의 세부 갈래 */
const allergySymptom: Partial<CategoryKnowledge> = {
  label: '식사 후 이상 증상(알레르기 의심)',
  clientLabel: '식사 후 알레르기 의심 증상',
  incident: '{m} 섭취 후 알레르기 의심 증상이 있다는 고객 제보 접수됨(긴급 확인 대상).',
  customerEmpathy: '식사 후 알레르기 증상이 나타나셨다는 말씀을 듣고 걱정이 큽니다.',
  customerPrevention: '드신 메뉴의 원재료와 알레르기 유발 식품 표시를 확인하겠으며, 확인되는 내용은 신속히 안내드리겠습니다.',
  internalChecks: [
    { text: '고객 증상·발생 시각·섭취 메뉴 확인 및 필요 시 진료 안내 필요함(원인 단정 금지).' },
    { text: '섭취 메뉴의 원재료·알레르기 유발 식품 표시 여부 확인 필요함.' },
    { text: '식재료 규격서상 알레르기 유발 성분 확인 필요함.' },
  ],
  internalPrevention: ['알레르기 유발 식품 표시 점검을 강화하겠음.', '확인 결과에 따라 메뉴 안내 문구를 보완하겠음.'],
  clientCheck: '섭취 메뉴의 원재료와 알레르기 유발 식품 표시 여부를 확인하겠으며, 원인은 확인 결과에 따라 판단하겠습니다.',
  clientPrevention: '확인 결과에 따라 알레르기 유발 식품 표시와 메뉴 안내를 보완하겠습니다.',
}

/** 고위험 유형의 필수 조치. 관련 조치를 이미 했으면 생략합니다. */
const highRiskRequired: Partial<Record<CategoryType, Array<{ text: string; doneWhen?: DoneAction }>>> = {
  안전사고: [
    { text: '현물 사진 기록 필요함.', doneWhen: '사진 기록' },
  ],
}

/** 부상 건의 필수 조치 */
const injuryRequired: Array<{ text: string; doneWhen?: DoneAction }> = [
  { text: '사고 장소·부상 부위 사진 기록 필요함.', doneWhen: '사진 기록' },
]



// ───────────────────────── 조치·반응 문장 ─────────────────────────

/** 사내용 완료 조치(음슴체). 체크한 조치에서만 씁니다. */
const internalDoneLine: Record<DoneAction, string> = {
  '고객 응대': '고객 응대 완료함.',
  '음식 교체': '해당 음식 교체 제공 완료함.',
  '메뉴 회수': '해당 메뉴 회수 완료함.',
  '동일 조리분 확인': '동일 조리분 확인 완료함.',
  '사진 기록': '현물 사진 기록 완료함.',
  '고객사 보고': '고객사 1차 보고 완료함.',
}

/** 고객사용 완료 조치 명사 */
const clientDoneNoun: Record<DoneAction, string> = {
  '고객 응대': '고객 응대',
  '음식 교체': '음식 교체',
  '메뉴 회수': '해당 메뉴 회수',
  '동일 조리분 확인': '동일 조리분 확인',
  '사진 기록': '현물 사진 기록',
  '고객사 보고': '고객사 1차 보고',
}

const internalReactionLine: Record<CustomerReaction, string> = {
  '괜찮다고 함': '응대 후 고객은 괜찮다는 의사를 밝힘.',
  '불쾌감 표현': '고객이 불쾌감을 표현함.',
  '연락처 남김': '고객이 후속 안내를 위해 연락처를 남김.',
  '보상 요청': '고객이 보상을 요청함.',
  '고객사 공유 필요': '고객사 공유가 필요한 건으로 판단됨.',
  미확인: '고객 반응 미확인, 추가 확인 필요함.',
}

// ───────────────────────── 공통 처리 ─────────────────────────

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function sanitize(value: string) {
  return value
    .replace(/\.{3,}|…/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function formatOccurredAt(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const hour = parsed.getHours()
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  const ampm = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${parsed.getFullYear()}. ${parsed.getMonth() + 1}. ${parsed.getDate()}.(${weekdays[parsed.getDay()]}) ${ampm} ${displayHour}:${minute}`
}

function formatRestaurantName(siteName: string) {
  const trimmed = cleanText(siteName)
  if (!trimmed) return '사업장'
  if (/(식당|카페|라운지|키친|다이닝|푸드코트|레스토랑|구내식당)$/.test(trimmed)) return trimmed
  return `${trimmed} 식당`
}

function formatContactTitle(name: string) {
  const trimmed = cleanText(name)
  if (!trimmed) return '담당자님'
  if (trimmed.endsWith('님')) return trimmed
  if (/(과장|대리|팀장|부장|차장|실장|주임|사원|책임|선임|수석|매니저|이사|대표|소장|파트장|본부장|센터장)$/.test(trimmed)) return `${trimmed}님`
  return `${trimmed} 님`
}

function fill(template: string, values: { m: string; t: string; kw: string }) {
  return template
    .replace(/\{(m|t):([^/}]+)\/([^}]+)\}/g, (_, key: 'm' | 't', a: string, b: string) => attachJosa(values[key], `${a}/${b}`))
    .replace(/\{m\}/g, values.m)
    .replace(/\{t\}/g, values.t)
    .replace(/\{kw\}/g, values.kw)
}

// ───────────────────────── 입력 분석 ─────────────────────────

export interface ReportAnalysis {
  /** 최종 적용 유형 */
  category: CategoryType
  /** 자동 판정 유형 */
  detected: CategoryType
  /** 판정에 쓰인 단어 */
  evidence: string[]
  /** 판정 근거를 메모에서 찾았는지 */
  evidenceFromMemo: boolean
  /** 함께 걸린 다른 유형 */
  alternatives: CategoryType[]
  /** 사용자가 직접 고른 유형인지 */
  isOverridden: boolean
  /** 유사 사례 유형으로 보충했는지 */
  fromCase: boolean
  isCookingQuality: boolean
  isInjury: boolean
  isAllergy: boolean
  isHighRisk: boolean
  /** 상했거나 유통기한이 지난 음식 */
  isSpoiled: boolean
  /** 유통기한·보관 상태 확인 문의(불만·변질로 단정하지 않음) */
  isStorageInquiry: boolean
  /** 알레르기 유발 성분·원재료 문의(증상 없음) */
  isAllergyInquiry: boolean
  /** 알레르기 표시·안내 불만(증상 없음) */
  isAllergyLabelComplaint: boolean
  /** 유형 없는 순수 문의 */
  isGeneralInquiry: boolean
  /** 먹은 맥락 없는 건강 이상(쓰러짐 등) */
  isHealthEvent: boolean
  label: string
}

/** 삼키거나 씹으면 다칠 수 있는 이물: 이물 혼입이어도 중대 기준으로 보고합니다. */
const hazardousForeign = /(유리(?!\s?(컵|창|문|병))|철사|쇳조각|금속|쇠붙이|철수세미|스테이플|호치키스|볼트|너트|나사|칼날|(^|\s)못(이|이나|\s?조각))/
/** 상하거나 기한이 지난 음식: 품질이어도 식중독 위험이 있어 중대 기준으로 보고합니다. */
const spoiledFood = /(유통기한|소비기한|기한(이)?\s?지난|곰팡|상했|상한|변질|쉰내|쉬었|쉰\s?(것|거|맛|듯|김치|밥|국|반찬|우유|나물|떡|빵|김밥|도시락|음식|요구르트)|쉬어)/
/** 확인을 부탁하는 문의는 실제 변질 제보가 아니므로 중대로 올리지 않습니다('유통기한 확인 요청'). */
const inquiryOnly = /(요청|문의|궁금|알려\s?주|확인\s?(부탁|해\s?주)|있나요|있을까요|되나요|추가해\s?주|바꿔\s?주)/
/** 실제로 겪은 일을 말하는 표현. '상했는지 확인해 주세요'처럼 묻는 말(~는지·~인지) 안의 단어는 빼고 봅니다. */
const observedFact = /(마셨|먹었|먹은|먹고|먹다|드셨|드시고|핀|피었|폈|났|지난|지났|상한|상했|시큼|쉰|쉬었|변질|냄새)/
/**
 * 안전망: 단어 목록을 하나씩 늘리는 대신 구조로 막습니다.
 * - 의료·응급 표현이 있으면 유형과 상관없이 중대로 봅니다.
 * - 먹은 뒤(완료형) 몸·증상 표현이 이어지는데 유형이 정해지지 않았으면 '식사 후 이상 증상'으로 봅니다.
 */
const medicalTerms = /(응급실\s?(에|으로|을)?\s?(갔|가서|실려|이송|다녀|왔)|병원\s?(에|으로|을)?\s?(갔|가서|실려|이송|다녀왔)|119\s?(를|에)?\s?(불렀|불러|신고|와서|출동)|구급차|의식\s?(을|이)?\s?(잃|없)|기절했|기절해서|기절함|기절하셨|쓰러졌|쓰러져서|쓰러짐|쓰러지셨|쓰러지셔서|실신했|실신해서|실신하셨|실려\s?갔|입원했|입원해서|입원함|진료\s?(를)?\s?받았|약\s?(을)?\s?(처방\s?받|먹었))/
const eatenThen = /(?<eat>먹고|먹은\s?(?:뒤|후|다음)|먹은\s?뒤로|먹었더니|먹었는데|먹다가|마시고|마신\s?(?:뒤|후)|마셨더니|드시고|드신\s?(?:뒤|후)|식사\s?(?:후|하고|하다가|하다|중)|(?:아침|점심|저녁|야식)\s?(?:후|먹고|먹은\s?후))\S*\s?(?<rest>.*)/
const bodySymptom = /(기침|쌕쌕|간질|목이(?!\s?(마르|말라|말랐))|목에|목구멍|숨|호흡|피부|가슴|심장|두근|열이|열나|오한|배가\s?(아|쓰|살살|꾸르|불편|뒤틀)|배\s?(아|통)|복통|속이|머리가\s?(아|어지)|두통|어지|토했|토할|구토|설사|화장실\s?(을|에)?\s?(계속|자주|여러)|(계속|자주|여러\s?번)\s?화장실|두드러기|두드러|뭐가\s?(났|돋)|가려|부었|붓|빨개|빨갛|따끔|얼얼|헐었|헐어|입안이\s?(헐|따끔|부|간지|얼얼)|충혈|눈이\s?(빨|부|가려|충혈)|저려|저림|마비|떨려|식은땀|몸이)/

/** 의료 사건처럼 보여도 사람 일이 아니거나(의자가 쓰러짐) 훈련·문의·축하 맥락이면 중대로 올리지 않습니다. */
const medicalExclude = /(훈련|교육|추천|문의|축하|복귀|일정|의자|화분|배식대|간판|입간판|테이블|선반|쓰레기통|우산|자전거|물건|박스|상자)/
/** 맛 표현: '얼얼할 정도로 매워요', '입안이 개운해요'는 증상이 아님 */
const tasteContext = /(매워|맵|매운|짜|짭|개운|시원|상큼|맛있|고소)/
/** 식당 이용 중 건강 이상(먹은 맥락 없이 쓰러짐 등): 식사 원인을 단정하지 않습니다. */
const healthEvent: Partial<CategoryKnowledge> = {
  label: '고객 건강 이상(확인 필요)',
  clientLabel: '고객 건강 이상',
  menuRelated: false,
  incident: '식당 이용 중 고객 건강 이상 관련 제보 접수됨(긴급 확인 대상).',
  customerEmpathy: '몸이 불편하셨다는 말씀을 듣고 많이 걱정됩니다.',
  apologyScope: '식당 이용',
  customerCheck: '무엇보다 고객님의 상태가 가장 중요합니다. 지금 상태를 알려 주시면 진료 안내 등 필요한 사항을 도와드리겠습니다.',
  customerPrevention: '당시 상황을 확인해 신속히 안내드리겠습니다.',
  internalChecks: [
    { text: '고객 상태 확인 및 필요 시 의료기관 안내 필요함.' },
    { text: '당시 경위와 당일 식사 여부·메뉴 확인 예정임.' },
  ],
  causes: [],
  internalPrevention: ['확인 결과에 따라 필요한 조치를 마련하겠음.'],
  clientCheck: '고객 상태와 당시 경위, 당일 식사 여부를 확인하겠으며, 확인 전까지 원인을 단정하지 않겠습니다.',
  clientPrevention: '확인 결과에 따라 필요한 조치를 마련하겠습니다.',
  noApology: true,
}

/** 알레르기 성분을 묻는 말 */
const allergyQuestion = /(문의|궁금|알려\s?주|성분|들어\s?(갔|가|있)|있나요|인가요|되나요|확인\s?(부탁|해\s?주)|추가해\s?주|표시해\s?주|요청)/
/** 알레르기 증상을 말하는 표현 */
const allergySymptomWords = /(두드러기|가려|간지|붓|부었|부어|호흡|숨\s?(이|을)?\s?(차|막|가빠|쉬기|못\s?쉬)|(반응|증상)(이|가)?\s?(있었|생겼|나타|올라|났)|발진|두통|토했|구토|설사|복통|배가|아파|아프|따끔|빨개|빨갛|올라왔|이상해|어지러)/
/** 불만을 말하는 표현(있으면 순수 문의로 보지 않음) */
const complaintWords = /(불편|불만|불친절|기다|늦|더러|화가|화나|짜증|실망|최악|별로)/
function statesObservedFact(text: string) {
  return observedFact.test(text.replace(/\S*(는지|은지|인지|던지)/g, ' '))
}

/**
 * 유형 판정은 사용자가 직접 입력한 키워드와 메모만 씁니다.
 * 판정되지 않을 때만 사용자가 고른 유사 사례 유형을 참고하고, 사용자가 유형을 직접 고르면 그것을 따릅니다.
 */
export function analyzeReportInput(
  form: Pick<ReportFormState, 'keyword' | 'memo' | 'categoryOverride'>,
  selectedCase: VocCase | null,
): ReportAnalysis {
  // '배탈은 없는데 맛이 이상해요'처럼 부정한 앞 구절은 빼고 판정합니다. 모두 빠지면 원문을 씁니다.
  const keywordText = stripNegatedClauses(form.keyword) || form.keyword
  const keywordDetection = detectReportCategoryDetailed(keywordText)
  // 메모는 고객 말씀으로 판정되지 않을 때만 보조로 씁니다. '치아 이상 없음'처럼 부정한 구절은 뺍니다.
  const memoText = stripNegatedClauses(form.memo)
  const useMemo = keywordDetection.category === '기타' && memoText.length > 0
  const detection = useMemo ? detectReportCategoryDetailed(memoText) : keywordDetection
  const evidenceFromMemo = useMemo && detection.category !== '기타'
  const source = `${keywordText} ${useMemo ? memoText : ''}`.trim()
  let detected = detection.category as CategoryType
  let fromCase = false
  if (detected === '기타' && selectedCase && reportCategoryOptions.includes(selectedCase.category as CategoryType)) {
    detected = selectedCase.category as CategoryType
    fromCase = true
  }

  // 안전망: 먹은 뒤 몸 증상을 말했는데 유형이 정해지지 않았으면 식사 후 이상 증상으로 봅니다.
  const afterEating = source.match(eatenThen)
  const restAfterEating = afterEating?.groups?.rest ?? ''
  const rawSymptom = restAfterEating.match(bodySymptom)
  // '얼얼할 정도로 매워요', '입안이 개운해요'처럼 맛을 말한 경우는 증상으로 보지 않습니다.
  const safetyNetSymptom = rawSymptom && !(tasteContext.test(restAfterEating) && /^(얼얼|입안|따끔|시원)/.test(rawSymptom[1])) ? rawSymptom : null
  let safetyEvidence: string[] = []
  // 의료 사건은 사람 일이고 훈련·문의 맥락이 아니며, 먹은 뒤이거나 몸 증상·의식 관련일 때만 봅니다.
  const medicalMatch = source.match(medicalTerms)
  const medicalEvent =
    medicalMatch && !medicalExclude.test(source) && (afterEating || bodySymptom.test(source) || /(기절|실신|의식|구급차|쓰러)/.test(medicalMatch[1]))
      ? medicalMatch
      : null
  const healthEventOnly = detected === '기타' && !fromCase && Boolean(medicalEvent) && !afterEating
  if (detected === '기타' && !fromCase && afterEating?.groups && safetyNetSymptom) {
    detected = '식중독 의심'
    safetyEvidence = [afterEating.groups.eat, safetyNetSymptom[1]]
  } else if (detected === '기타' && !fromCase && medicalEvent) {
    // 쓰러짐·응급실 같은 의료 사건은 다른 유형이 없으면 식사 후 이상 증상으로 보고 고객 상태부터 확인합니다.
    detected = '식중독 의심'
    safetyEvidence = afterEating?.groups ? [afterEating.groups.eat, medicalEvent[1]] : [medicalEvent[1]]
  }
  const mentionsMedical = Boolean(medicalEvent)

  const override = form.categoryOverride && reportCategoryOptions.includes(form.categoryOverride) ? form.categoryOverride : ''
  const category = (override || detected) as CategoryType
  const lower = source.toLowerCase()
  const noSpace = lower.replace(/\s+/g, '')
  const isCookingQuality =
    category === '품질' &&
    (QUALITY_COOKING_STATUS_PATTERNS.some((pattern) => pattern.test(lower)) ||
      QUALITY_COOKING_STATUS_KEYWORDS.some((keyword) => noSpace.includes(keyword.replace(/\s+/g, ''))))
  const isInjury = category === '안전사고' && injuryKeywords.test(lower) && !dentalKeywords.test(lower)
  const isAllergy = category === '식중독 의심' && allergyKeywords.test(lower)
  // '확인해 주세요'로 끝나도 '곰팡이 핀', '유통기한 지난 우유 마셨는데'처럼 겪은 일을 말하면 변질 제보로 봅니다.
  const isInquiry = inquiryOnly.test(lower) && !statesObservedFact(lower)
  const isSpoiled = category === '품질' && spoiledFood.test(lower) && !isInquiry
  const isStorageInquiry = category === '품질' && spoiledFood.test(lower) && isInquiry
  const mentionsAllergy = /(알레르기|알러지)/.test(lower)
  const hasSymptom = allergySymptomWords.test(lower)
  // 알레르기 성분을 묻기만 하고 증상은 말하지 않은 경우('땅콩 들어갔는지 궁금해요'처럼 알레르기 식품을 물어도 포함)
  const isAllergyInquiry =
    !hasSymptom &&
    allergyQuestion.test(lower) &&
    ((category === '식중독 의심' && mentionsAllergy) || (category === '기타' && allergenNames.test(lower) && /(들어|성분|함유|포함)/.test(lower)))
  // 알레르기 표시·안내 불만: 증상도 질문도 없이 알레르기를 말한 경우('알레르기 표시가 없어요')
  const isAllergyLabelComplaint = category === '식중독 의심' && mentionsAllergy && !hasSymptom && !isAllergyInquiry
  // 유형이 정해지지 않은 순수 문의(원산지·운영 시간 등)
  const isGeneralInquiry = category === '기타' && !isAllergyInquiry && inquiryOnly.test(lower) && !complaintWords.test(lower)
  const isHealthEvent = healthEventOnly && category === '식중독 의심'
  const kb = isHealthEvent
    ? { ...knowledge[category], ...healthEvent }
    : isAllergyInquiry
    ? { ...knowledge[category], ...allergyInquiry }
    : isAllergyLabelComplaint
      ? { ...knowledge[category], ...allergyLabelComplaint }
      : isGeneralInquiry
      ? { ...knowledge[category], ...generalInquiry }
      : resolveKnowledge(category, isCookingQuality, isInjury, isAllergy, isSpoiled, isStorageInquiry)

  return {
    category,
    detected,
    evidence: fromCase ? [] : safetyEvidence.length > 0 ? safetyEvidence : detection.evidence,
    evidenceFromMemo,
    alternatives: detection.alternatives.filter((item) => item !== category) as CategoryType[],
    isOverridden: Boolean(override) && override !== detected,
    fromCase,
    isCookingQuality,
    isInjury,
    isAllergy,
    isSpoiled,
    isStorageInquiry,
    isAllergyInquiry,
    isAllergyLabelComplaint,
    isGeneralInquiry,
    isHealthEvent,
    isHighRisk:
      // 병원·응급실·의식 같은 말이 있으면 어떤 유형이든 중대로 봅니다.
      mentionsMedical ||
      (category === '식중독 의심' && !isAllergyInquiry && !isAllergyLabelComplaint) ||
      category === '안전사고' ||
      (category === '이물 혼입' && hazardousForeign.test(lower)) ||
      isSpoiled,
    label: kb.label,
  }
}

/** 기존 호출부 호환 */
export function resolveCategory(form: Pick<ReportFormState, 'keyword' | 'memo'>, selectedCase: VocCase | null) {
  const analysis = analyzeReportInput({ ...form, categoryOverride: '' }, selectedCase)
  return {
    baseCategory: analysis.category,
    displayLabel: analysis.label,
    isSafety: analysis.category === '안전사고',
    isCookingQuality: analysis.isCookingQuality,
    isHighRisk: analysis.isHighRisk,
  }
}

function resolveKnowledge(
  category: CategoryType,
  isCookingQuality: boolean,
  isInjury: boolean,
  isAllergy = false,
  isSpoiled = false,
  isStorageInquiry = false,
): CategoryKnowledge {
  const base = knowledge[category]
  if (isSpoiled) return { ...base, ...spoiledQuality }
  if (isStorageInquiry) return { ...base, ...storageInquiry }
  if (isCookingQuality) return { ...base, ...cookingQuality }
  if (isInjury) return { ...base, ...injurySafety }
  if (isAllergy) return { ...base, ...allergySymptom }
  return base
}

/** 부정·확인 결과 구절('이상 없음', '없었음', '아님')을 판정 대상에서 뺍니다. */
export function stripNegatedClauses(text: string) {
  return text
    .split(/\s*(?:[\n,.;/]|그리고|하지만|다만)\s*|(?<=(?:는데|은데|인데|닌데|지만|아니고|없고|괜찮고))\s+/)
    .map((clause) => clause.trim())
    // '직원이 사과도 없음'처럼 응대에 대한 불만은 부정어가 있어도 남깁니다.
    .filter(
      (clause) =>
        clause &&
        (/(직원|사과|무시|별일|응대|태도|안내)/.test(clause) ||
          !/(없음|없었|없다|없어|없고|없는데|아님|아니|아닌|않았|않음|않다|않고|이상\s?없|괜찮)/.test(clause)),
    )
    .join(' ')
}

/** 고객 원문을 보고서에 옮길 때 구어 표지(ㅠ, ㅋ, ~)를 정리합니다. */
function tidyQuote(text: string) {
  return cleanText(text.replace(/[ㅠㅜㅋㅎ]+/g, '').replace(/~+/g, '').replace(/([!?])\1+/g, '$1'))
}

function buildContext(form: ReportFormState, selectedCase: VocCase | null) {
  const analysis = analyzeReportInput(form, selectedCase)
  const kb = analysis.isHealthEvent
    ? { ...knowledge[analysis.category], ...healthEvent }
    : analysis.isAllergyInquiry
    ? { ...knowledge[analysis.category], ...allergyInquiry }
    : analysis.isAllergyLabelComplaint
      ? { ...knowledge[analysis.category], ...allergyLabelComplaint }
      : analysis.isGeneralInquiry
      ? { ...knowledge[analysis.category], ...generalInquiry }
      : resolveKnowledge(analysis.category, analysis.isCookingQuality, analysis.isInjury, analysis.isAllergy, analysis.isSpoiled, analysis.isStorageInquiry)
  const doneActions = doneActionOptions.filter((action) => form.onsiteActions.includes(action))
  const menuInput = cleanText(form.menuName)
  const hasMenu = menuInput.length > 0
  const keyword = tidyQuote(form.keyword)
  // 고위험 유형은 사용자가 고른 강도와 상관없이 '중대' 기준으로 보고합니다.
  const intensityRaised = analysis.isHighRisk && form.responseIntensity !== '중대'

  return {
    form,
    analysis,
    kb,
    category: analysis.category,
    workplace: formatRestaurantName(form.workplace),
    managerName: cleanText(form.restaurantManagerName),
    contactTitle: formatContactTitle(form.clientContactName),
    hasMenu,
    menuInput,
    /** 메뉴 관련 유형인데 메뉴가 없으면 '제공 음식', 고객용은 '음식' */
    values: {
      m: hasMenu ? menuInput : '제공 음식',
      t: hasMenu ? menuInput : '음식',
      kw: keyword || '고객 의견',
    },
    keyword,
    customerInfo: cleanText(form.customerInfo),
    memoLines: form.memo
      .split(/\n+/)
      .map((line) => cleanText(line))
      .filter(Boolean),
    occurredAt: formatOccurredAt(form.occurredAt),
    doneActions,
    isDone: (action: DoneAction) => doneActions.includes(action),
    isChecking: form.onsiteActions.includes('현장 확인 중'),
    reactions: customerReactionOptions.filter((reaction) => form.customerReactions.includes(reaction)),
    has: (reaction: CustomerReaction) => form.customerReactions.includes(reaction),
    detail: form.reportDetailLevel,
    intensity: intensityRaised ? ('중대' as ResponseIntensity) : form.responseIntensity,
    intensityRaised,
  }
}

type ReportContext = ReturnType<typeof buildContext>

// ───────────────────────── 사내 보고용 (음슴체) ─────────────────────────

function internalChecks(context: ReportContext) {
  const required = (context.analysis.isInjury ? injuryRequired : highRiskRequired[context.category] ?? [])
    .filter((item) => !item.doneWhen || !context.isDone(item.doneWhen))
    .map((item) => item.text)
  // 메모에 '~확인함'처럼 이미 확인한 사실이 있으면 그 항목은 '메모 기준 1차 확인됨'으로 바꿉니다.
  const memoFor = (topic?: RegExp) =>
    topic
      ? context.memoLines.find((line) => topic.test(line) && /(확인|점검|보관|보존|확보|측정|기록)\s?(함|했|완료|됨|하였|해\s?둠)|보관|확보/.test(line))
      : undefined
  const checks = context.kb.internalChecks
    .filter((item) => !(item.sameBatch && context.isDone('동일 조리분 확인')))
    .map((item) => {
      const line = memoFor(item.topic)
      if (!line) return item.text
      const subject = item.text.replace(/\s?(여부\s)?(확인|점검|비교|보관)?\s?(및 현물 보관\s)?(예정임|필요함)\.$/, '')
      return /(없음|없었|이상\s?없)/.test(line)
        ? `${subject}: 현장 메모 기준 이상 없음 확인됨, 결과 기록 필요함.`
        : `${subject}: 현장 메모 기준 1차 확인됨, 결과 기록 필요함.`
    })
  const limit = context.detail === '짧게' ? 1 : context.detail === '보통' ? 2 : checks.length
  // 고위험 유형은 확인 항목을 줄이지 않습니다.
  return [...required, ...(context.analysis.isHighRisk ? checks : checks.slice(0, limit))]
}

function internalReporting(context: ReportContext) {
  const lines: string[] = []
  if (context.intensity === '중대') {
    lines.push(
      context.intensityRaised
        ? '고위험 유형이므로 중대 VOC로 상위 관리자 즉시 보고 및 단계별 경과 보고 필요함.'
        : '중대 VOC로 상위 관리자 즉시 보고 및 단계별 경과 보고 필요함.',
    )
  }
  else if (context.intensity === '주의') lines.push('식당관리자 확인 후 상위 관리자 보고 필요함.')
  else lines.push('확인 결과 정리 후 사내 공유 예정임.')

  if (context.isDone('고객사 보고')) lines.push('확인 결과는 고객사에 추가 보고 예정임.')
  else if (context.analysis.isHighRisk) lines.push('고객사 긴급 보고 필요함.')
  else if (context.has('고객사 공유 필요')) lines.push('고객사 공유 필요함.')

  if (context.has('연락처 남김')) lines.push('확인 결과는 고객이 남긴 연락처로 개별 안내 예정임.')
  if (context.has('보상 요청')) lines.push('보상 요청은 내부 기준과 고객사 협의 후 결정 예정임.')
  return lines
}

function processStatus(context: ReportContext) {
  if (context.doneActions.length === 0) return context.isChecking ? '접수, 현장 확인 진행 중' : '접수, 현장 확인 필요'
  if (context.isChecking) return '1차 조치 완료, 현장 확인 진행 중'
  return '1차 조치 완료, 원인 확인 예정'
}

function buildInternalReport(context: ReportContext): string {
  const { kb, values } = context
  const sections: Array<{ title: string; lines: string[] }> = []

  const incidentTemplate = !context.keyword ? kb.incident.replace('"{kw}" 관련 ', '') : kb.incident
  const incident = [fill(incidentTemplate, values)]
  // 자세히 쓸 때만 고객 원문을 기록으로 남깁니다(유형 문장에 이미 인용한 경우 제외).
  const residual = [context.menuInput, ...context.analysis.evidence]
    .filter(Boolean)
    .reduce((text, word) => text.split(word).join(''), context.keyword)
    .replace(/(에서|에게|에|이|가|을|를|은|는|도|요|나왔어요|나왔다|나왔|나옴|나와|있어요|있었|있음|발견|됐어요|됨)/g, '')
    .replace(/[^가-힣a-z0-9]/gi, '')
  if (context.detail === '자세히' && context.keyword && !kb.incident.includes('{kw}') && residual.length >= 3) {
    incident.push(`고객 표현: "${context.keyword}"`)
  }
  incident.push(...context.reactions.map((reaction) => internalReactionLine[reaction]))
  for (const line of context.memoLines) incident.push(`현장 메모: ${line}`)
  sections.push({ title: '발생 내용', lines: incident })

  const done = context.doneActions.map((action) =>
    action === '사진 기록' && context.analysis.isInjury ? '사고 장소·부상 부위 사진 기록 완료함.' : internalDoneLine[action],
  )
  if (context.isChecking) done.push('현장 확인 진행 중임.')
  if (done.length === 0) done.push('완료된 현장 조치 입력 없음, 조치 내용 확인 필요함.')
  sections.push({ title: '현장 조치', lines: done })

  const checks = internalChecks(context)
  const causeCount = context.detail === '자세히' ? 3 : 2
  const causes = context.detail === '짧게' ? [] : kb.causes.slice(0, causeCount)
  const preventionCount = context.detail === '짧게' ? 1 : context.detail === '보통' ? 2 : 3
  const prevention = kb.internalPrevention.slice(0, preventionCount)

  if (context.detail === '짧게') {
    sections.push({ title: '확인 및 개선 계획', lines: [...checks, ...prevention] })
  } else {
    sections.push({ title: '확인 계획', lines: checks })
    if (causes.length > 0) {
      sections.push({ title: '원인 후보 (확인 전 추정, 단정 아님)', lines: [`${joinKorean(causes, 'plain')} 여부 확인 필요함.`] })
    }
    sections.push({ title: '재발 방지 계획', lines: prevention })
  }
  sections.push({ title: '보고·공유', lines: internalReporting(context) })

  const header = [
    `[고객 VOC 보고] ${kb.label}${context.hasMenu && kb.menuRelated ? ` · ${context.menuInput}` : ''}`,
    '',
    `1. 사업장 : ${context.workplace}${context.managerName ? ` (식당관리자 : ${context.managerName})` : ''}`,
    `2. 발생 일시 : ${context.occurredAt || '미입력(확인 필요)'}`,
    `3. 발생 메뉴 : ${context.hasMenu ? context.menuInput : kb.menuRelated ? '미입력(확인 필요)' : '해당 없음'}`,
    `4. VOC 유형 : ${kb.label} / 대응 강도 : ${context.intensity}${context.intensityRaised ? '(고위험 유형 기준 적용)' : ''}`,
    `5. 고객 정보 : ${context.customerInfo || '미입력'}`,
    `6. 처리 상태 : ${processStatus(context)}`,
  ]

  const body = sections.flatMap((section, index) => [
    '',
    `${index + 7}. ${section.title}`,
    ...section.lines.map((line) => `- ${line}`),
  ])

  return [...header, ...body, '', '이상.'].map(sanitize).join('\n')
}

// ───────────────────────── 고객사 보고용 (공식 합니다체) ─────────────────────────

function buildClientReport(context: ReportContext): string {
  const { kb } = context
  const whenPart = context.occurredAt ? `${context.occurredAt}경 ` : ''
  const menuNote = context.hasMenu && kb.menuRelated ? `(해당 메뉴: ${context.menuInput})` : ''
  const greeting = `안녕하세요, ${context.contactTitle}. ${context.workplace}입니다.`
  const intro = context.isDone('고객사 보고')
    ? `앞서 1차로 말씀드린 ${kb.clientLabel} 건의 현재까지 진행 상황을 보고드립니다.`
    : '아래와 같이 고객 VOC 접수 건을 보고드립니다.'

  const receivedNoun = context.analysis.isInjury ? '사고가' : context.analysis.isHighRisk ? '관련 고객 제보가' : '관련 고객 의견이'
  const received: string[] = [`${whenPart}${kb.clientLabel} ${receivedNoun} 접수되었습니다${menuNote}.`]
  if (context.has('불쾌감 표현')) received.push('고객께서는 불쾌감을 표하셨습니다.')
  if (context.has('괜찮다고 함')) received.push('응대 후 고객께서는 괜찮다는 의사를 주셨습니다.')

  const actions: string[] = []
  if (context.category === '안전사고') {
    actions.push('무엇보다 고객님의 상태 확인을 최우선으로 하고 있습니다.')
  } else if (context.category === '식중독 의심') {
    actions.push('고객님의 증상과 섭취 메뉴 확인을 최우선으로 하고 있으며, 보존식과 관련 기록을 확인하겠습니다.')
  }
  // 고객사 1차 보고는 받는 쪽이 고객사이므로 조치 목록에서 빼고 첫 문장으로 알립니다.
  const doneNouns = context.doneActions
    .filter((action) => action !== '고객사 보고')
    .map((action) => (action === '사진 기록' && context.analysis.isInjury ? '사고 장소·부상 부위 사진 기록' : clientDoneNoun[action]))
  if (doneNouns.length > 0) actions.push(`현장에서는 ${attachJosa(joinKorean(doneNouns), '을/를')} 완료하였습니다.`)
  if (context.isChecking) actions.push('현재 현장 확인을 진행하고 있습니다.')
  if (doneNouns.length === 0 && !context.isChecking) actions.push('접수 내용을 바탕으로 현장 확인을 진행할 예정입니다.')
  if (context.has('보상 요청')) actions.push('고객께서 요청하신 보상 관련 사항은 관련 기준에 따라 검토한 뒤 협의드리겠습니다.')
  if (context.has('연락처 남김')) actions.push('고객께서 연락처를 남겨 주셔서 확인 결과를 개별 안내드릴 예정입니다.')

  const check = [kb.clientCheck]
  if (context.detail === '자세히' && !context.analysis.isHighRisk) check.push('원인은 확인 결과에 따라 판단하며, 확인 전까지 단정하지 않겠습니다.')

  const followUp =
    context.intensity === '중대'
      ? '사안의 중요도를 고려해 진행 상황을 단계별로 신속히 공유드리겠습니다.'
      : context.intensity === '주의'
        ? '확인 결과가 나오는 대로 우선 공유드리겠습니다.'
        : '확인 결과와 개선 사항은 정리되는 대로 공유드리겠습니다.'

  let body: string[]
  if (context.detail === '짧게') {
    body = [
      ...(context.isDone('고객사 보고') ? [intro] : []),
      [...received, ...actions].join(' '),
      `${check.join(' ')} ${kb.clientPrevention}`,
      followUp,
    ]
  } else {
    body = [
      intro,
      `■ 접수 내용\n${received.join(' ')}`,
      `■ 현장 조치\n${actions.join(' ')}`,
      `■ 원인 확인 계획\n${check.join(' ')}`,
      `■ 재발 방지\n${kb.clientPrevention}`,
      `■ 향후 공유\n${followUp}`,
    ]
  }

  const managerTitle = /식당$/.test(context.workplace) ? '관리자' : '식당관리자'
  const signOff = `감사합니다.\n${context.workplace}${context.managerName ? ` ${managerTitle} ${context.managerName}` : ''} 드림`
  return [greeting, ...body, signOff]
    .map((paragraph) => paragraph.split('\n').map(sanitize).join('\n'))
    .filter((paragraph) => paragraph.replace(/\s/g, '').length > 0)
    .join('\n\n')
}

// ───────────────────────── 고객용 (공손한 합니다체) ─────────────────────────

function buildCustomerMessage(context: ReportContext): string {
  const { kb, values } = context
  const greeting = `안녕하세요, ${context.workplace}입니다.`
  const empathy = fill(kb.customerEmpathy, values)
  const apology = `${kb.apologyScope}에 불편을 드려 진심으로 사과드립니다.`

  const doneParts: string[] = []
  if (!context.analysis.isHighRisk) {
    if (context.isDone('음식 교체')) doneParts.push('불편을 드린 음식은 새로 교체해 드렸습니다.')
    if (context.isDone('메뉴 회수')) doneParts.push('해당 음식은 회수해 두었습니다.')
    if (context.isDone('동일 조리분 확인')) doneParts.push('같은 시간에 조리된 음식도 함께 확인하였습니다.')
  } else if (context.isDone('메뉴 회수')) {
    doneParts.push('해당 음식은 회수해 두었습니다.')
  }

  const paragraphs = [greeting, kb.noApology ? empathy : `${empathy} ${apology}`]
  if (context.analysis.isHighRisk) {
    paragraphs.push(kb.customerCheck)
    paragraphs.push([...doneParts, kb.customerPrevention].join(' '))
  } else {
    paragraphs.push([...doneParts, kb.customerCheck].join(' '))
    if (context.detail !== '짧게') paragraphs.push(kb.customerPrevention)
  }

  const follow: string[] = []
  if (context.has('보상 요청')) follow.push('말씀하신 보상 관련 사항은 관련 기준에 따라 검토한 뒤 안내드리겠습니다.')
  if (context.has('연락처 남김')) follow.push('확인 결과는 남겨 주신 연락처로 안내드리겠습니다.')
  if (follow.length > 0) paragraphs.push(follow.join(' '))

  paragraphs.push(context.analysis.isHighRisk ? '추가로 필요하신 사항은 언제든 연락 주십시오.' : '소중한 의견 주셔서 감사합니다.')
  return paragraphs.map(sanitize).join('\n\n')
}

// ───────────────────────── 공개 함수 ─────────────────────────

export function generateCustomerMessage(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildCustomerMessage(buildContext(form, selectedCase))
}

export function generateInternalReport(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildInternalReport(buildContext(form, selectedCase))
}

export function generateClientReport(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildClientReport(buildContext(form, selectedCase))
}

export function generateReportContents(form: ReportFormState, selectedCase: VocCase | null): GeneratedReport {
  const context = buildContext(form, selectedCase)
  return {
    customerMessage: buildCustomerMessage(context),
    internalReport: buildInternalReport(context),
    clientReport: buildClientReport(context),
  }
}
