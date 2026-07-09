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
    description: '해당 메뉴 수량이 수요를 따라가지 못해 공급 차질이 났을 가능성이 있습니다.',
    warningSigns: [
      '피크 시간대 수량 회전율이 급히 낮아진 경우',
      '대체 메뉴 공지 없이 단품 품절이 반복되는 경우',
    ],
    preventionTips: [
      '차수별 기본 수량과 안전재고를 재확인합니다.',
      '대체 메뉴 운영안(백업 메뉴) 표준을 함께 운영합니다.',
      '추가 배식 조건을 간단하게 공지 규칙으로 정리합니다.',
    ],
    avoidConditions: ['단일 메뉴 의존도 과다', '사전 발주 누락', '대체 메뉴 미리보기 없음'],
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
  },
  {
    risk: '양 부족',
    description: '제공량 기준이 낮아 고객이 느끼기에 양이 부족해 보일 가능성이 있는 상태입니다.',
    warningSigns: ['추가 제공 요청이 자주 발생하는 메뉴', '반찬 간 잔반량 편차가 큰 메뉴군'],
    preventionTips: [
      '기준 제공량과 배치 인원을 재확정합니다.',
      '메뉴군별 여유분 비율을 업데이트합니다.',
      '추가 배식 가능 범위를 운영 기준으로 명시합니다.',
    ],
    avoidConditions: ['인원 대비 수량 고정치', '확대 옵션 미준비'],
    recommendedDirections: ['든든한 메뉴', '가성비', '균형형'],
  },
  {
    risk: '염도',
    description: '간 간격 조절이 어려워 짜거나 싱거워 보여 만족도가 낮아질 수 있습니다.',
    warningSigns: ['짠맛·간 맛 민원 반복', '간량 조정 이력 미비'],
    preventionTips: [
      '간을 분리해서 제공하거나 소스를 별도 운영합니다.',
      '국물 기준 레시피 점검 주기를 고정합니다.',
      '간 간섭이 적은 대체 국물 구성으로 교체 검토합니다.',
    ],
    avoidConditions: ['간량 점검 미흡', '국물 기준 공유 미흡'],
    recommendedDirections: ['건강식', '균형형'],
  },
  {
    risk: '느끼함',
    description: '기름기/기름 양이 높아 입맛이 무겁게 느껴질 수 있는 상태입니다.',
    warningSigns: ['기름기 강한 메뉴 집중 배치', '고객의 느끼함 피드백 반복'],
    preventionTips: [
      '기름 기반 반찬 비중을 낮춥니다.',
      '채소·단백질 구성으로 편차를 완화합니다.',
      '국물 농도 조절이 쉬운 메뉴를 병행 배치합니다.',
    ],
    avoidConditions: ['기름 과다 사용', '기준 레시피 미준수'],
    recommendedDirections: ['건강식', '균형형'],
  },
  {
    risk: '대기시간',
    description: '동선 또는 조리 조합이 길어 배식 지연이 반복될 수 있는 상태입니다.',
    warningSigns: ['피크 구간 조리 지연', '대체 안내 누락'],
    preventionTips: [
      '조리 시간이 짧은 메뉴로 우선 편성합니다.',
      '배식 라인을 분리해 동선을 최소화합니다.',
      '현장 알림 포인트를 짧게 운영합니다.',
    ],
    avoidConditions: ['불필요한 반복 조리', '배식 동선 중첩'],
    recommendedDirections: ['가성비', '간편 운영형'],
  },
  {
    risk: '보온 지연',
    description: '조리 종료 후 보온 구간으로 이동 지연되어 온도 유지가 어렵던 이슈가 있을 수 있습니다.',
    warningSigns: ['이용자 체감 온도 저하 제보', '보온 라인 체류 시간 과다'],
    preventionTips: [
      '보온 시간 기준을 메뉴군별로 분리 관리합니다.',
      '장시간 노출 메뉴는 회전 속도를 조정합니다.',
      '출고 직전 최종 온도 체크리스트를 추가합니다.',
    ],
    avoidConditions: ['보온 구간 과밀', '출고 지연'],
    recommendedDirections: ['간편 운영형', '가성비'],
  },
  {
    risk: '이물 혼입',
    description: '원재료 선별·전처리 단계에서 이상 가능성이 남아있는 상태입니다.',
    warningSigns: ['원재료 선별 이슈 반복', '고객 이물 의심 제보'],
    preventionTips: [
      '원재료 선별 및 세척 단계를 강화합니다.',
      '조리 전·후 최종 확인 항목을 분리 운영합니다.',
      '이물 의심 시 현물 회수 및 증빙 기록을 즉시 수행합니다.',
    ],
    avoidConditions: ['세척·선별 단계 누락', '최종 점검 미흡'],
    recommendedDirections: ['건강식', '균형형'],
  },
  {
    risk: '위생',
    description: '도구·작업대 위생 점검이 약해 고객 신뢰 이슈로 이어질 가능성이 있습니다.',
    warningSigns: ['청결 점검이 반복적으로 지연된 구간', '교차 오염 기록'],
    preventionTips: [
      '위생 체크리스트를 구간별로 고정 운영합니다.',
      '도구 교차 사용 기준을 분리합니다.',
      '현장 정리 주기를 고정하고 점검 문구를 남깁니다.',
    ],
    avoidConditions: ['도구 교차 사용', '정리점검 누락'],
    recommendedDirections: ['건강식', '균형형'],
  },
  {
    risk: '고객 불편',
    description: '고객 체감 품질이 낮아지며 추가 문의가 발생할 수 있는 상태입니다.',
    warningSigns: ['반복 민원', '동일 유형 문의 누적'],
    preventionTips: [
      '원인 확인 범위와 안내 메시지를 명확히 정리합니다.',
      '대응 스크립트와 전달 순서를 통일합니다.',
      '재발 시 보완 조치를 빠르게 공유합니다.',
    ],
    avoidConditions: ['안내 지연', '고객 반응 기록 부재'],
    recommendedDirections: ['건강식', '균형형'],
  },
  {
    risk: '직원 응대',
    description: '현장 커뮤니케이션이 다소 느슨해 대응 품질이 들쑥날쑥할 수 있는 상태입니다.',
    warningSigns: ['응대가 뒤엉킨 접점', '동일 민원에 대한 반복 안내'],
    preventionTips: [
      '응대 기본 문장과 응답 순서를 표준화합니다.',
      '유형별 전달 템플릿을 공유합니다.',
      '보완 조치의 전달 책임자와 시간 표기를 기록합니다.',
    ],
    avoidConditions: ['응대 교육 미비', '보완 경로 미확인'],
    recommendedDirections: ['건강식', '균형형'],
  },
]

export const menuVocRiskRuleMap: Record<VocRisk, MenuVocRiskRule> =
  Object.fromEntries(menuVocRiskRules.map((item) => [item.risk, item])) as Record<
    VocRisk,
    MenuVocRiskRule
  >

