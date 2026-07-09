import { detectReportCategory, QUALITY_COOKING_STATUS_KEYWORDS } from '../data/reportSentenceTemplates'
import { type VocCase } from '../data/vocCases'

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

const safetyKeywords = [
  '치아',
  '치아 파절',
  '치아 파손',
  '치아 손상',
  '딱딱한 이물',
  '돌 씹음',
  '뼈 씹음',
  '이물 씹음',
  '통증',
]

const detailConfig: Record<ReportDetailLevel, { incidentCount: number; actionCount: number }> = {
  짧게: { incidentCount: 2, actionCount: 3 },
  보통: { incidentCount: 3, actionCount: 3 },
  자세히: { incidentCount: 4, actionCount: 4 },
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
    '{{menu}} 이용 중 머리카락 이물 의심 VOC가 접수됨.',
    '현장에서 배식 직전 표면·고정 상태를 확인함.',
    '고객 불편 내용은 조리·배식 단계와 연계해 접수됨.',
    '관련 메뉴의 동일 조리분 확인이 필요함.',
    '현장 안내 요청이 발생해 확인을 진행 중임.',
  ],
  벌레: [
    '{{menu}} 제공 과정에서 벌레 의심 제보가 접수됨.',
    '원물 세척·보관 상태와 전처리 결과를 현장에서 확인함.',
    '해당 시간대 작업 구간에서 접근차단 여부를 점검함.',
    '동일 조리분 확인이 필요하다는 요청이 있어 조치함.',
    '해당 건은 즉시 재점검 대상으로 분류함.',
  ],
  '비닐/플라스틱': [
    '{{menu}} 이용 중 포장재 잔류 의심 VOC가 접수됨.',
    '포장재 제거와 조립 단계의 연결이 적절했는지 확인함.',
    '현장에서 해당 메뉴 처리 이력 및 제공 상태를 확인함.',
    '동일 메뉴 회수 가능성이 있어 현물 점검을 진행함.',
    '조리 기준 대비 조립 절차 재확인이 필요함.',
  ],
  '뼈/가시': [
    '고객 제보로 {{menu}}에서 뼈·가시 유사 잔류가 제기됨.',
    '원재료 선별 단계와 손질 단계 연결을 점검함.',
    '동일 조리분 및 제공 상태를 즉시 확인함.',
    '고객 안내가 필요해 응대 절차를 진행함.',
    '재확인 대상 메뉴가 있어 후속 점검을 준비함.',
  ],
  '이물 혼입': [
    '{{menu}} 이용 중 이물 혼입 의심 VOC가 접수됨.',
    '해당 건은 조리·배식 연계 구간 확인 대상으로 분류됨.',
    '현장에서 표면 상태와 잔류 이물 후보를 검토함.',
    '고객 불편 내용 접수 건으로 즉시 재점검을 시작함.',
    '동일 조리분 재확인 결과를 수집함.',
  ],
  품절: [
    '{{menu}}가 이용 시간 중 조기 품절되어 이용 불편이 접수됨.',
    '수요 변동 및 차수별 준비량 미달 여부를 확인함.',
    '고객 안내 후 대체 메뉴 제공이 논의됨.',
    '현장에서 수량 집계와 추가 조리 가능성을 점검함.',
    '추가 확인 대상 수량 항목을 즉시 분리함.',
  ],
  염도: [
    '{{menu}} 맛 상태에서 짜기/싱거움 제보가 접수됨.',
    '기준 레시피 대비 간 맞춤 편차가 우려되어 확인함.',
    '현장 시식 기준표 점검이 필요해 조치함.',
    '고객 불편 접수 건으로 염도 관련 로그를 확인함.',
    '동일 조리분의 중간 조리점검 이력을 함께 검토함.',
  ],
  품질: [
    '{{menu}} 이용 중 일반 품질 이슈 제보가 접수됨.',
    '현장에서는 조리 기준 및 제공 상태를 확인함.',
    '고객 VOC 내용은 메뉴 상태 점검 대상으로 처리됨.',
    '동일 조리분과 대체 가능성을 함께 검토함.',
    '추가 확인 후 원인 후보를 정리할 예정임.',
  ],
  '양 부족': [
    '{{menu}} 이용 중 제공량 부족 VOC가 접수됨.',
    '기준 접시량과 실제 배식량 편차를 확인함.',
    '요청 건은 수요 집중 구간과 연계해 점검함.',
    '추가 제공 여부와 대응 이력도 함께 정리함.',
    '고객 안내 진행 후 조치 범위를 결정함.',
  ],
  '위생 불만': [
    '{{menu}} 이용 중 위생 상태 불편 제보가 접수됨.',
    '테이블·집기·배식대 청결 상태를 현장 확인함.',
    '고객 반응과 현장 정리 상태를 함께 점검함.',
    '위생 점검 주기 준수 여부를 확인함.',
    '추가 확인 사항은 보고서에 반영함.',
  ],
  '직원 응대': [
    '고객 응대 과정에서 VOC가 접수됨.',
    '안내 방식과 응대 속도에 대한 불편이 제기됨.',
    '현장에서 안내 이력 및 전달 내용을 확인함.',
    '고객 확인사항을 별도 정리해 재접속 필요 여부를 판단함.',
    '추가 안내 및 이관 기준을 점검함.',
  ],
  '식중독 의심': [
    '식사 후 이상 반응 제보가 접수되어 긴급 확인 대상이 됨.',
    '섭취 메뉴, 잔식, 상태 확인 건으로 조치가 시작됨.',
    '고객 상태 확인 후 안전 대응 채널로 이관함.',
    '보관·조리 이력과 보존 조건 점검이 필요함.',
    '현재 원인 단정은 보류하고 원인 후보를 추적함.',
  ],
  안전사고: [
    '식사 중 딱딱한 물질 씹은 후 치아 불편 호소 건이 접수됨.',
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

const actionTemplateByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '조리·배식 구간에서 모자/복장 위생 상태를 즉시 점검함.',
    '해당 조리분 배식 전 최종 외관 확인을 강화함.',
    '동일 조리분 교차 확인을 진행함.',
    '필요시 메뉴 회수 및 재배식 기준으로 처리함.',
  ],
  벌레: [
    '원물 세척, 선별, 소독 구간을 즉시 재확인함.',
    '저장·운반·출고 동선을 점검해 이물 유입 취약점을 보완함.',
    '잎채소류 잎 사이 확인 결과를 재점검함.',
    '현장 사진으로 확인 내역을 보완함.',
  ],
  '비닐/플라스틱': [
    '포장재 제거 작업을 반복 점검함.',
    '전처리 후 조립 단계 재확인으로 중복 검수를 적용함.',
    '제공 전 최종 검수 항목을 추가 확인함.',
    '유사 메뉴도 함께 점검해 재현 가능성을 낮춤함.',
  ],
  '뼈/가시': [
    '원재료 특성 기준을 기준대로 재안내하고 확인함.',
    '전처리 선별 과정을 재점검함.',
    '조리 후 해당 메뉴 및 동일 조리분 육안 확인을 실시함.',
    '고객 안내 필요 여부를 즉시 판단함.',
  ],
  '이물 혼입': [
    '조리·배식 전환 구간을 중심으로 즉시 재점검함.',
    '같은 조리분 출고 건을 추가로 추적함.',
    '작업 환경 정리 상태를 보강하고 이물 후보를 제거함.',
    '현장 확인 기록을 정리해 공유함.',
  ],
  품절: [
    '차수별 준비량과 수요 신호를 함께 확인함.',
    '대체 메뉴 제공 가능 여부와 공지 내용을 정리함.',
    '추가 조리 기준 적용 여부를 검토함.',
    '동일 시간대 수요 집중 징후를 별도로 분리함.',
  ],
  염도: [
    '기준 레시피와 배합량 기록을 비교함.',
    '중간 조리 점검 구간에서 염도 편차를 점검함.',
    '개인 기호 차이 가능성을 반영해 안내 범위를 조정함.',
    '샘플 재측정 결과와 이력 등록을 병행함.',
  ],
  품질: [
    '메뉴 제공 상태와 조리 기준 준수 여부를 확인함.',
    '동일 조리분의 기준 편차 가능성을 점검함.',
    '원재료와 조리 공정 이력을 함께 검토함.',
    '재발 방지 항목을 다음 회차 기준에 반영함.',
  ],
  '양 부족': [
    '기준 제공량 산정표와 실제 배식량 편차를 확인함.',
    '배식량 편차 항목을 조리반별로 정렬함.',
    '메뉴 구성 균형과 추가 제공 가능성을 점검함.',
    '동일 메뉴 반복 주문 구간을 재분석함.',
  ],
  '위생 불만': [
    '테이블·집기 청결 상태를 즉시 정리하고 사진으로 기록함.',
    '배식대 청결 및 현장 정리 동선을 재배치함.',
    '점검 주기를 임시 강화하고 확인자 서명을 확보함.',
    '고객 안내 메시지와 청결 개선 일정을 정리함.',
  ],
  '직원 응대': [
    '응대 표현과 안내 방식이 적절했는지 재정리함.',
    '고객 불편 청취 내용과 전달 채널을 점검함.',
    '직원 교육 항목에 해당 케이스를 반영함.',
    '향후 동일 유사 문의 처리 기준을 정비함.',
  ],
  '식중독 의심': [
    '고객 상태 확인과 보건 조치 필요 여부를 점검함.',
    '섭취 메뉴와 잔식, 보존·위생 기록을 검토함.',
    '동일 증상 발생 여부를 확인함.',
    '즉시 보고 필요성이 높아 관련망에 공유함.',
  ],
  안전사고: [
    '고객 상태 확인을 우선 진행함.',
    '제공 메뉴 및 잔식을 회수해 보존함.',
    '현물 증빙과 사진 기록을 정리함.',
    '원재료·전처리·조리·배식 점검을 연쇄 확인함.',
  ],
  기타: [
    '사례 성격에 맞는 우선 조치 항목을 분리함.',
    '기본 점검 범위를 재확인하고 처리 일정을 잡음.',
    '현장 확인 결과를 기록해 후속 조치를 정리함.',
    '관련 부서 공유 범위를 점검함.',
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
    '원재료 선별 강도가 약해 잔류 가능성이 있었을 가능성이 있음.',
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
    '해당 메뉴의 조리·배식 과정이 다시 확인될 수 있도록 점검하겠습니다.',
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
    '말씀하신 이물 우려 내용을 기준 기준으로 반영해 점검하겠습니다.',
    '동일한 불편이 반복되지 않도록 확인을 강화하겠습니다.',
  ],
  품절: [
    '해당 메뉴 수급 상황과 대체 안내 내용을 다시 정리하겠습니다.',
    '현장에서 말씀 주신 내용을 기준으로 수요 반영을 점검하겠습니다.',
    '유사 사례가 줄어들도록 운영 체계를 보강하겠습니다.',
  ],
  염도: [
    '해당 메뉴의 간 조정 이력을 기반으로 조리 기준을 다시 점검하겠습니다.',
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
    '안내 절차와 전달 내용을 기준에 맞게 다시 점검하겠습니다.',
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

const clientCoreByCategory: Record<CategoryType, string[]> = {
  머리카락: [
    '위생모 착용 상태, 조리복·개인위생, 배식 전 최종 검수 상태를 함께 점검하고 있습니다.',
    '동일 조리분의 재생산·배식 상태도 확인하여 조치 범위를 정리 중입니다.',
  ],
  벌레: [
    '원물 세척, 소독·선별, 잎채소류 잎 사이 확인을 중심으로 점검하고 있습니다.',
    '보관 상태와 작업 동선을 함께 확인하여 취약 구간을 정리 중입니다.',
  ],
  '비닐/플라스틱': [
    '포장재 제거, 전처리 확인, 조립 과정 점검을 함께 진행하고 있습니다.',
    '제공 전 최종 검수 항목을 재점검하고 공유 절차를 정리 중입니다.',
  ],
  '뼈/가시': [
    '원재료 특성, 전처리 선별, 조리 후 확인 항목을 검토하고 있습니다.',
    '고객 안내 필요성을 함께 확인해 조치 방안을 정리 중입니다.',
  ],
  '이물 혼입': [
    '이물 혼입 가능 구간의 수거·배식 이력과 관련 공정을 점검하고 있습니다.',
    '추가로 동일 조리분의 선별·검수 기록을 확인하고 있습니다.',
  ],
  품절: [
    '예상 식수, 차수별 준비량, 특정 시간대 수요를 함께 확인하고 있습니다.',
    '추가 조리·대체 제공 기준을 운영에서 적용할 수 있는지 검토하고 있습니다.',
  ],
  염도: [
    '기준 레시피, 염도계 점검, 중간 조리 점검 결과를 함께 정리하고 있습니다.',
    '개인 기호차이 가능성을 반영해 조정 방안을 점검하고 있습니다.',
  ],
  품질: [
    '조리 상태와 품질 항목을 기준으로 조리 조건을 다시 점검하고 있습니다.',
    '관련 메뉴의 동일 조리분 상태도 함께 확인하여 보완 방향을 정리 중입니다.',
  ],
  '양 부족': [
    '배식량 편차, 기준 제공량, 추가 제공 가능 여부를 중심으로 점검하고 있습니다.',
    '메뉴 구성 균형과 요청 처리 결과를 반영해 개선안을 정리 중입니다.',
  ],
  '위생 불만': [
    '테이블·집기 위생, 배식대 청결, 현장 정리 상태를 점검하고 있습니다.',
    '점검 주기 재설계와 운영 반영 항목을 정리하고 있습니다.',
  ],
  '직원 응대': [
    '응대 표현, 안내 방식, 고객 불편 청취 절차를 점검하고 있습니다.',
    '직원 재교육 범위와 안내 표준을 정리하고 있습니다.',
  ],
  '식중독 의심': [
    '섭취 메뉴 확인, 동일 증상 여부, 보존식·위생 기록을 확인하고 있습니다.',
    '고객 상태 확인과 보건 연계 필요 여부를 정리하고 즉시 공유하고 있습니다.',
  ],
  안전사고: [
    '고객 상태 확인, 제공 메뉴 및 잔식 확인, 현물 보존을 포함해 점검하고 있습니다.',
    '원재료 선별, 전처리, 조리·배식 과정을 중심으로 다시 확인 중입니다.',
  ],
  기타: [
    '접수된 건의 핵심 항목을 분리해 현장 확인과 보고 범위를 정리하고 있습니다.',
    '재확인 필요 항목을 운영 기준으로 정리해 내부 공유 중입니다.',
  ],
}

const clientIntensityByLevel: Record<ResponseIntensity, string[]> = {
  일반: [
    '관련 메뉴와 운영 공정을 확인해 필요 조치를 정리하겠습니다.',
    '후속 조정은 단계별로 공유드리겠습니다.',
  ],
  주의: [
    '관련 메뉴와 운영 공정을 함께 재점검하고 있습니다.',
    '확인 결과는 단계적으로 공유드리겠습니다.',
  ],
  중대: [
    '현장 조치 사항을 우선 확인하였고, 관련 공정 전반을 재점검하고 있습니다.',
    '필요 시 본사 및 고객사 보고 선행 후 결과를 바로 공유하겠습니다.',
  ],
}

const reactionToInternal: Record<CustomerReaction, string> = {
  '괜찮다고 함': '고객은 응대 후 추가 요청 없이 종료함.',
  '불쾌감 표현': '고객이 위생 상태 불편을 표명함.',
  '연락처 남김': '고객 연락 정보가 남아 있어 후속 안내 체계를 준비함.',
  '보상 요청': '보상 관련 요청이 접수되어 내부 검토 대상에 반영함.',
  '고객사 공유 필요': '고객사 공유 요청 건으로 처리 우선순위를 조정함.',
  미확인: '고객 반응 확인이 추가로 필요함.',
}

const reactionToClient: Record<CustomerReaction, string> = {
  '괜찮다고 함': '고객은 추가 요청 없이 응대 종료로 전달됨.',
  '불쾌감 표현': '고객이 불편을 구체적으로 전달해 주었습니다.',
  '연락처 남김': '추가 안내 가능한 연락 채널이 확인됨.',
  '보상 요청': '보상 요청이 있어 검토 범위에 반영함.',
  '고객사 공유 필요': '고객사 공유 필요로 판단되어 병행 보고를 준비함.',
  미확인: '고객의 반응 상세는 추가 확인이 필요함.',
}

// Keep compatibility for client-path references used in legacy templates.
void reactionToClient

const onsiteActionToInternal: Record<OnsiteAction, string> = {
  '고객 응대': '고객 응대를 진행함.',
  '음식 교체': '음식 교체 절차를 진행함.',
  '메뉴 회수': '해당 메뉴를 회수하고 잔식 확인 절차를 진행함.',
  '동일 조리분 확인': '동일 조리분 상태를 확인함.',
  '사진 기록': '현장 확인 내용을 사진으로 정리함.',
  '고객사 보고': '고객사 보고 항목을 정리함.',
  '현장 확인 중': '현장 확인 범위를 확대해 점검함.',
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function normalizeTextNoSpace(value: string) {
  return normalizeText(value).replace(/\s+/g, '')
}

function toSafeText(value: string, fallback: string) {
  const text = value.trim().replace(/\s+/g, ' ')
  return text.length > 0 ? text : fallback
}

function normalizeDate(value: string) {
  if (!value) return fallbackValues.occurredAt

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

function formatRestaurantName(siteName: string) {
  const trimmed = siteName.trim()
  if (!trimmed) return fallbackValues.workplace
  if (trimmed.endsWith('식당')) return trimmed
  return `${trimmed} 식당`
}

function sanitizeOutput(value: string) {
  return value
    .replace(/\.{3,}|…/g, '')
    .replace(/강화하은/g, '강화하겠습니다')
    .replace(/확인함\.가/gi, '확인하고 있음')
    .replace(/중문식당식당/gi, '중문식당')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeSentences(lines: string[]) {
  const normalizedSet = new Set<string>()
  const output: string[] = []
  const duplicates = new Set<string>()
  const normalizedForKey = (line: string) => line.replace(/\s+/g, '').replace(/[^\p{L}\p{N}]/gu, '')

  for (const raw of lines) {
    const line = sanitizeOutput(raw)
    if (!line) continue
    const compact = normalizedForKey(line)
    const key = line
      .replace(/계속/gi, '')
      .replace(/현재?/g, '')
      .replace(/\s+/g, '')

    if (compact.length < 2) continue
    if (duplicates.has(key) || normalizedSet.has(compact)) continue
    if ([...normalizedSet].some((item) => item.includes(compact) || compact.includes(item))) continue

    normalizedSet.add(compact)
    duplicates.add(key)
    output.push(line)
  }

  return output
}

function hashSeed(value: string) {
  return Array.from(value).reduce((acc, char) => (acc * 131 + char.charCodeAt(0)) % 2147483647, 17)
}

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
    .replace('{{menu}}', context.menu)
    .replace('{{keyword}}', context.keyword)
    .replace('{{category}}', context.categoryLabel)
}

function resolveCategory(form: ReportFormState, selectedCase: VocCase | null) {
  const source = normalizeText(
    [
      selectedCase?.category,
      selectedCase?.title,
      selectedCase?.incident,
      selectedCase?.customerScript,
      selectedCase?.onsiteAction,
      selectedCase?.rootCause,
      selectedCase?.prevention,
      selectedCase?.reportExample,
      form.keyword,
      form.menuName,
      form.memo,
      form.customerInfo,
    ].join(' '),
  )

  const sourceNoSpace = normalizeTextNoSpace(source)
  const baseCategory = detectReportCategory(source)

  const isSafety = safetyKeywords.some(
    (keyword) => source.includes(keyword.toLowerCase()) || sourceNoSpace.includes(keyword.replace(/\s+/g, '').toLowerCase()),
  )

  const isCookingQuality = QUALITY_COOKING_STATUS_KEYWORDS.some((keyword) => {
    const lower = keyword.toLowerCase()
    return source.includes(lower) || sourceNoSpace.includes(lower.replace(/\s+/g, ''))
  }) || source.includes('조리상태불량')

  return {
    baseCategory,
    displayLabel: isSafety
      ? safetyDisplayLabel
      : baseCategory === '품질' && isCookingQuality
        ? cookingQualityDisplayLabel
        : baseCategory,
    isSafety,
    isCookingQuality,
  }
}

function buildContext(form: ReportFormState, selectedCase: VocCase | null) {
  const resolved = resolveCategory(form, selectedCase)
  const category = resolved.isCookingQuality ? '품질' : resolved.baseCategory

  return {
    workplace: formatRestaurantName(toSafeText(form.workplace, fallbackValues.workplace)),
    restaurantManagerName: toSafeText(form.restaurantManagerName, fallbackValues.restaurantManagerName),
    clientContactName: toSafeText(form.clientContactName, fallbackValues.clientContactName),
    menu: toSafeText(form.menuName, fallbackValues.menu),
    keyword: toSafeText(form.keyword, fallbackValues.keyword),
    customerInfo: toSafeText(form.customerInfo, fallbackValues.customerInfo),
    memo: toSafeText(form.memo, ''),
    occurredAt: normalizeDate(form.occurredAt),
    category,
    categoryLabel: resolved.displayLabel,
    isSafety: resolved.isSafety,
    isCookingQuality: resolved.isCookingQuality,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createIncidentLines(context: ReturnType<typeof buildContext>, form: ReportFormState) {
  const category = (context.isCookingQuality ? '품질' : context.category) as CategoryType
  const config = detailConfig[form.reportDetailLevel]
  const targetCount = clamp(context.isSafety ? config.incidentCount : config.incidentCount, 2, 4)
  const seedBase = `${lineSeedSeed}|incident|${context.keyword}|${context.menu}|${context.categoryLabel}|${form.customerReactions.join(',')}`

  const base = [
    replaceTemplate(incidentTemplateByCategory[category][0], context),
    context.isSafety && context.isCookingQuality
      ? '안전성 우려 건으로 고객 상태 확인이 병행됨.'
      : replaceTemplate(incidentTemplateByCategory[category][1], context),
  ]

  const reactionLine = `${context.menu} 이용 고객이 ${form.customerReactions[0] ?? '미확인'} 반응을 남겨 현장 접수됨.`
  const additional = pickBySeed(incidentTemplateByCategory[category].slice(2), seedBase, 3).map((line) => replaceTemplate(line, context))

  return pickBySeed(
    dedupeSentences([...base, reactionLine, ...additional]),
    `${seedBase}|final`,
    targetCount,
  )
}

function createActionLines(context: ReturnType<typeof buildContext>, form: ReportFormState) {
  const category = (context.isCookingQuality ? '품질' : context.category) as CategoryType
  const config = detailConfig[form.reportDetailLevel]
  const targetCount = clamp(context.isSafety ? config.actionCount : config.actionCount, 3, 4)
  const seedBase = `${lineSeedSeed}|action|${context.menu}|${context.categoryLabel}|${form.onsiteActions.join(',')}`

  const selectedActionLines = form.onsiteActions.map((action) => onsiteActionToInternal[action])
  const baseAction = selectedActionLines.length > 0
    ? selectedActionLines
    : [
        category === '안전사고'
          ? '현장 확인 및 사용자 상태 확인 후 조치 범위를 정리함.'
          : '현장을 확인하고 즉시 조치를 진행함.',
      ]

  const candidateActions = dedupeSentences([
    ...baseAction,
    ...actionTemplateByCategory[category],
    ...pickBySeed(causeTemplateByCategory[category], `${seedBase}|cause`, 2).map((line) => `${line}`),
    ...pickBySeed(preventionTemplateByCategory[category], `${seedBase}|prevent`, 2).map((line) => `${line}`),
    reactionToInternal[form.customerReactions[0] ?? '미확인'],
  ]).filter(Boolean)

  return pickBySeed(candidateActions, `${seedBase}|pick`, targetCount)
}

function createClientLines(context: ReturnType<typeof buildContext>, form: ReportFormState) {
  const category = (context.isCookingQuality ? '품질' : context.category) as CategoryType
  const seedBase = `${lineSeedSeed}|client|${context.menu}|${context.categoryLabel}|${form.responseIntensity}|${context.keyword}`
  const title = context.categoryLabel === cookingQualityDisplayLabel ? '조리상태' : context.categoryLabel

  const core = pickBySeed(clientCoreByCategory[category], `${seedBase}|core`, 2)
  const intensity = clientIntensityByLevel[form.responseIntensity]
  const actionText = form.onsiteActions.length > 0
    ? [
        '현장 조치로 고객사 공유 및 안내 범위도 함께 정리하였습니다.',
      ]
    : ['현장 점검 후 공유 범위를 정리하였습니다.']

  const lines = [
    `안녕하세요 ${context.clientContactName}님,`,
    `금일 ${context.workplace} 이용 중 발생한 ${title} VOC 관련하여 보고드립니다.`,
    context.isSafety && context.isCookingQuality
      ? '고객님께서 딱딱한 물질을 씹은 뒤 치아 불편을 호소하신 건으로, 고객 상태 확인 후 즉시 현장 점검을 진행하였습니다.'
      : `말씀 주신 건은 현장에서 즉시 확인하였고 ${context.categoryLabel} 관련 메뉴·공정을 점검하였습니다.`,
    ...core,
    ...actionText,
    `현재는 ${clientIntensityByLevel[form.responseIntensity][0]}`,
    `향후 동일 사례 방지를 위해 관련 공정과 최종 확인 절차를 강화하겠습니다.`,
    '확인 결과와 개선 사항은 정리되는 대로 추가 공유드리겠습니다.',
    '감사합니다.',
  ]

  if (form.responseIntensity === '주의' || form.responseIntensity === '중대') {
    lines.splice(
      lines.indexOf(`현재는 ${clientIntensityByLevel[form.responseIntensity][0]}`) + 1,
      0,
      intensity[1] ? intensity[1] : '',
    )
  }

  return dedupeSentences(lines.map((line) => replaceTemplate(line, context))).filter((line) => line.length > 0)
}

function buildCustomerMessage(form: ReportFormState, selectedCase: VocCase | null): string {
  const context = buildContext(form, selectedCase)
  const category = (context.isCookingQuality ? '품질' : context.category) as CategoryType
  const seedBase = `${lineSeedSeed}|customer|${context.menu}|${context.categoryLabel}|${form.responseIntensity}`
  const coreLines = pickBySeed(customerResponseCoreByCategory[category], `${seedBase}|core`, 2)
  const reactionLine = pickBySeed(
    [
      `말씀 주신 내용은 ${form.customerReactions[0] ?? '미확인'} 반응을 함께 반영해 진행하겠습니다.`,
      `말씀하신 내용은 즉시 현장에서 확인하고 있습니다.`,
      `추가로 관련 메뉴와 담당 절차를 함께 점검하겠습니다.`,
    ],
    `${seedBase}|reaction`,
    1,
  ).join(' ')

  const actionSeed = form.onsiteActions.length > 0
    ? `${seedBase}|onsite`
    : `${seedBase}|default`

  const actionLine = form.onsiteActions.length > 0
    ? pickBySeed(
      form.onsiteActions.map((action) =>
        action === '고객 응대'
          ? '필요 시 관련 담당자와 함께 안내 및 확인 절차를 다시 정비하겠습니다.'
          : action === '음식 교체'
            ? '음식 교체 기준과 안내를 바로 점검하겠습니다.'
            : action === '메뉴 회수'
              ? '메뉴 회수 후 잔식 확인 절차를 보완하겠습니다.'
              : action === '동일 조리분 확인'
                ? '동일 조리분의 상태 점검을 우선 진행하겠습니다.'
                : action === '사진 기록'
                  ? '현장 점검 내용을 증빙으로 정리하겠습니다.'
                  : action === '고객사 보고'
                    ? '고객사 공유를 위한 내부 정리도 함께 진행하겠습니다.'
                    : '추가 확인 항목을 정리해 진행하겠습니다.',
      ),
      actionSeed,
      1,
    ).join(' ')
    : '필요 항목을 기준별로 정리해 확인하겠습니다.'

  const p2 = `말씀 주신 ${context.categoryLabel}로 식사 이용 중 불편을 드린 점 죄송합니다.`
  const p3 = `${category === '품질' && context.isCookingQuality
      ? '말씀 주신 내용은 현장에서 확인하였으며, 해당 메뉴의 조리 상태와 조리 기준을 다시 점검하겠습니다.'
      : `말씀 주신 내용은 현장에서 확인하였으며, 해당 메뉴의 조리·배식 과정을 다시 점검하겠습니다.`}`
  const p4 = `${reactionLine} ${actionLine}`
  const p5 = '동일한 불편이 반복되지 않도록 확인 절차를 강화하겠습니다.'

  const paragraphs = dedupeSentences([
    `안녕하세요, ${context.workplace}입니다.`,
    p2,
    p3,
    ...coreLines,
    coreLines[1] ? `${coreLines[1]}${coreLines[1].endsWith('.') ? '' : ''}` : p4,
    `${actionLine}`,
    `${p4}`,
    `${p5} ${customerClosingLine}`,
  ]).filter(Boolean)

  if (paragraphs.length === 0) {
    return `안녕하세요, ${context.workplace}입니다.\n\n${p2}\n\n${p3}\n\n${p5} ${customerClosingLine}`
  }

  const result = paragraphs.slice(0, 5)
  return result.join('\n\n')
}

function ensureInternalStyle(line: string) {
  return line.replace(/합니다\./g, '함.').replace(/했습니다\./g, '했습니다.')
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
    `3.발생 일시 : ${context.occurredAt}`,
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

function buildClientReport(form: ReportFormState, selectedCase: VocCase | null): string {
  const context = buildContext(form, selectedCase)
  const lines = createClientLines(context, form)
  const reportLines = dedupeSentences(lines)
  const filtered = reportLines.filter((line) => !/형식/.test(line))

  return filtered.join('\n')
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
