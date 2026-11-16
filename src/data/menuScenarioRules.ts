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
    scenario: '양 부족 대비',
    recommendedDirections: ['가성비', '균형형', '간편 운영형'],
    recommendedMainCategories: ['중식', '야식'],
    recommendedSides: ['계란찜', '두부조림', '무생채'],
    avoidRisks: ['양 부족'],
    strategy: [
      '1인 배식량을 정하고 추가 배식 기준을 미리 안내합니다.',
      '밥·메인은 예상 식수보다 조금 여유 있게 준비합니다.',
      '배식이 몰리는 시간에는 메인 배식 직원을 늘립니다.',
    ],
  },
  {
    id: 'S002',
    scenario: '품절 대비',
    recommendedDirections: ['가성비', '균형형', '간편 운영형'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['콩나물무침', '부추겉절이', '브로콜리무침'],
    avoidRisks: ['품절'],
    strategy: [
      '품절될 때 낼 대체 메뉴를 미리 정해 둡니다.',
      '인기 반찬은 따로 한 통 더 준비합니다.',
      '품절되면 대체 메뉴를 배식대에 바로 안내합니다.',
    ],
  },
  {
    id: 'S003',
    scenario: '짠맛 불만 예방',
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['상추겉절이', '오이무침', '단무지'],
    avoidRisks: ['염도'],
    strategy: [
      '간을 각자 맞출 수 있는 메뉴를 고릅니다.',
      '국·소스는 계량하고 배식 전에 간을 봅니다.',
      '싱거운 무침·나물을 함께 냅니다.',
    ],
  },
  {
    id: 'S004',
    scenario: '느끼함 줄이기',
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['오이무침', '상추겉절이', '시금치나물'],
    avoidRisks: ['느끼함'],
    strategy: [
      '튀김·전은 한 상에 한 가지만 냅니다.',
      '기름진 메인에는 산뜻한 겉절이·무침을 붙입니다.',
      '고기 양만큼 채소 반찬을 넉넉히 냅니다.',
    ],
  },
  {
    id: 'S005',
    scenario: '대기시간 줄이기',
    recommendedDirections: ['가성비', '간편 운영형', '트렌디 메뉴'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['단무지', '무생채', '브로콜리무침'],
    avoidRisks: ['대기시간'],
    strategy: [
      '미리 담아 둘 수 있는 메뉴를 고릅니다.',
      '구이·면은 회차별로 나눠 조리합니다.',
      '배식 라인을 둘로 나누거나 직원을 늘립니다.',
    ],
  },
  {
    id: 'S006',
    scenario: '따뜻하게 내기',
    recommendedDirections: ['가성비', '균형형', '건강식'],
    recommendedMainCategories: ['중식', '석식'],
    recommendedSides: ['계란찜', '콩나물무침', '깍두기'],
    avoidRisks: ['보온 지연'],
    strategy: [
      '배식 시작 시간에 맞춰 조리를 마칩니다.',
      '보온고 온도와 넣은 시간을 기록합니다.',
      '식으면 맛이 떨어지는 메뉴는 소량씩 자주 냅니다.',
    ],
  },
  {
    id: 'S007',
    scenario: '이물 예방',
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['콩나물무침', '깻잎무침', '상추겉절이'],
    avoidRisks: ['이물 혼입'],
    strategy: [
      '세척한 식재료를 한 번 더 눈으로 확인합니다.',
      '뼈·가시가 있는 식재료는 손질 후 남은 조각을 확인합니다.',
      '닳은 수세미·철솔은 바로 바꿉니다.',
    ],
  },
  {
    id: 'S008',
    scenario: '위생 관리',
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
    recommendedMainCategories: ['조식', '중식', '석식'],
    recommendedSides: ['무생채', '김치볶음', '오이무침'],
    avoidRisks: ['위생'],
    strategy: [
      '날로 먹는 채소는 세척·소독 기록을 남깁니다.',
      '냉장 메뉴는 배식대 온도를 확인합니다.',
      '작업이 바뀔 때마다 장갑을 바꿉니다.',
    ],
  },
  {
    id: 'S009',
    scenario: '불편·응대 줄이기',
    recommendedDirections: ['가성비', '건강식', '트렌디 메뉴'],
    recommendedMainCategories: ['중식', '석식', '야식'],
    recommendedSides: ['단무지', '김치볶음', '브로콜리무침'],
    avoidRisks: ['고객 불편', '직원 응대'],
    strategy: [
      '맵기·주요 재료를 메뉴판에 적습니다.',
      '자주 받는 요청의 답을 직원끼리 맞춥니다.',
      '매운 메뉴에는 덜 매운 선택지를 둡니다.',
    ],
  },
  {
    id: 'S010',
    scenario: '야간 배식 대응',
    recommendedDirections: ['트렌디 메뉴', '간편 운영형', '가성비'],
    recommendedMainCategories: ['중식', '야식'],
    recommendedSides: ['단무지', '상추겉절이', '콩나물무침'],
    avoidRisks: ['대기시간'],
    strategy: [
      '야간 식수에 맞춰 2차 조리분을 준비합니다.',
      '추가 배식과 마감 시간을 미리 안내합니다.',
      '늦게 오는 고객용으로 식어도 괜찮은 반찬을 둡니다.',
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
