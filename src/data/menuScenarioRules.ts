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
    scenario: 'Shortage risk prevention for service volume',
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
    recommendedMainCategories: ['한식', '아시안', '양식'],
    recommendedSides: ['무생채', '두부조림', '브로콜리무침'],
    avoidRisks: ['양 부족'],
    strategy: [
      'Prioritize menus with reliable serving quantities.',
      'Prepare substitute menu options in advance.',
      'Reduce burden by choosing menus with fast replenishment.',
    ],
  },
  {
    id: 'S002',
    scenario: 'Stockout risk prevention',
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
    recommendedMainCategories: ['한식', '분식', '아시안'],
    recommendedSides: ['단무지', '오이무침', '콩나물무침'],
    avoidRisks: ['품절'],
    strategy: [
      'Favor substitute-friendly recipes and simple garnish sets.',
      'Keep extra stock plan by meal period.',
      'Set clear escalation rule when expected stock is not enough.',
    ],
  },
  {
    id: 'S003',
    scenario: 'Saltiness control',
    recommendedDirections: ['건강식', '균형형', '프리미엄'],
    recommendedMainCategories: ['한식', '건강식', '양식'],
    recommendedSides: ['샐러드채소', '무생채', '시금치나물'],
    avoidRisks: ['염도'],
    strategy: [
      'Use menus with easy seasoning adjustment.',
      'Prepare side menus that reduce concentrated salt perception.',
      'Recommend clear measurement and check points for broth or sauce.',
    ],
  },
  {
    id: 'S004',
    scenario: 'Greasy texture management',
    recommendedDirections: ['건강식', '균형형', '가성비'],
    recommendedMainCategories: ['건강식', '한식', '분식'],
    recommendedSides: ['김치볶음', '두부조림', '시금치나물'],
    avoidRisks: ['느끼함'],
    strategy: [
      'Lower oil-heavy side composition.',
      'Increase fresh vegetable proportion.',
      'Choose menu combinations with easy intake and good texture balance.',
    ],
  },
  {
    id: 'S005',
    scenario: 'Queue and waiting-time relief',
    recommendedDirections: ['트렌디 메뉴', '간편 운영형', '가성비'],
    recommendedMainCategories: ['한식', '아시안', '분식'],
    recommendedSides: ['단무지', '브로콜리무침', '무생채'],
    avoidRisks: ['대기시간'],
    strategy: [
      'Use quick cooking menu set.',
      'Prepare split operation steps for peak time.',
      'Keep optional sides minimal to reduce line load.',
    ],
  },
  {
    id: 'S006',
    scenario: 'Hold temperature management',
    recommendedDirections: ['간편 운영형', '가성비', '건강식'],
    recommendedMainCategories: ['한식', '구이', '양식'],
    recommendedSides: ['계란찜', '상추겉절이', '두부조림'],
    avoidRisks: ['보온 지연'],
    strategy: [
      'Prefer items that keep temperature stable when held.',
      'Separate holding section based on serving timing.',
      'Add explicit check step before final release.',
    ],
  },
  {
    id: 'S007',
    scenario: 'Contamination prevention',
    recommendedDirections: ['건강식', '균형형', '프리미엄'],
    recommendedMainCategories: ['한식', '건강식', '양식'],
    recommendedSides: ['무생채', '오이무침', '김치볶음'],
    avoidRisks: ['이물 혼입'],
    strategy: [
      'Select ingredients with low contamination risk.',
      'Keep inspection steps for pre- and post-cook clearly separated.',
      'Keep final verification checkpoints and log records.',
    ],
  },
  {
    id: 'S008',
    scenario: 'Hygiene focus',
    recommendedDirections: ['건강식', '균형형', '프리미엄'],
    recommendedMainCategories: ['한식', '건강식', '양식'],
    recommendedSides: ['무생채', '오이무침', '양배추슬로우'],
    avoidRisks: ['위생'],
    strategy: [
      'Prioritize menus with minimal cross-handling steps.',
      'Separate hot and cold handling spaces.',
      'Verify cleaning status with checklist before dispatch.',
    ],
  },
  {
    id: 'S009',
    scenario: 'Customer handling and recovery',
    recommendedDirections: ['가성비', '건강식', '간편 운영형'],
    recommendedMainCategories: ['한식', '아시안', '분식'],
    recommendedSides: ['콩나물무침', '계란찜', '깍두기'],
    avoidRisks: ['고객 불편', '직원 응대'],
    strategy: [
      'Choose stable menus that minimize ad-hoc exchanges.',
      'Prepare easy-to-explain ingredients and quantity notes.',
      'Reduce repetitive customer confusion with clear message blocks.',
    ],
  },
  {
    id: 'S010',
    scenario: 'Night shift workload support',
    recommendedDirections: ['든든한 메뉴', '트렌디 메뉴', '프리미엄'],
    recommendedMainCategories: ['한식', '구이', '양식'],
    recommendedSides: ['감자구이', '브로콜리무침', '상추겉절이'],
    avoidRisks: ['양 부족'],
    strategy: [
      'Use filling menu composition for late-hours demand.',
      'Plan additional serving and side expansion conditions.',
      'Add clear communication note for replenishment and exceptions.',
    ],
  },
]

export const menuScenarioRuleMap = Object.fromEntries(
  menuScenarioRules.map((rule) => [rule.id, rule]),
) as Record<string, MenuScenarioRule>

export const scenarioByAvoidRisk: Record<VocRisk, string[]> = {
  품절: ['S002'],
  '양 부족': ['S001', 'S010'],
  염도: ['S003'],
  느끼함: ['S004'],
  대기시간: ['S005'],
  '보온 지연': ['S006'],
  '이물 혼입': ['S007'],
  위생: ['S008'],
  '고객 불편': ['S009'],
  '직원 응대': ['S009'],
}
