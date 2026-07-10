import type { MenuDirection, VocRisk } from './menuMainItems'

export type MenuVocRiskRule = {
  risk: VocRisk
  description: string
  warningSigns: string[]
  preventionTips: string[]
  avoidConditions: string[]
  recommendedDirections?: MenuDirection[]
}

export const menuVocRiskRules: MenuVocRiskRule[] = [
  {
    risk: '품절',
    description:
      '품절은 특정 구간에서 수요와 수급이 맞지 않을 때 자주 발생하며, 대체 운영이 준비되지 않으면 만족도 하락이 커집니다.',
    warningSigns: [
      '요청량 대비 준비 수량이 적어 보이는 구간이 반복됩니다.',
      '특정 반찬만 연달아 소진되는 패턴이 보입니다.',
    ],
    preventionTips: [
      '메뉴군별 최소 1개 대체 반찬을 고정하고 출고 전 수량을 확인합니다.',
      '식수 가감 시 대체 메뉴 투입 기준을 바로 확인할 수 있게 공유합니다.',
      '재고 잔량을 기준점 단위로 나눠 기록해 공백 수급을 줄입니다.',
    ],
    avoidConditions: ['수급 이탈 가능성이 큰 원재료 과다 사용', '단계별 수량 관리 미흡'],
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
  },
  {
    risk: '양 부족',
    description: '양 부족은 배식량 설계와 추가 배식 정책이 모호할 때 자주 발생하는 핵심 불만입니다.',
    warningSigns: ['동일 메뉴의 추가 요청이 짧은 간격으로 반복됩니다.', '마감 직전 추가 배식 요청이 집중됩니다.'],
    preventionTips: [
      '표준 중량 + 보정량을 먼저 정한 뒤 조리 수량을 배치합니다.',
      '추가 배식 가능 수량과 공지 기준을 초반에 안내합니다.',
      '마감 후 과부족 구간 체크리스트로 원인 구간을 확인합니다.',
    ],
    avoidConditions: ['식수 변화 반영 누락', '중량 기준 미확인'],
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
  },
  {
    risk: '염도',
    description: '염도 불만은 국물·소스 기준이 불일치할 때 가장 많이 제기됩니다.',
    warningSigns: ['메뉴별 간 강도 편차가 커 보입니다.', '국물·소스 체감 간이 과하게 느껴집니다.'],
    preventionTips: [
      '국물·소스는 분량을 분리해 배식 직전 기준량으로 맞춥니다.',
      '중간점검에서 간 체크 표기를 남겨 배식 간격별로 관리합니다.',
      '짠맛 집중을 줄이기 위해 담백한 반찬을 기본으로 배치합니다.',
    ],
    avoidConditions: ['간 조정 책임자 미정', '국물 간 기준 표기 미흡'],
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
  },
  {
    risk: '느끼함',
    description: '느끼함은 오일·소스 사용량이 과하면 급격하게 체감도가 올라가는 부분입니다.',
    warningSigns: ['기름 향이 먼저 느껴지는 구간이 반복됩니다.', '저녁 피크 후 부담감 피드백이 높습니다.'],
    preventionTips: [
      '기름 사용량을 메뉴별 상한값으로 분리 관리합니다.',
      '고기량 대비 채소·국물 비율을 조절해 입맛 편차를 완화합니다.',
      '기본 제공 방식은 소분·담백 조합으로 통일합니다.',
    ],
    avoidConditions: ['튀김류 과다 조합', '고지방 반찬과 메인의 동시 집중'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '대기시간',
    description: '대기시간 불만은 동선 병목과 조리 병행 방식이 느슨할 때 발생 확률이 높습니다.',
    warningSigns: ['동일 메뉴 재작업 요청이 잦습니다.', '출고 지연 알림이 자주 발생합니다.'],
    preventionTips: [
      '조리 완료 예측 시간을 메뉴군별로 고정하고 조기 집행 구간을 둡니다.',
      '출고 직전 공수량 조정으로 과부하를 완화합니다.',
      '고객 안내 문구를 단일 라인으로 통일해 혼선을 줄입니다.',
    ],
    avoidConditions: ['동시 조리량 과다', '출고 순서 우선순위 미정'],
    recommendedDirections: ['가성비', '간편 운영형', '트렌디 메뉴'],
  },
  {
    risk: '보온 지연',
    description: '보온 지연은 회전이 빠른 피크 시간대에서 서비스 신뢰도를 떨어뜨립니다.',
    warningSigns: ['반찬 도착 시점이 불규칙합니다.', '재가열 요청이 연속적으로 발생합니다.'],
    preventionTips: [
      '보온 라인을 기준 시간으로 분리하고 구간별 확인표를 운영합니다.',
      '출고 직전 최종 온도와 보관시간을 함께 기록합니다.',
      '교대 구간에서는 즉시 책임자 교체 메모를 남깁니다.',
    ],
    avoidConditions: ['보온기 가동 간격 미확인', '이동 경로 중복 운영'],
    recommendedDirections: ['가성비', '균형형', '건강식'],
  },
  {
    risk: '이물 혼입',
    description: '이물 혼입은 조리 전처리와 출고 확인이 분리되어야 하는 핵심 위험 항목입니다.',
    warningSigns: ['이물 의심 조치 신고가 반복됩니다.', '전처리와 조리 단계의 체크 기록이 부족합니다.'],
    preventionTips: [
      '원재료 세척·선별·재가공을 단계별 체크표로 고정합니다.',
      '배출물 확인과 장비 세척 주기를 함께 기록합니다.',
      '출고 직전 최종 확인을 담당자 단위로 1회 이상 재점검합니다.',
    ],
    avoidConditions: ['원재료 상태 확인 누락', '공정 이력 미기록'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '위생',
    description: '위생 불만은 한 번의 불신이 반복 VOC로 이어지기 쉬운 항목입니다.',
    warningSigns: ['세척·보관 단계의 질문이 반복됩니다.', '작업 공정 교차 지점이 많습니다.'],
    preventionTips: [
      '조리 시작 전·중간·출고 전 3단계 체크를 운영 루틴으로 고정합니다.',
      '근무 교대 시 손위생과 작업면 교체 상태를 확인 기록합니다.',
      '식기와 작업면 세척 확인표를 출고표와 함께 보관합니다.',
    ],
    avoidConditions: ['작업면 교체 누락', '보관온도 점검 미흡'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '고객 불편',
    description: '고객 불편은 메뉴 적합성보다도 전달·안내·대응의 지연에서 커집니다.',
    warningSigns: ['동일 시간대에 동일 이슈 제보가 반복됩니다.', '안내 문구 통일이 어렵다는 피드백이 남습니다.'],
    preventionTips: [
      '사전 안내 포인트를 한 문장으로 고정하고 상담자는 같은 기준을 공유합니다.',
      '접수 즉시 확인 항목을 정해 고객 대기 시간을 줄입니다.',
      '현장 전달 기준서를 쉬운 문구로 통일합니다.',
    ],
    avoidConditions: ['담당자별 안내 문구 불일치', '피드백 공유 주기 부족'],
    recommendedDirections: ['건강식', '가성비', '트렌디 메뉴'],
  },
  {
    risk: '직원 응대',
    description: '응대 이슈는 조리 완성도보다도 처리 속도와 전달 방식에서 크게 달라집니다.',
    warningSigns: ['교환·문의 동선이 반복되고 체류시간이 길어집니다.', '동일 문의의 후속 안내가 지연됩니다.'],
    preventionTips: [
      '응대 기준 문구와 안내 순서를 한 번에 정해 공유합니다.',
      '현장 상황 공유 채널을 고정해 전달 누락을 줄입니다.',
      '접수 후 확인/조치/공유 시간을 표준화합니다.',
    ],
    avoidConditions: ['담당자별 안내 톤 불일치', '후속 공유 지연'],
    recommendedDirections: ['트렌디 메뉴', '건강식', '가성비'],
  },
]

export const menuVocRiskRuleMap: Record<VocRisk, MenuVocRiskRule> =
  Object.fromEntries(menuVocRiskRules.map((item) => [item.risk, item])) as Record<VocRisk, MenuVocRiskRule>
