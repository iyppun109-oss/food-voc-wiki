import type { MenuDirection, VocRisk } from './menuMainItems'

export type MenuScenarioRule = {
  id: string
  scenario: string
  recommendedDirections: MenuDirection[]
  recommendedMainCategories: string[]
  recommendedSides: string[]
  avoidRisks: VocRisk[]
  strategy: string[]
}

export const menuScenarioRules: MenuScenarioRule[] = [
  {
    id: 'S001',
    scenario: '수량 부족 대비 운영 안정',
    recommendedDirections: ['가성비', '균형형', '간편 운영형'],
    recommendedMainCategories: ['중식', '야식'],
    recommendedSides: ['계란찜', '두부조림', '무생채'],
    avoidRisks: ['양 부족'],
    strategy: [
      '예비 수량을 미리 책정해 추가 배식 기준을 정해둡니다.',
      '본식·반찬 분리 제공으로 초과 수요 시 대응 속도를 높입니다.',
      '급등 시간대는 메뉴 라인 우선순위를 조정합니다.',
    ],
  },
  {
    id: 'S002',
    scenario: '품절 대응형',
    recommendedDirections: ['가성비', '균형형', '간편 운영형'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['콩나물무침', '부추겉절이', '브로콜리무침'],
    avoidRisks: ['품절'],
    strategy: [
      '대체 가능한 반찬과 메인 조합을 사전 지정합니다.',
      '식수 대비 최소 1개 백업 반찬 라인을 분리 운영합니다.',
      '대체 메뉴 기준을 조기 공지해 안내 지연을 줄입니다.',
    ],
  },
  {
    id: 'S003',
    scenario: '염도 VOC 예방',
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['상추겉절이', '오이무침', '단무지'],
    avoidRisks: ['염도'],
    strategy: [
      '간 조절이 쉬운 메뉴 중심으로 구성합니다.',
      '국물·소스 제공량 기준을 분리해 기준 용량을 적용합니다.',
      '짠맛 체감을 줄이도록 담백한 찬을 함께 배치합니다.',
    ],
  },
  {
    id: 'S004',
    scenario: '느끼함 완화형',
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['오이무침', '상추겉절이', '시금치나물'],
    avoidRisks: ['느끼함'],
    strategy: [
      '기름 사용량이 높은 조합은 줄이고 담백 찬을 늘립니다.',
      '부드러운 단백질 비중을 높여 식감 부담을 낮춥니다.',
      '채소 비율을 보강해 입맛 편차를 완화합니다.',
    ],
  },
  {
    id: 'S005',
    scenario: '대기시간 완화',
    recommendedDirections: ['가성비', '간편 운영형', '트렌디 메뉴'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['단무지', '무생채', '브로콜리무침'],
    avoidRisks: ['대기시간'],
    strategy: [
      '준비동선이 짧은 메뉴 라인으로 우선 집행합니다.',
      '반차량 동시 조리보다 배치별 분할 조리를 적용합니다.',
      '요청 변경이 많을 경우 안내 문구를 통일해 반복 안내를 줄입니다.',
    ],
  },
  {
    id: 'S006',
    scenario: '보온·추적 관리',
    recommendedDirections: ['가성비', '균형형', '건강식'],
    recommendedMainCategories: ['중식', '석식'],
    recommendedSides: ['계란찜', '콩나물무침', '깍두기'],
    avoidRisks: ['보온 지연'],
    strategy: [
      '보온 구간별 시간 한도와 이동 구간을 명확히 분리합니다.',
      '출고 전 최종 보온 점검과 이탈 기준을 체크합니다.',
      '초과 잔량 기준을 현장에서 즉시 공유합니다.',
    ],
  },
  {
    id: 'S007',
    scenario: '이물·오염 예방',
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['콩나물무침', '깻잎무침', '상추겉절이'],
    avoidRisks: ['이물 혼입'],
    strategy: [
      '원재료 선별 기준을 운영 체크포인트로 고정합니다.',
      '전처리와 조리 전 최종 점검을 분리 운영합니다.',
      '배식 전 잔류물 확인 기록을 남겨 공유합니다.',
    ],
  },
  {
    id: 'S008',
    scenario: '위생 안정형',
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['무생채', '김치볶음', '오이무침'],
    avoidRisks: ['위생'],
    strategy: [
      '조리·배식 동선을 분리하고 교차 접촉을 최소화합니다.',
      '식기·도마 세척 이력 표식을 함께 관리합니다.',
      '출고 전 최종 위생 체크를 한 번 더 확인합니다.',
    ],
  },
  {
    id: 'S009',
    scenario: '고객 불편 최소화형',
    recommendedDirections: ['가성비', '건강식', '트렌디 메뉴'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['단무지', '김치볶음', '브로콜리무침'],
    avoidRisks: ['고객 불편', '직원 응대'],
    strategy: [
      '고객 응대 포인트가 적은 메뉴 구성을 우선 배치합니다.',
      '변경 이슈를 줄이기 위해 설명이 쉬운 반찬 조합을 사용합니다.',
      '재료 정보와 조리 기준을 간단 문구로 안내합니다.',
    ],
  },
  {
    id: 'S010',
    scenario: '야간 피크 대응',
    recommendedDirections: ['트렌디 메뉴', '간편 운영형', '가성비'],
    recommendedMainCategories: ['중식', '야식'],
    recommendedSides: ['단무지', '상추겉절이', '콩나물무침'],
    avoidRisks: ['대기시간'],
    strategy: [
      '야간 피크 기준으로 2차 준비 수량을 둡니다.',
      '추가 배식 조건과 종료 기준을 사전 고지합니다.',
      '지연 발생 시 대체 반찬으로 즉시 전환할 수 있도록 준비합니다.',
    ],
  },
]

export const menuScenarioRuleMap = Object.fromEntries(
  menuScenarioRules.map((rule) => [rule.id, rule]),
) as Record<string, MenuScenarioRule>

export const scenarioByAvoidRisk: Record<VocRisk, string[]> = {
  품절: ['S002', 'S001'],
  '양 부족': ['S001'],
  염도: ['S003'],
  느끼함: ['S004'],
  대기시간: ['S005'],
  '보온 지연': ['S006'],
  '이물 혼입': ['S007'],
  위생: ['S008'],
  '고객 불편': ['S009'],
  '직원 응대': ['S009'],
}
