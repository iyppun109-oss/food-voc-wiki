import { detectReportCategory, QUALITY_COOKING_STATUS_KEYWORDS } from '../data/reportSentenceTemplates'
import { type VocCase } from '../data/vocCases'
import { attachJosa } from './koreanJosa'

export type CustomerReaction =
  | '괜찮다고 함'
  | '불쾌감 표현'
  | '연락처 남김'
  | '보상 요청'
  | '고객사 공유 필요'
  | '미확인'

export type OnsiteAction =
  | '고객 응대'
  | '음식 교체'
  | '메뉴 회수'
  | '동일 조리분 확인'
  | '사진 기록'
  | '고객사 보고'
  | '현장 확인 중'

export type ResponseIntensity = '일반' | '주의' | '중대'

export type ReportDetailLevel = '짧게' | '보통' | '자세히'

export const customerReactionOptions: CustomerReaction[] = [
  '괜찮다고 함',
  '불쾌감 표현',
  '연락처 남김',
  '보상 요청',
  '고객사 공유 필요',
  '미확인',
]

export const onsiteActionOptions: OnsiteAction[] = [
  '고객 응대',
  '음식 교체',
  '메뉴 회수',
  '동일 조리분 확인',
  '사진 기록',
  '고객사 보고',
  '현장 확인 중',
]

export const responseIntensityOptions: ResponseIntensity[] = ['일반', '주의', '중대']

export const reportDetailLevelOptions: ReportDetailLevel[] = ['짧게', '보통', '자세히']

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
}

export interface GeneratedReport {
  customerMessage: string
  internalReport: string
  clientReport: string
}

const fallbackValues = {
  workplace: '사업장명',
  restaurantManagerName: '식당관리자',
  clientContactName: '담당자님',
  customerInfo: '고객 정보',
  menu: '해당 메뉴',
  keyword: 'VOC',
  occurredAt: '발생 일시 미입력',
}

const detailConfig: Record<ReportDetailLevel, { actionCount: number }> = {
  짧게: { actionCount: 3 },
  보통: { actionCount: 4 },
  자세히: { actionCount: 5 },
}

const safetyDisplayLabel = '안전사고 / 치아 파절 의심'
const cookingQualityDisplayLabel = '품질 / 조리상태 불량'

const lineSeedSeed = 'food-voc-line-seed-v7'

type CategoryType =
  | '머리카락'
  | '벌레'
  | '비닐/플라스틱'
  | '뼈/가시'
  | '이물 혼입'
  | '품절'
  | '염도'
  | '품질'
  | '양 부족'
  | '위생 불만'
  | '직원 응대'
  | '식중독 의심'
  | '안전사고'
  | '기타'

const incidentTemplateByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '{{menu}}에서 머리카락이 발견되었다는 고객 제보가 접수됨.',
    '현장에서 배식 직전 표면·고정 상태를 확인함.',
    '고객 불편 내용은 조리·배식 단계와 연계해 접수됨.',
    '관련 메뉴의 동일 조리분 확인이 필요함.',
    '현장 안내 요청이 발생해 확인을 진행 중임.',
  ],
  벌레: [
    '{{menu}}에서 벌레가 발견되었다는 고객 제보가 접수됨.',
    '원물 세척·보관 상태와 전처리 결과를 현장에서 확인함.',
    '해당 시간대 작업 구간에서 접근차단 여부를 점검함.',
    '동일 조리분 확인이 필요하다는 요청이 있어 조치함.',
    '해당 건은 즉시 재점검 대상으로 분류함.',
  ],
  '비닐/플라스틱': [
    '{{menu}}에서 비닐·플라스틱 이물이 발견되었다는 고객 제보가 접수됨.',
    '포장재 제거와 조립 단계의 연결이 적절했는지 확인함.',
    '현장에서 해당 메뉴 처리 이력 및 제공 상태를 확인함.',
    '동일 메뉴 회수 가능성이 있어 현물 점검을 진행함.',
    '조리 기준 대비 조립 절차 재확인이 필요함.',
  ],
  '뼈/가시': [
    '{{menu}}에서 뼈·가시가 나왔다는 고객 제보가 접수됨.',
    '원재료 선별 단계와 손질 단계 연결을 점검함.',
    '동일 조리분 및 제공 상태를 즉시 확인함.',
    '고객 안내가 필요해 응대 절차를 진행함.',
    '재확인 대상 메뉴가 있어 후속 점검을 준비함.',
  ],
  '이물 혼입': [
    '{{menu}}에서 이물이 발견되었다는 고객 제보가 접수됨.',
    '해당 건은 조리·배식 연계 구간 확인 대상으로 분류됨.',
    '현장에서 표면 상태와 잔류 이물 후보를 검토함.',
    '고객 불편 내용 접수 건으로 즉시 재점검을 시작함.',
    '동일 조리분 재확인 결과를 수집함.',
  ],
  품절: [
    '{{menu:이/가}} 이용 시간 중 조기 소진되어 고객 불편 의견이 접수됨.',
    '수요 변동 및 차수별 준비량 미달 여부를 확인함.',
    '고객 안내 후 대체 메뉴 제공이 논의됨.',
    '현장에서 수량 집계와 추가 조리 가능성을 점검함.',
    '추가 확인 대상 수량 항목을 즉시 분리함.',
  ],
  염도: [
    '{{menu}}의 간이 맞지 않다는 고객 의견이 접수됨.',
    '기준 레시피 대비 간 맞춤 편차가 우려되어 확인함.',
    '현장 시식 기준표 점검이 필요해 조치함.',
    '고객 불편 접수 건으로 염도 관련 로그를 확인함.',
    '동일 조리분의 중간 조리점검 이력을 함께 검토함.',
  ],
  품질: [
    '{{menu}}의 품질에 대한 고객 의견이 접수됨.',
    '현장에서는 조리 기준 및 제공 상태를 확인함.',
    '고객 VOC 내용은 메뉴 상태 점검 대상으로 처리됨.',
    '동일 조리분과 대체 가능성을 함께 검토함.',
    '추가 확인 후 원인 후보를 정리할 예정임.',
  ],
  '양 부족': [
    '{{menu}}의 제공량이 부족하다는 고객 의견이 접수됨.',
    '기준 접시량과 실제 배식량 편차를 확인함.',
    '요청 건은 수요 집중 구간과 연계해 점검함.',
    '추가 제공 여부와 대응 이력도 함께 정리함.',
    '고객 안내 진행 후 조치 범위를 결정함.',
  ],
  '위생 불만': [
    '식당 위생 상태에 대한 고객 불편 의견이 접수됨.',
    '테이블·집기·배식대 청결 상태를 현장 확인함.',
    '고객 반응과 현장 정리 상태를 함께 점검함.',
    '위생 점검 주기 준수 여부를 확인함.',
    '추가 확인 사항은 보고서에 반영함.',
  ],
  '직원 응대': [
    '직원 응대에 대한 고객 불편 의견이 접수됨.',
    '안내 방식과 응대 속도에 대한 불편이 제기됨.',
    '현장에서 안내 이력 및 전달 내용을 확인함.',
    '고객 확인사항을 별도 정리해 재접속 필요 여부를 판단함.',
    '추가 안내 및 이관 기준을 점검함.',
  ],
  '식중독 의심': [
    '식사 후 이상 증상이 있다는 고객 제보가 접수되어 긴급 확인 대상으로 분류함.',
    '섭취 메뉴, 잔식, 상태 확인 건으로 조치가 시작됨.',
    '고객 상태 확인 후 안전 대응 채널로 이관함.',
    '보관·조리 이력과 보존 조건 점검이 필요함.',
    '현재 원인 단정은 보류하고 원인 후보를 추적함.',
  ],
  안전사고: [
    '식사 중 딱딱한 물질을 씹은 후 치아 불편을 호소한 건이 접수됨.',
    '고객 상태 확인이 우선 과제로 접수됨.',
    '제공 메뉴 및 잔식 회수와 증빙 정리를 진행함.',
    '원재료·전처리·조리·배식 공정 점검이 필요함.',
    '즉시 보고 필요성이 높아 현장 확인을 강화함.',
  ],
  기타: [
    '{{menu}} 이용과 관련한 VOC가 접수됨.',
    '현장에서 추가 확인이 필요한 항목으로 처리됨.',
    '고객 불편 내용과 현장 확인 건을 분리해 점검함.',
    '추가 점검 후 원인 후보를 정리함.',
    '재발 방지 필요 항목을 정리함.',
  ],
}

const causeTemplateByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '배식 전 최종 검수 누락 가능성이 있음.',
    '조리 복장·위생 장비 준수 이탈이 있었을 가능성이 있음.',
    '동일 조리분에서 미세 이물 통제 실패 가능성이 있음.',
  ],
  벌레: [
    '원물 세척 강도 부족으로 혼입 가능성이 있음.',
    '보관 구간 개방 관리 미흡 가능성이 있음.',
    '소독·선별 지점의 확인 간격이 지연되었을 가능성이 있음.',
  ],
  '비닐/플라스틱': [
    '포장재 제거 단계가 누락되었을 가능성이 있음.',
    '전처리와 조립의 이행 간 조율이 짧았던 가능성이 있음.',
    '제공 전 최종 검수에서 항목 누락이 있었을 가능성이 있음.',
  ],
  '뼈/가시': [
    '원재료 선별 과정에서 뼈·가시가 남았을 가능성이 있음.',
    '조리 후 제거 확인 이력이 일부 미흡했을 가능성이 있음.',
    '동일 조리분 반복 투입 시 이탈 항목 점검이 약했을 가능성이 있음.',
  ],
  '이물 혼입': [
    '공정 간 이물 통제 기준 전달이 지연되었을 가능성이 있음.',
    '동일 반에서 최종 확인 단계가 분산되었을 가능성이 있음.',
    '기록 반영이 즉시 반영되지 않았을 가능성이 있음.',
  ],
  품절: [
    '수요 예측 대비 준비량 산정이 미흡했을 가능성이 있음.',
    '차수별 모니터링 반영이 늦었을 가능성이 있음.',
    '특정 시간대 수요 집중을 반영 못했을 가능성이 있음.',
  ],
  염도: [
    '중간 점검 시 간 간격 확인이 약했을 가능성이 있음.',
    '레시피 적용 구간에서 기준값 반영이 불일치했을 가능성이 있음.',
    '개인 기호 차이로 과다·과소 반응이 확대되었을 가능성이 있음.',
  ],
  품질: [
    '기준 레시피 반영 구간이 일부 어긋났을 가능성이 있음.',
    '조리 조건 확인 표본이 제한적이었을 가능성이 있음.',
    '동일 배치의 점검 주기가 지연되었을 가능성이 있음.',
  ],
  '양 부족': [
    '예상 식수 대비 배식량 산정이 편차가 있었을 가능성이 있음.',
    '시간대별 수요 반영이 늦었을 가능성이 있음.',
    '메뉴 구성 비율 조정이 미비했을 가능성이 있음.',
  ],
  '위생 불만': [
    '점검 주기 준수 범위가 느슨해졌을 가능성이 있음.',
    '배식대 정리 타이밍이 격차를 보였을 가능성이 있음.',
    '현장 정리 동선이 분산되었을 가능성이 있음.',
  ],
  '직원 응대': [
    '응대 매뉴얼 전달이 지연되었을 가능성이 있음.',
    '안내 이관 라인이 정리되지 않았을 가능성이 있음.',
    '고객 불편 청취 단계가 생략되었을 가능성이 있음.',
  ],
  '식중독 의심': [
    '보존 조건 기록이 즉시 연동되지 않았을 가능성이 있음.',
    '섭취 메뉴 확인이 지연될 가능성이 있음.',
    '동일 증상 고객 접점 확인이 미흡했을 가능성이 있음.',
  ],
  안전사고: [
    '고객 상태 확인과 동시 메뉴 추적이 지연되었을 가능성이 있음.',
    '원재료 선별 또는 전처리 단계 점검이 미약했을 가능성이 있음.',
    '보존·증빙 절차를 보강할 필요가 있었을 가능성이 있음.',
  ],
  기타: [
    '정보 분류가 늦어 점검 범위가 불안정해졌을 가능성이 있음.',
    '전달 채널 이관이 분산되었을 가능성이 있음.',
    '운영 기록 업데이트가 즉시 반영되지 않았을 가능성이 있음.',
  ],
}

const preventionTemplateByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '배식 전 최종 검수 항목으로 모니터링을 보강하겠음.',
    '조리복·위생 모자 상태 확인을 정례화하겠음.',
    '동일 조리분 이탈 체크를 상시 점검하겠음.',
  ],
  벌레: [
    '원물 세척과 선별 과정을 단계별로 분리하겠음.',
    '해충 유입 취약 구간 점검 주기를 강화하겠음.',
    '보관 상태와 선별 기준을 다시 안내하겠음.',
  ],
  '비닐/플라스틱': [
    '포장재 제거 기준을 단계별로 고정하겠음.',
    '조립·제공 간 최종 확인 절차를 강화하겠음.',
    '전처리자 대상 체크리스트를 정비하겠음.',
  ],
  '뼈/가시': [
    '원재료 특성 반영 선별 기준을 재안내하겠음.',
    '조리 후 가시 제거 이력과 조리분 점검을 강화하겠음.',
    '고객 안내 기준을 사전 고지하겠음.',
  ],
  '이물 혼입': [
    '이물 통제 공정을 분리 점검하고 기준을 보완하겠음.',
    '동일 조리분 이중 확인을 의무화하겠음.',
    '조리·배식 최종 확인 책임자를 고정하겠음.',
  ],
  품절: [
    '수요 예측과 준비량 반영 기준을 재점검하겠음.',
    '차수별 집계 체계를 보완하겠음.',
    '동일 메뉴 집중 구간 대응 매뉴얼을 정교화하겠음.',
  ],
  염도: [
    '염도 측정 항목과 중간 점검 기준을 보완하겠음.',
    '레시피 기준 공유를 다시 정비하겠음.',
    '고객 기호차이 대응 가이드를 업데이트하겠음.',
  ],
  품질: [
    '메뉴군별 기준 비교 프로세스를 정비하겠음.',
    '중간·최종 상태 점검 주기를 보완하겠음.',
    '동일 조리분 교차 점검을 강화하겠음.',
  ],
  '양 부족': [
    '기준 제공량과 추가 배식 판단 기준을 재설계하겠음.',
    '메뉴 구성 균형 반영 범위를 보완하겠음.',
    '수요 집중 구간 관리 절차를 강화하겠음.',
  ],
  '위생 불만': [
    '청결 점검 주기를 단기 단위로 단축하겠음.',
    '테이블·배식대 정리 프로세스를 강화하겠음.',
    '현장 정리 상태 기록 방식을 보완하겠음.',
  ],
  '직원 응대': [
    '응대 스크립트와 이관 절차를 재점검하겠음.',
    '고객 안내 교육을 주기적으로 진행하겠음.',
    '오류 재발 구간을 사례로 공유하겠음.',
  ],
  '식중독 의심': [
    '고객 상태 확인 절차를 빠르게 연동하겠음.',
    '섭취 메뉴 추적 및 보존 이력 점검 체계를 보완하겠음.',
    '동일 증상 확인을 위한 보고 체계를 선제 강화하겠음.',
  ],
  안전사고: [
    '고객 상태 확인 공유 체계를 상시화하겠음.',
    '원재료 선별 및 전처리 점검 지점을 추가하겠음.',
    '조리·배식 최종 검수 책임 분리를 강화하겠음.',
  ],
  기타: [
    '분류·이관 기준을 단순화하겠음.',
    '조치 기록 템플릿을 보완하겠음.',
    '추적 항목을 사전 체크리스트로 운영하겠음.',
  ],
}

const customerResponseCoreByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '해당 메뉴의 조리·배식 과정과 위생모 착용 상태를 다시 점검하겠습니다.',
    '현장에서 말씀 주신 내용은 내부 기준에 맞춰 재검토하겠습니다.',
    '동일한 불편이 반복되지 않도록 확인 절차를 강화하겠습니다.',
  ],
  벌레: [
    '해당 메뉴와 전처리·세척 과정을 다시 점검하겠습니다.',
    '현장에서 말씀 주신 내용은 관련 기준으로 재검토하겠습니다.',
    '동일한 불편이 반복되지 않도록 위생 점검을 강화하겠습니다.',
  ],
  '비닐/플라스틱': [
    '해당 메뉴의 포장재 제거와 조립 과정을 다시 점검하겠습니다.',
    '현장에서 말씀 주신 내용은 조리·배식 기준으로 재점검하겠습니다.',
    '동일한 불편이 반복되지 않도록 제공 전 확인 절차를 강화하겠습니다.',
  ],
  '뼈/가시': [
    '해당 메뉴의 손질·조리 상태를 다시 점검하겠습니다.',
    '관련 메뉴의 기준 이력도 함께 확인하겠습니다.',
    '동일한 불편이 반복되지 않도록 최종 확인을 강화하겠습니다.',
  ],
  '이물 혼입': [
    '해당 메뉴의 조리·배식 과정을 다시 확인하겠습니다.',
    '말씀하신 이물 우려 내용을 내부 기준에 따라 점검하겠습니다.',
    '동일한 불편이 반복되지 않도록 확인을 강화하겠습니다.',
  ],
  품절: [
    '해당 메뉴의 준비 수량과 소진 시 대체 안내 기준을 다시 점검하겠습니다.',
    '현장에서 말씀 주신 내용을 기준으로 수요 반영을 점검하겠습니다.',
    '유사 사례가 줄어들도록 운영 체계를 보강하겠습니다.',
  ],
  염도: [
    '해당 메뉴의 표준 레시피와 조리 중 간 확인 절차를 다시 점검하겠습니다.',
    '말씀하신 맛 편차는 조리 과정으로 재확인하겠습니다.',
    '동일한 불편이 반복되지 않도록 조정 체계를 강화하겠습니다.',
  ],
  품질: [
    '해당 메뉴의 기준 적용 과정을 다시 점검하겠습니다.',
    '현장에서 말씀 주신 내용을 조리·배식 기준으로 재확인하겠습니다.',
    '동일한 불편이 반복되지 않도록 확인 절차를 강화하겠습니다.',
  ],
  '양 부족': [
    '해당 메뉴의 제공량 산정과 배식량 조정 기준을 다시 점검하겠습니다.',
    '고객께 안내된 내용을 확인하고 기준 보완을 준비하겠습니다.',
    '동일한 불편이 반복되지 않도록 점검 프로세스를 강화하겠습니다.',
  ],
  '위생 불만': [
    '해당 메뉴 제공과 함께 테이블·집기·배식대 청결 점검을 재확인하겠습니다.',
    '말씀 주신 불편은 신속히 반영해 확인 항목을 보완하겠습니다.',
    '동일한 불편이 반복되지 않도록 운영 기준을 강화하겠습니다.',
  ],
  '직원 응대': [
    '당시 응대 상황을 확인하고, 안내 방식과 응대 태도를 다시 점검하겠습니다.',
    '고객 응대 과정은 다시 정리해 동일한 이슈를 방지하겠습니다.',
    '동일한 불편이 반복되지 않도록 교육과 절차를 강화하겠습니다.',
  ],
  '식중독 의심': [
    '해당 건은 고객 상태 확인을 우선으로 두고 현재 점검하고 있습니다.',
    '제공 메뉴 및 잔식 확인 절차를 다시 점검하겠습니다.',
    '추가 조치를 확인해 신속히 공유드리겠습니다.',
  ],
  안전사고: [
    '해당 건은 고객님 말씀을 우선 확인하고 있으며, 메뉴 확인을 재점검하겠습니다.',
    '고객 상태 확인과 함께 잔식 및 제공 이력도 확인 중입니다.',
    '동일 사례가 반복되지 않도록 확인 절차를 강화하겠습니다.',
  ],
  기타: [
    '접수 내용을 기준에 맞춰 정리한 뒤, 해당 운영 구간을 재점검하겠습니다.',
    '현장 확인 결과를 반영해 조치 계획을 정리하겠습니다.',
    '동일한 불편이 반복되지 않도록 관련 절차를 점검하겠습니다.',
  ],
}

const customerClosingLine = '소중한 의견 감사합니다.'

/** 고객사 보고용: 원인 확인 계획 (예정형, 원인 단정 없음) */
const clientCheckByCategory: Record<CategoryType, string> = {
  머리카락: '원인 확인을 위해 위생모·작업복 착용 상태와 조리·배식 전 최종 확인 절차, 동일 조리분 상태를 점검하겠습니다.',
  벌레: '원인 확인을 위해 원물 세척·선별 과정과 잎채소류 잎 사이 확인 여부, 식재료 보관 상태 등 전처리 공정을 점검하겠습니다.',
  '비닐/플라스틱': '원인 확인을 위해 포장재 제거 여부와 전처리 검수, 조립 공정, 제공 전 최종 확인 절차를 점검하겠습니다.',
  '뼈/가시': '원인 확인을 위해 원재료 특성과 전처리 선별, 조리 후 확인 절차를 점검하겠습니다.',
  '이물 혼입': '원인 확인을 위해 이물의 성상과 유입 가능 공정, 동일 조리분 상태를 확인하겠습니다.',
  품절: '원인 확인을 위해 예상 식수와 실제 이용량, 차수별 준비량을 비교하겠습니다.',
  염도: '원인 확인을 위해 표준 레시피와 기준 염도, 조리 중간 점검 기록, 국물·소스의 편차를 점검하겠습니다.',
  품질: '원인 확인을 위해 해당 메뉴의 조리 기준 준수 여부와 제공 상태를 점검하겠습니다.',
  '양 부족': '원인 확인을 위해 기준 제공량과 실제 배식량, 배식 담당자별 편차를 확인하겠습니다.',
  '위생 불만': '지적해 주신 구역의 청결 상태와 점검 주기 준수 여부를 확인하겠습니다.',
  '직원 응대': '당시 응대 상황과 안내 내용을 확인하고, 고객님의 의견을 바탕으로 응대 방식을 점검하겠습니다.',
  '식중독 의심':
    '동일 메뉴 섭취자 중 유사 증상 발생 여부와 보관·조리 온도 기록을 확인하겠으며, 원인은 확인 결과에 따라 판단하겠습니다.',
  안전사고: '원재료 특성과 전처리 선별, 조리·배식 과정을 점검하겠으며, 확인 전까지 원인을 단정하지 않겠습니다.',
  기타: '접수 내용의 사실관계를 확인하고 관련 운영 과정을 점검하겠습니다.',
}

/** 고객사 보고용: 재발방지 (예정형) */
const clientPreventionByCategory: Record<CategoryType, string> = {
  머리카락: '향후 위생모 착용 점검과 배식 전 최종 확인을 강화해 동일 사례를 예방하겠습니다.',
  벌레: '향후 잎채소류 세척·선별 기준을 재교육하고 전처리 단계 확인을 강화하겠습니다.',
  '비닐/플라스틱': '향후 포장재 제거 후 확인 절차와 제공 전 최종 점검을 강화하겠습니다.',
  '뼈/가시': '향후 원재료 전처리 선별과 조리 후 확인을 강화하고, 필요 시 메뉴 안내 문구를 보완하겠습니다.',
  '이물 혼입': '향후 공정별 이물 점검과 제공 전 최종 확인을 강화하겠습니다.',
  품절: '향후 이용 데이터를 반영해 차수별 준비량을 조정하고, 소진 시 추가 조리·대체 메뉴 기준을 보완하겠습니다.',
  염도: '향후 표준 레시피 준수와 조리 중간 염도 점검을 강화하겠습니다.',
  품질: '향후 조리 기준 준수 여부와 제공 전 품질 확인을 강화하겠습니다.',
  '양 부족': '향후 기준 제공량에 맞춘 배식 도구 사용과 배식 편차 점검을 강화하겠습니다.',
  '위생 불만': '향후 식사 시간대 청결 점검 주기를 보완하고 점검 기록을 관리하겠습니다.',
  '직원 응대': '향후 고객 응대 교육을 실시하고 현장 관리를 강화하겠습니다.',
  '식중독 의심': '확인 결과에 따라 필요한 개선 조치를 마련하고, 관련 지침에 따른 후속 절차를 이행하겠습니다.',
  안전사고: '확인 결과에 따라 원재료 선별과 배식 전 최종 검수 절차를 보완하겠습니다.',
  기타: '확인 결과에 따라 필요한 개선 조치를 마련하겠습니다.',
}

/** 고객사 보고용 유형 표현 */
const clientIssueLabelByCategory: Record<CategoryType, string> = {
  머리카락: '머리카락 이물',
  벌레: '벌레 이물',
  '비닐/플라스틱': '비닐·플라스틱 이물',
  '뼈/가시': '뼈·가시 혼입',
  '이물 혼입': '이물 혼입',
  품절: '조기 품절',
  염도: '염도(간)',
  품질: '음식 품질',
  '양 부족': '제공량 부족',
  '위생 불만': '위생 상태',
  '직원 응대': '직원 응대',
  '식중독 의심': '식사 후 이상 증상',
  안전사고: '식사 중 치아 불편',
  기타: '이용 불편',
}

const menuRelatedCategories: CategoryType[] = [
  '머리카락',
  '벌레',
  '비닐/플라스틱',
  '뼈/가시',
  '이물 혼입',
  '품절',
  '염도',
  '품질',
  '양 부족',
]

/** 고객용: 사과 문장에 들어갈 상황 표현. {t}는 메뉴명(없으면 '음식') */
const customerIssueByCategory: Record<CategoryType, string> = {
  머리카락: '제공된 {t}에서 머리카락이 발견되어',
  벌레: '제공된 {t}에서 벌레가 발견되어',
  '비닐/플라스틱': '제공된 {t}에서 비닐 등 이물이 발견되어',
  '뼈/가시': '제공된 {t}에서 뼈나 가시가 나와',
  '이물 혼입': '제공된 {t}에서 이물이 발견되어',
  품절: '{t:이/가} 일찍 소진되어',
  염도: '{t}의 간이 맞지 않아',
  품질: '{t}의 품질이 기대에 미치지 못해',
  '양 부족': '{t}의 제공량이 충분하지 않아',
  '위생 불만': '식당 위생 상태로 인해',
  '직원 응대': '직원 응대 과정에서',
  '식중독 의심': '',
  안전사고: '',
  기타: '{t} 이용 과정에서',
}

type InternalReactionText = Record<CustomerReaction, string>

const reactionToInternal: InternalReactionText = {
  '괜찮다고 함': '고객은 응대 후 괜찮다는 의사를 밝힘.',
  '불쾌감 표현': '고객이 불쾌감을 표현함.',
  '연락처 남김': '고객이 후속 안내를 위해 연락처를 남김.',
  '보상 요청': '고객이 보상을 요청하여 내부 기준에 따른 검토가 필요함.',
  '고객사 공유 필요': '고객사 공유가 필요한 건으로 판단됨.',
  미확인: '고객 반응은 추가 확인이 필요함.',
}

/** 현장 조치(완료) 명사형 표현 */
const doneActionNoun: Record<Exclude<OnsiteAction, '현장 확인 중'>, string> = {
  '고객 응대': '고객 응대',
  '음식 교체': '음식 교체',
  '메뉴 회수': '해당 메뉴 회수',
  '동일 조리분 확인': '동일 조리분 확인',
  '사진 기록': '사진 기록',
  '고객사 보고': '고객사 1차 보고',
}

/** 사내 보고용: 유형별 확인 필요 사항 (예정형) */
const internalCheckByCategory: Record<CategoryType, string> = {
  머리카락: '위생모·작업복 착용 상태와 배식 전 최종 확인 절차 점검 예정임.',
  벌레: '원물 세척·선별 및 잎채소류 잎 사이 확인 여부, 식재료 보관 상태 점검 예정임.',
  '비닐/플라스틱': '포장재 제거 여부와 전처리·조립 공정, 제공 전 최종 확인 절차 점검 예정임.',
  '뼈/가시': '원재료 특성 확인 및 전처리 선별, 조리 후 확인 절차 점검 예정임.',
  '이물 혼입': '이물 성상 확인 및 유입 가능 공정(전처리·조리·배식) 점검 예정임.',
  품절: '예상 식수 대비 실제 이용량과 차수별 준비량 확인 필요함.',
  염도: '표준 레시피 대비 간 상태와 조리 중간 점검 기록 확인 필요함.',
  품질: '해당 메뉴의 조리 기준 준수 여부와 제공 상태 확인 필요함.',
  '양 부족': '기준 제공량 대비 실제 배식량 편차 확인 필요함.',
  '위생 불만': '지적된 구역의 청결 상태와 점검 주기 준수 여부 확인 필요함.',
  '직원 응대': '당시 응대 상황과 안내 내용 확인 필요함.',
  '식중독 의심': '동일 메뉴 섭취자 중 유사 증상 발생 여부와 보관·조리 온도 기록 확인 필요함.',
  안전사고: '원재료 특성과 전처리 선별, 조리·배식 과정 점검 예정임.',
  기타: '접수 내용의 사실관계 확인 필요함.',
}

/** 고위험 유형: 반드시 포함해야 하는 조치. done 조건이 충족되면 해당 줄은 생략 */
const highRiskRequiredLines: Partial<Record<CategoryType, Array<{ text: string; doneWhen?: OnsiteAction }>>> = {
  '식중독 의심': [
    { text: '고객 상태와 증상, 섭취 메뉴·시간 확인 필요함(원인 단정 금지).' },
    { text: '보존식 및 관련 기록 보존, 내부 긴급 보고와 관련 지침에 따른 조치 필요함.', doneWhen: '고객사 보고' },
  ],
  안전사고: [
    { text: '고객 상태 확인 및 필요 시 의료기관 안내 필요함.' },
    { text: '제공 메뉴·잔식·현물 보존 및 사진 기록 필요함.', doneWhen: '메뉴 회수' },
    { text: '고객사 및 내부 보고 필요함.', doneWhen: '고객사 보고' },
  ],
}

const cookingQualityOverrides = {
  incident: '{{menu}}의 조리 상태가 충분하지 않다는 고객 의견이 접수됨.',
  internalCheck: '해당 메뉴의 가열 시간·조리 온도 준수 여부와 동일 조리분 상태 확인 필요함.',
  internalPrevention: '메뉴별 가열 시간·조리 온도 기준을 재교육하고 제공 전 조리 상태 확인을 강화하겠음.',
  clientIssue: '조리 상태 불량',
  clientCheck: '원인 확인을 위해 해당 메뉴의 가열 시간과 조리 온도, 중심부 조리 상태, 동일 조리분 상태를 점검하겠습니다.',
  clientPrevention: '향후 메뉴별 가열 시간과 조리 온도 기준을 재교육하고, 제공 전 조리 상태 확인을 강화하겠습니다.',
  customerIssue: '{t}의 조리 상태가 충분하지 않아',
  customerCheck: '말씀 주신 내용을 바탕으로 해당 메뉴의 조리 온도와 가열 시간, 배식 전 확인 절차를 다시 점검하겠습니다.',
  customerPrevention:
    '또한 동일한 불편이 반복되지 않도록 관련 담당자와 조리 기준을 재확인하고, 메뉴 제공 전 최종 확인을 강화하겠습니다.',
}

// ───────────────────────── 한국어 처리 ─────────────────────────

function fillTarget(template: string, target: string) {
  return template.replace(/\{t:([^/}]+)\/([^}]+)\}/g, (_, a, b) => attachJosa(target, `${a}/${b}`)).replace(/\{t\}/g, target)
}

function joinNouns(nouns: string[]) {
  return nouns.join(', ')
}

// ───────────────────────── 공통 유틸 ─────────────────────────

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function toSafeText(value: string, fallback: string) {
  const text = value.trim().replace(/\s+/g, ' ')
  return text.length > 0 ? text : fallback
}

function normalizeDate(value: string) {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  const hour = parsed.getHours()
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  const ampm = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${parsed.getFullYear()}. ${month}. ${day}. ${ampm} ${displayHour}:${minute}`
}

/** 사업장명에 이미 '식당' 등 업장 표현이 있으면 덧붙이지 않습니다. */
function formatRestaurantName(siteName: string) {
  const trimmed = siteName.trim()
  if (!trimmed) return fallbackValues.workplace
  if (/(식당|카페|라운지|키친|다이닝|푸드코트|레스토랑)/.test(trimmed)) return trimmed
  return `${trimmed} 식당`
}

/** 고객사 담당자 호칭: 비어 있으면 '담당자님', 이미 '님'으로 끝나면 그대로 */
function formatContactTitle(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return '담당자님'
  if (trimmed.endsWith('님')) return trimmed
  return `${trimmed} 님`
}

function sanitizeOutput(value: string) {
  return value
    .replace(/\.{3,}|…/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function dedupeSentences(lines: string[]) {
  const seen = new Set<string>()
  const output: string[] = []

  for (const raw of lines) {
    const line = sanitizeOutput(raw)
    if (!line) continue
    const key = line.replace(/[^\p{L}\p{N}]/gu, '')
    if (key.length < 2 || seen.has(key)) continue
    seen.add(key)
    output.push(line)
  }

  return output
}

function hashSeed(value: string) {
  return Array.from(value).reduce((acc, char) => (acc * 131 + char.charCodeAt(0)) % 2147483647, 17)
}

/** 같은 입력이면 같은 결과가 나오도록 시드 기반으로 고릅니다. */
function pickBySeed(items: string[], seed: string, count: number) {
  const deduped = dedupeSentences(items)
  if (deduped.length === 0) return []
  if (deduped.length <= count) return deduped

  const start = hashSeed(seed) % deduped.length
  const output: string[] = []
  for (let i = 0; i < count; i += 1) {
    output.push(deduped[(start + i) % deduped.length])
  }

  return output
}

function replaceTemplate(text: string, context: ReturnType<typeof buildContext>) {
  return text
    .replace(/\{\{menu:([^/}]+)\/([^}]+)\}\}/g, (_, a, b) => attachJosa(context.menu, `${a}/${b}`))
    .replace(/\{\{menu\}\}/g, context.menu)
    .replace(/\{\{keyword\}\}/g, context.keyword)
    .replace(/\{\{category\}\}/g, context.categoryLabel)
}

const knownCategories: CategoryType[] = [
  '머리카락',
  '벌레',
  '비닐/플라스틱',
  '뼈/가시',
  '이물 혼입',
  '품절',
  '염도',
  '품질',
  '양 부족',
  '위생 불만',
  '직원 응대',
  '식중독 의심',
  '안전사고',
]

/**
 * 유형 판정은 사용자가 직접 입력한 키워드와 메모만 사용합니다.
 * 고객 정보(예: '점심시간')나 유사 사례 본문은 판정에 섞지 않습니다.
 * 키워드로 판정되지 않을 때만 사용자가 고른 유사 사례의 카테고리를 참고합니다.
 */
export function resolveCategory(form: Pick<ReportFormState, 'keyword' | 'memo'>, selectedCase: VocCase | null) {
  const source = normalizeText([form.keyword, form.memo].join(' '))
  let baseCategory: CategoryType = detectReportCategory(source)

  if (baseCategory === '기타' && selectedCase && knownCategories.includes(selectedCase.category as CategoryType)) {
    baseCategory = selectedCase.category as CategoryType
  }

  const sourceNoSpace = source.replace(/\s+/g, '')
  const isCookingQuality =
    baseCategory === '품질' &&
    QUALITY_COOKING_STATUS_KEYWORDS.some((keyword) => {
      const lower = keyword.toLowerCase()
      return source.includes(lower) || sourceNoSpace.includes(lower.replace(/\s+/g, ''))
    })

  const isSafety = baseCategory === '안전사고'

  return {
    baseCategory,
    displayLabel: isSafety ? safetyDisplayLabel : isCookingQuality ? cookingQualityDisplayLabel : baseCategory,
    isSafety,
    isCookingQuality,
    isHighRisk: isSafety || baseCategory === '식중독 의심',
  }
}

function buildContext(form: ReportFormState, selectedCase: VocCase | null) {
  const resolved = resolveCategory(form, selectedCase)
  const doneActions = form.onsiteActions.filter(
    (action): action is Exclude<OnsiteAction, '현장 확인 중'> => action !== '현장 확인 중',
  )

  return {
    workplace: formatRestaurantName(form.workplace),
    restaurantManagerName: toSafeText(form.restaurantManagerName, fallbackValues.restaurantManagerName),
    contactTitle: formatContactTitle(form.clientContactName),
    hasMenu: form.menuName.trim().length > 0,
    menu: toSafeText(form.menuName, fallbackValues.menu),
    keyword: toSafeText(form.keyword, fallbackValues.keyword),
    customerInfo: toSafeText(form.customerInfo, fallbackValues.customerInfo),
    memo: toSafeText(form.memo, ''),
    occurredAt: normalizeDate(form.occurredAt),
    category: resolved.baseCategory,
    categoryLabel: resolved.displayLabel,
    isSafety: resolved.isSafety,
    isCookingQuality: resolved.isCookingQuality,
    isHighRisk: resolved.isHighRisk,
    doneActions,
    doneNouns: doneActions.map((action) => doneActionNoun[action]),
    isChecking: form.onsiteActions.includes('현장 확인 중'),
    hasInspected: doneActions.some((action) => action === '동일 조리분 확인' || action === '메뉴 회수' || action === '사진 기록'),
    reactions: form.customerReactions,
  }
}

type ReportContext = ReturnType<typeof buildContext>

// ───────────────────────── 사내 보고용 ─────────────────────────

function createIncidentLines(context: ReportContext, form: ReportFormState) {
  const category = context.category
  const firstLine = context.isCookingQuality
    ? cookingQualityOverrides.incident
    : incidentTemplateByCategory[category][0]

  const reactionLimit = form.reportDetailLevel === '짧게' ? 0 : form.reportDetailLevel === '보통' ? 1 : 3
  const reactionLines = context.reactions.slice(0, reactionLimit).map((reaction) => reactionToInternal[reaction])

  let statusLine = ''
  if (context.doneActions.length === 0) {
    statusLine = context.isChecking
      ? '현장 확인을 진행하고 있음.'
      : '현장 확인 결과가 입력되지 않아 추가 확인 필요함.'
  } else if (context.isChecking) {
    statusLine = '현장 확인을 계속 진행하고 있음.'
  }

  return dedupeSentences([
    replaceTemplate(firstLine, context),
    ...reactionLines,
    statusLine,
    context.memo ? `현장 메모: ${context.memo}` : '',
  ])
}

function createActionLines(context: ReportContext, form: ReportFormState) {
  const category = context.category
  const config = detailConfig[form.reportDetailLevel]
  const seedBase = `${lineSeedSeed}|action|${context.menu}|${context.categoryLabel}`

  const doneLine =
    context.doneNouns.length > 0 ? `${attachJosa(joinNouns(context.doneNouns), '을/를')} 완료함.` : ''

  const requiredLines = (highRiskRequiredLines[category] ?? [])
    .filter((item) => !item.doneWhen || !context.doneActions.includes(item.doneWhen as Exclude<OnsiteAction, '현장 확인 중'>))
    .map((item) => item.text)

  const checkLine = context.isCookingQuality ? cookingQualityOverrides.internalCheck : internalCheckByCategory[category]
  const causeLine = context.isHighRisk ? '' : pickBySeed(causeTemplateByCategory[category], `${seedBase}|cause`, 1)[0] ?? ''

  const fixed = dedupeSentences([doneLine, ...requiredLines, checkLine, causeLine])
  const preventionPool = context.isCookingQuality
    ? [cookingQualityOverrides.internalPrevention, ...preventionTemplateByCategory[category]]
    : preventionTemplateByCategory[category]
  const preventionCount = Math.max(1, config.actionCount - fixed.length)
  const prevention = context.isCookingQuality
    ? preventionPool.slice(0, preventionCount)
    : pickBySeed(preventionPool, `${seedBase}|prevent`, preventionCount)

  if (form.customerReactions.includes('보상 요청')) {
    prevention.push('보상 관련 사항은 내부 기준과 고객사 협의에 따라 검토 예정임.')
  }

  return dedupeSentences([...fixed, ...prevention])
}

function ensureInternalStyle(line: string) {
  return line.replace(/합니다\.$/g, '함.')
}

function buildInternalReport(form: ReportFormState, selectedCase: VocCase | null): string {
  const context = buildContext(form, selectedCase)
  const incident = createIncidentLines(context, form)
  const action = createActionLines(context, form)

  return [
    '[고객 VOC 사고 보고]',
    '',
    `1.사업장 : ${context.workplace}`,
    `(식당관리자 : ${context.restaurantManagerName})`,
    '',
    `2.VOC 유형 : ${context.categoryLabel}`,
    '',
    `3.발생 일시 : ${context.occurredAt || fallbackValues.occurredAt}`,
    '',
    `4.고객 정보 : ${context.customerInfo}`,
    '',
    '5.발생 내용',
    ...incident.map((line) => `- ${ensureInternalStyle(line)}`),
    '',
    '6.조치 사항 및 계획',
    ...action.map((line) => `- ${ensureInternalStyle(line)}`),
    '',
    '이상입니다.',
  ]
    .map((line) => sanitizeOutput(line))
    .join('\n')
}

// ───────────────────────── 고객사 보고용 ─────────────────────────

function buildClientReport(form: ReportFormState, selectedCase: VocCase | null): string {
  const context = buildContext(form, selectedCase)
  const category = context.category

  const issueLabel = context.isCookingQuality ? cookingQualityOverrides.clientIssue : clientIssueLabelByCategory[category]
  const menuPart = context.hasMenu && menuRelatedCategories.includes(category) ? `${context.menu}의 ` : ''
  const whenPart = context.occurredAt ? `${context.occurredAt}경 ` : ''

  const greeting = `안녕하세요, ${context.contactTitle}. ${context.workplace}입니다.`
  const usagePart = context.isHighRisk ? '' : '식당 이용 중 '
  const overview = `${whenPart}${usagePart}${menuPart}${issueLabel} 관련 고객 의견이 접수되어 보고드립니다.`

  const statusParts: string[] = []
  if (context.isSafety) {
    statusParts.push(
      '무엇보다 고객님의 상태 확인을 최우선으로 하고 있으며, 제공 메뉴와 잔식 등 관련 현물을 보존해 확인하겠습니다.',
    )
  } else if (category === '식중독 의심') {
    statusParts.push(
      '고객님의 증상과 섭취 메뉴를 우선 확인하고, 보존식과 관련 기록을 보존해 내부 기준에 따라 신속히 보고·대응하겠습니다.',
    )
  }
  if (context.doneNouns.length > 0) {
    statusParts.push(`현장에서는 ${attachJosa(joinNouns(context.doneNouns), '을/를')} 진행하였습니다.`)
  }
  if (context.isChecking) {
    statusParts.push('현재 현장 확인을 진행하고 있습니다.')
  }
  if (context.doneNouns.length === 0 && !context.isChecking && !context.isHighRisk) {
    statusParts.push('접수된 내용을 바탕으로 현장 확인을 진행할 예정입니다.')
  }
  if (context.reactions.includes('보상 요청')) {
    statusParts.push('고객께서 요청하신 보상 관련 사항은 관련 기준에 따라 검토 후 협의드리겠습니다.')
  }
  if (context.reactions.includes('연락처 남김')) {
    statusParts.push('고객께서 연락처를 남겨 주셔서 확인 결과를 개별 안내드릴 예정입니다.')
  }

  const check = context.isCookingQuality ? cookingQualityOverrides.clientCheck : clientCheckByCategory[category]
  const prevention = context.isCookingQuality
    ? cookingQualityOverrides.clientPrevention
    : clientPreventionByCategory[category]

  const followUp =
    form.responseIntensity === '일반'
      ? '확인 결과와 개선 사항은 정리되는 대로 추가로 공유드리겠습니다.'
      : '사안의 중요도를 고려해 진행 상황을 단계별로 신속히 공유드리겠습니다.'

  const paragraphs = [
    greeting,
    overview,
    statusParts.join(' '),
    form.reportDetailLevel === '짧게' ? `${check} ${prevention}` : check,
    form.reportDetailLevel === '짧게' ? '' : prevention,
    `${followUp}\n감사합니다.`,
  ]

  return paragraphs
    .map((paragraph) => paragraph.split('\n').map(sanitizeOutput).join('\n'))
    .filter((paragraph) => paragraph.length > 0)
    .join('\n\n')
}

// ───────────────────────── 고객용 ─────────────────────────

function buildCustomerMessage(form: ReportFormState, selectedCase: VocCase | null): string {
  const context = buildContext(form, selectedCase)
  const category = context.category
  const target = context.hasMenu ? context.menu : '음식'

  const greeting = `안녕하세요, ${context.workplace}입니다.`

  let apology: string
  let check: string
  let prevention: string

  if (context.isSafety) {
    apology = '식사 중 딱딱한 물질로 치아에 불편을 겪으셨다는 말씀을 듣고 많이 놀라셨을 것 같아 진심으로 죄송합니다.'
    check =
      '무엇보다 고객님의 상태가 가장 중요합니다. 불편하신 부분이 있으시면 바로 말씀해 주시고, 진료 안내 등 필요한 사항을 도와드리겠습니다.'
    prevention =
      '말씀 주신 메뉴와 관련 현물을 보존해 원재료와 조리·배식 과정을 확인하겠으며, 확인되는 내용은 신속히 안내드리겠습니다.'
  } else if (category === '식중독 의심') {
    apology = '식사 후 몸이 불편하셨다는 말씀을 듣고 걱정이 큽니다. 불편을 드려 진심으로 죄송합니다.'
    check =
      '무엇보다 고객님의 건강 상태가 가장 중요합니다. 증상이 계속되시면 의료기관 진료를 받으시길 권해 드리며, 필요하신 사항은 말씀해 주시면 도와드리겠습니다.'
    prevention = '섭취하신 메뉴와 관련 기록을 확인하고 관련 기준에 따라 신속히 조치하겠으며, 확인되는 내용은 안내드리겠습니다.'
  } else {
    const issue = fillTarget(
      context.isCookingQuality ? cookingQualityOverrides.customerIssue : customerIssueByCategory[category],
      target,
    )
    apology = `${issue} 식사 이용에 불편을 드린 점 진심으로 죄송합니다.`

    const core = customerResponseCoreByCategory[category]
    const intro = context.hasInspected ? '말씀 주신 내용은 현장에서 바로 확인하였으며, ' : ''
    const baseCheck = context.isCookingQuality ? cookingQualityOverrides.customerCheck : core[0]
    check = intro ? `${intro}${baseCheck.replace(/^말씀 주신 내용을 바탕으로 /, '')}` : baseCheck
    if (context.doneActions.includes('음식 교체')) {
      check = `${check} 불편을 드린 음식은 교체해 드렸습니다.`
    }
    prevention = context.isCookingQuality ? cookingQualityOverrides.customerPrevention : core[2]
  }

  if (context.reactions.includes('보상 요청')) {
    prevention = `${prevention} 요청하신 사항은 관련 기준에 따라 검토 후 안내드리겠습니다.`
  }
  if (context.reactions.includes('연락처 남김')) {
    prevention = `${prevention} 확인 결과는 남겨 주신 연락처로 안내드리겠습니다.`
  }

  return [greeting, apology, check, prevention, customerClosingLine].map(sanitizeOutput).join('\n\n')
}

export function generateCustomerMessage(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildCustomerMessage(form, selectedCase)
}

export function generateInternalReport(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildInternalReport(form, selectedCase)
}

export function generateClientReport(form: ReportFormState, selectedCase: VocCase | null): string {
  return buildClientReport(form, selectedCase)
}

export function generateReportContents(form: ReportFormState, selectedCase: VocCase | null): GeneratedReport {
  return {
    customerMessage: generateCustomerMessage(form, selectedCase),
    internalReport: generateInternalReport(form, selectedCase),
    clientReport: generateClientReport(form, selectedCase),
  }
}
