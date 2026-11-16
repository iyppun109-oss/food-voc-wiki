import type { MenuDirection, VocRisk } from './menuMainItems'

export type MenuVocRiskRule = {
  risk: VocRisk
  description: string
  /** 이런 일이 보이면 바로 점검할 신호(관찰 사실이 아니라 점검 기준) */
  warningSigns: string[]
  /** 예방 포인트 */
  preventionTips: string[]
  avoidConditions: string[]
  recommendedDirections?: MenuDirection[]
}

export const menuVocRiskRules: MenuVocRiskRule[] = [
  {
    risk: '품절',
    description: '인기 메뉴의 준비 수량이 예상 식수보다 적거나, 대체 메뉴가 준비되지 않았을 때 생깁니다.',
    warningSigns: [
      '배식 시작 30분 안에 메인이 절반 넘게 줄어듭니다.',
      '같은 메뉴가 최근 2주 안에 품절된 적이 있습니다.',
    ],
    preventionTips: [
      '인기 메뉴는 예상 식수보다 5~10% 여유 있게 준비합니다.',
      '품절될 때 바로 낼 대체 메뉴 1종을 미리 정해 둡니다.',
      '배식 중간에 남은 양을 확인하고 추가 조리 여부를 정합니다.',
    ],
    avoidConditions: ['수급이 불안정한 식재료 위주 구성', '중간 수량 확인 없음'],
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
  },
  {
    risk: '양 부족',
    description: '1인 배식량 기준이 없거나, 추가 배식 기준을 안내하지 않았을 때 생깁니다.',
    warningSigns: ['같은 메뉴를 더 달라는 요청이 이어집니다.', '배식 후반에 메인이 모자라 양을 줄여 담게 됩니다.'],
    preventionTips: [
      '메인·밥의 1인 배식량을 정하고 배식 도구(국자·집게)를 맞춥니다.',
      '추가 배식이 되는지, 어디서 받는지 배식대에 안내합니다.',
      '배식이 끝나면 남은 양과 모자랐던 메뉴를 기록해 다음 발주에 반영합니다.',
    ],
    avoidConditions: ['식수 변화를 발주에 반영하지 않음', '배식량 기준 없음'],
    recommendedDirections: ['가성비', '간편 운영형', '균형형'],
  },
  {
    risk: '염도',
    description: '국물·소스의 간을 사람마다 다르게 맞추거나, 배식 중 국물이 졸아 짜질 때 생깁니다.',
    warningSigns: ['국이 배식 중에 졸아 양이 눈에 띄게 줄었습니다.', '같은 메뉴인데 회차마다 간이 다르다는 말이 나옵니다.'],
    preventionTips: [
      '국·소스는 레시피대로 계량하고, 배식 전에 염도계나 시식으로 간을 확인합니다.',
      '배식 중 국이 졸면 물을 보충하고 다시 간을 봅니다.',
      '간이 센 메인에는 무침·나물처럼 싱거운 반찬을 함께 냅니다.',
    ],
    avoidConditions: ['간 보는 담당자 없음', '국 간 기준 없음'],
    recommendedDirections: ['건강식', '균형형', '트렌디 메뉴'],
  },
  {
    risk: '느끼함',
    description: '튀김·볶음처럼 기름진 메뉴가 한 상에 겹치거나, 기름을 충분히 빼지 않았을 때 생깁니다.',
    warningSigns: ['메인과 반찬이 모두 튀김·볶음입니다.', '잔반에 기름진 메뉴가 많이 남습니다.'],
    preventionTips: [
      '튀긴 음식은 망에 세워 기름을 빼고 담습니다.',
      '기름진 메인에는 겉절이·무침처럼 산뜻한 반찬을 붙입니다.',
      '한 상에 튀김·전은 1가지만 냅니다.',
    ],
    avoidConditions: ['튀김류 2개 이상 구성', '기름진 메인과 기름진 반찬 함께 구성'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '대기시간',
    description: '한 번에 조리할 수 없는 메뉴(구이·면)를 고르거나, 배식 동선이 한 줄로 몰릴 때 생깁니다.',
    warningSigns: ['배식 시작 직후 줄이 10분 넘게 이어집니다.', '구이·면 메뉴를 배식 중에 조리하고 있습니다.'],
    preventionTips: [
      '배식 시작 전에 1차분을 미리 준비하고, 이후는 회차별로 나눠 조리합니다.',
      '밥·국·반찬을 미리 담아 두거나 배식 라인을 둘로 나눕니다.',
      '오래 걸리는 메뉴는 배식 직원을 한 명 더 둡니다.',
    ],
    avoidConditions: ['배식 중 조리량이 많은 메뉴', '배식 라인 1개 운영'],
    recommendedDirections: ['가성비', '간편 운영형', '트렌디 메뉴'],
  },
  {
    risk: '보온 지연',
    description: '음식을 너무 일찍 만들어 두거나, 보온고 온도를 확인하지 않을 때 생깁니다.',
    warningSigns: ['배식 시작보다 1시간 넘게 일찍 조리를 마쳤습니다.', '데워 달라는 요청이 이어집니다.'],
    preventionTips: [
      '배식 시작 시간에 맞춰 조리를 마치고, 남은 양은 회차별로 나눠 조리합니다.',
      '보온고 온도와 넣은 시간을 기록하고 정해 둔 시간이 지나면 교체합니다.',
      '튀김·면처럼 식으면 맛이 떨어지는 메뉴는 소량씩 자주 냅니다.',
    ],
    avoidConditions: ['보온고 온도 확인 없음', '대량 선조리'],
    recommendedDirections: ['가성비', '균형형', '건강식'],
  },
  {
    risk: '이물 혼입',
    description: '식재료 손질·세척 단계에서 이물을 걸러내지 못했을 때 생깁니다.',
    warningSigns: ['최근 같은 식재료에서 이물이 나온 적이 있습니다.', '손질 담당자가 바뀌었거나 손질 시간이 부족했습니다.'],
    preventionTips: [
      '채소·해산물은 세척 후 한 번 더 눈으로 확인합니다.',
      '뼈·가시가 있는 식재료는 손질 후 남은 조각을 확인합니다.',
      '조리 도구(수세미·철솔)는 닳은 것을 바로 바꿉니다.',
    ],
    avoidConditions: ['식재료 상태 확인 누락', '손질 기록 없음'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '위생',
    description: '날로 먹는 음식의 세척·보관이나 조리 기구 관리가 소홀할 때 생깁니다.',
    warningSigns: ['생채소·회 등 익히지 않는 메뉴가 있습니다.', '냉장 배식대 온도를 확인하지 않았습니다.'],
    preventionTips: [
      '생채소는 세척·소독하고 기록을 남깁니다.',
      '냉장 메뉴는 배식대 온도를 확인하고, 실온에 두는 시간을 정해 둡니다.',
      '조리 전과 작업이 바뀔 때마다 손을 씻고 장갑을 바꿉니다.',
    ],
    avoidConditions: ['세척·소독 기록 없음', '보관 온도 확인 없음'],
    recommendedDirections: ['건강식', '균형형', '간편 운영형'],
  },
  {
    risk: '고객 불편',
    description: '맵기·재료·추가 배식 같은 정보를 미리 안내하지 않았을 때 생깁니다.',
    warningSigns: ['맵거나 향이 강한 메뉴가 있습니다.', '같은 질문이 배식대에서 여러 번 나옵니다.'],
    preventionTips: [
      '맵기와 주요 재료(알레르기 유발 식품 포함)를 메뉴판에 적습니다.',
      '매운 메뉴에는 덜 매운 선택지나 대체 반찬을 둡니다.',
      '자주 나오는 질문의 답을 배식대에 붙여 둡니다.',
    ],
    avoidConditions: ['메뉴 정보 안내 없음', '대체 메뉴 없음'],
    recommendedDirections: ['건강식', '가성비', '트렌디 메뉴'],
  },
  {
    risk: '직원 응대',
    description: '바쁜 시간에 안내가 짧아지거나, 직원마다 안내 내용이 다를 때 생깁니다.',
    warningSigns: ['배식 직원이 부족한 시간대가 있습니다.', '같은 요청에 직원마다 다르게 답합니다.'],
    preventionTips: [
      '추가 배식·교환 같은 자주 받는 요청의 답을 직원끼리 맞춥니다.',
      '바쁜 시간대에는 배식 직원을 한 명 더 둡니다.',
      '불만이 생기면 바로 식당관리자에게 넘기는 기준을 정해 둡니다.',
    ],
    avoidConditions: ['직원별 안내 내용 다름', '관리자 보고 기준 없음'],
    recommendedDirections: ['트렌디 메뉴', '건강식', '가성비'],
  },
]

export const menuVocRiskRuleMap: Record<VocRisk, MenuVocRiskRule> =
  Object.fromEntries(menuVocRiskRules.map((item) => [item.risk, item])) as Record<VocRisk, MenuVocRiskRule>
