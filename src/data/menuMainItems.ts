export type MealType = '조식' | '중식' | '석식' | '야식'

export type CustomerType =
  | '사무직'
  | '생산직'
  | '야근자'
  | '협력사'
  | '일반'

export type MenuDirection =
  | '든든한 메뉴'
  | '트렌디 메뉴'
  | '건강식'
  | '프리미엄'
  | '가성비'
  | '간편 운영형'
  | '균형형'

export type VocRisk =
  | '품절'
  | '양 부족'
  | '염도'
  | '느끼함'
  | '대기시간'
  | '보온 지연'
  | '이물 혼입'
  | '위생'
  | '고객 불편'
  | '직원 응대'

export type MainMenuItem = {
  id: string
  name: string
  category: string
  mealFit: MealType[]
  customerFit: CustomerType[]
  directions: MenuDirection[]
  strengths: string[]
  risks: VocRisk[]
  bestSides: string[]
  avoidSides: string[]
  bestSoups: string[]
  upgradeIdeas: string[]
  vocPrevention: string[]
  operationNotes: string[]
}

const mainTemplates: Array<Omit<MainMenuItem, 'id'>> = [
  {
    name: '매콤 제육 정식',
    category: '한식',
    mealFit: ['중식', '야식'],
    customerFit: ['생산직', '야근자', '일반'],
    directions: ['든든한 메뉴', '가성비'],
    strengths: ['단백질 비중이 높아 만족도 확보'],
    risks: ['양 부족', '보온 지연', '대기시간'],
    bestSides: ['콩나물무침', '김치볶음', '브로콜리무침'],
    avoidSides: ['오징어무침', '생채', '비린내채소'],
    bestSoups: ['미역국', '두부된장국'],
    upgradeIdeas: ['쌀밥 양을 상향 조정', '음료 1종 추가 안내'],
    vocPrevention: ['반찬 계량표 체크', '출고 전 최종 수량 확인'],
    operationNotes: ['조리 중 덜 익은 부위 점검', '배식 전 간격 관리'],
  },
  {
    name: '김치찌개 정식',
    category: '한식',
    mealFit: ['중식', '석식'],
    customerFit: ['사무직', '일반', '협력사'],
    directions: ['건강식', '균형형'],
    strengths: ['국물류로 편의성 높음', '짠맛 조절이 가능'],
    risks: ['염도', '이물 혼입'],
    bestSides: ['무생채', '계란찜', '깍두기'],
    avoidSides: ['생채', '오징어무침', '회무침'],
    bestSoups: ['미역국', '맑은국'],
    upgradeIdeas: ['국물 염도 기준표 재점검'],
    vocPrevention: ['국물 간 중간 확인', '김치 입고 상태 점검'],
    operationNotes: ['기준 레시피로 간 조정', '배식 전 국물 온도 확인'],
  },
  {
    name: '불고기 비빔 정식',
    category: '한식',
    mealFit: ['중식', '석식'],
    customerFit: ['사무직', '일반', '생산직'],
    directions: ['프리미엄', '든든한 메뉴'],
    strengths: ['고기질이 좋아 호응도 높음'],
    risks: ['고객 불편', '대기시간'],
    bestSides: ['계란찜', '어묵볶음', '브로콜리나물'],
    avoidSides: ['매우맵기채소', '오징어무침'],
    bestSoups: ['맑은국', '콩나물국'],
    upgradeIdeas: ['소스 구성 조정', '추가 단백질 토핑'],
    vocPrevention: ['조리 원부자재 이력 추적', '출고 체크리스트 사용'],
    operationNotes: ['굽기 전 수분 확인', '배식 전 2차 확인'],
  },
  {
    name: '새우볶음밥 정식',
    category: '아시안',
    mealFit: ['중식', '야식'],
    customerFit: ['야근자', '일반', '사무직'],
    directions: ['트렌디 메뉴', '가성비'],
    strengths: ['조리 속도가 빠르고', '구성 변경이 유연'],
    risks: ['양 부족', '품절', '대기시간'],
    bestSides: ['새우튀김', '단무지', '무생채'],
    avoidSides: ['회무침', '생채'],
    bestSoups: ['계란국', '맑은국'],
    upgradeIdeas: ['메인량 +1인분 여유 분량 추가', '고명 변경'],
    vocPrevention: ['재료 수급량 사전 등록', '조리 완료 시간 점검'],
    operationNotes: ['볶음 정도 스탠다드화', '출고 전 2회 간 교차 점검'],
  },
  {
    name: '시래기된장국 정식',
    category: '한식',
    mealFit: ['조식', '중식', '석식'],
    customerFit: ['사무직', '일반', '협력사'],
    directions: ['건강식', '균형형'],
    strengths: ['담백한 국물로 식사 집중도 유지'],
    risks: ['염도', '위생'],
    bestSides: ['두부조림', '오이무침', '깍두기'],
    avoidSides: ['회무침', '생채'],
    bestSoups: ['맑은국', '된장찌개'],
    upgradeIdeas: ['채소 편차 보완용 나물 교차 운영'],
    vocPrevention: ['국물 간 점검 간격 고정', '조리기구 위생점검'],
    operationNotes: ['채소 예열 온도 점검', '국물 보온시간 관리'],
  },
  {
    name: '두부김치 정식',
    category: '한식',
    mealFit: ['중식', '석식'],
    customerFit: ['사무직', '일반'],
    directions: ['건강식', '가성비'],
    strengths: ['채소와 단백질 비중 균형'],
    risks: ['느끼함', '염도'],
    bestSides: ['김치볶음', '시금치나물', '배추김치'],
    avoidSides: ['양념과다채소', '짜게요리'],
    bestSoups: ['된장국', '미역국'],
    upgradeIdeas: ['소스 분할 제공', '드레싱 추가 제공'],
    vocPrevention: ['간편 레시피 표준 사용', '기본 간 이력 정리'],
    operationNotes: ['두부 수분 분리 확인', '조리 구간 온도 기록'],
  },
  {
    name: '닭다리살 구이 정식',
    category: '구이',
    mealFit: ['중식', '야식'],
    customerFit: ['생산직', '야근자'],
    directions: ['든든한 메뉴', '프리미엄'],
    strengths: ['고기 식감이 안정적'],
    risks: ['양 부족', '보온 지연'],
    bestSides: ['무생채', '브로콜리나물', '감자볶음'],
    avoidSides: ['느끼한반찬', '기름진튀김'],
    bestSoups: ['계란국', '콩나물국'],
    upgradeIdeas: ['조리 후 휴지시간 최소화', '즉시 보온 라인 분할'],
    vocPrevention: ['조리 온도와 시간 기록', '보온시간 상한선 준수'],
    operationNotes: ['내부온도 체크', '고기 수량 여유분 확보'],
  },
  {
    name: '소고기 불고기 덮밥',
    category: '한식',
    mealFit: ['중식', '야식'],
    customerFit: ['일반', '사무직', '생산직'],
    directions: ['프리미엄', '트렌디 메뉴'],
    strengths: ['제공 시간이 짧고 운영 편리'],
    risks: ['대기시간', '품절'],
    bestSides: ['상추겉절이', '오이무침', '김치볶음'],
    avoidSides: ['매운볶음류', '회무침'],
    bestSoups: ['된장국', '맑은국'],
    upgradeIdeas: ['고기량 +1인분', '볶음류 양 조절'],
    vocPrevention: ['재료 출고 체크리스트', '추가 배식 정책 사전 공유'],
    operationNotes: ['보온 유지 구간 분리', '전처리량 대비 사용량 입력'],
  },
  {
    name: '연어 구이 정식',
    category: '양식',
    mealFit: ['중식', '석식'],
    customerFit: ['일반', '사무직', '협력사'],
    directions: ['프리미엄', '트렌디 메뉴'],
    strengths: ['차별화된 메뉴 구성'],
    risks: ['이물 혼입', '직원 응대'],
    bestSides: ['에그샐러드', '브로콜리나물', '버섯볶음'],
    avoidSides: ['오징어무침', '회무침'],
    bestSoups: ['콘스프', '맑은국'],
    upgradeIdeas: ['신선도 확인 단계 강화'],
    vocPrevention: ['수입식재 확인', '위생 교차오염 점검'],
    operationNotes: ['냉동 해동 기록', '조리판 오염 점검'],
  },
  {
    name: '돼지갈비 정식',
    category: '한식',
    mealFit: ['중식', '석식', '야식'],
    customerFit: ['생산직', '야근자', '일반'],
    directions: ['든든한 메뉴', '가성비'],
    strengths: ['고기량 확보로 만족도 높음'],
    risks: ['양 부족', '대기시간'],
    bestSides: ['새송이버섯볶음', '감자구이', '브로콜리무침'],
    avoidSides: ['과한기름반찬', '매운채소'],
    bestSoups: ['된장국', '맑은국'],
    upgradeIdeas: ['메인 수량 재계산', '추가 메뉴 라인'],
    vocPrevention: ['출고 전 중량 확인', '조리 단계별 수량 체크'],
    operationNotes: ['육수 사용량 표준화', '조리 시간 표준 고정'],
  },
  {
    name: '닭가슴살 샐러드 정식',
    category: '건강식',
    mealFit: ['조식', '중식', '석식'],
    customerFit: ['사무직', '일반', '협력사'],
    directions: ['건강식', '균형형'],
    strengths: ['저지방 구성', '포만감 유지'],
    risks: ['염도', '느끼함'],
    bestSides: ['샐러드채소', '올리브파스타샐러드', '삶은계란'],
    avoidSides: ['진한드레싱', '매운야채'],
    bestSoups: ['채소스프', '맑은국'],
    upgradeIdeas: ['드레싱 소분 제공', '고단백 토핑 추가'],
    vocPrevention: ['소금·오일량 기준 공유', '채소 이물 검수'],
    operationNotes: ['채소 세척 주기 기록', '보관 온도 로그'],
  },
  {
    name: '채식 비빔밥 정식',
    category: '건강식',
    mealFit: ['조식', '중식', '석식'],
    customerFit: ['일반', '사무직'],
    directions: ['건강식', '균형형'],
    strengths: ['채소 다양성 우수'],
    risks: ['위생', '고객 불편'],
    bestSides: ['무생채', '시금치나물', '가지나물'],
    avoidSides: ['회무침', '생채'],
    bestSoups: ['된장국', '채소국'],
    upgradeIdeas: ['드레싱 별도 제공', '단백질 옵션 추가'],
    vocPrevention: ['채소 보관 상태 점검', '제공 직전 마무리 점검'],
    operationNotes: ['재료 세척 루틴 고정', '유통기한 선검수'],
  },
  {
    name: '매운 떡볶이 정식',
    category: '분식',
    mealFit: ['중식', '야식'],
    customerFit: ['야근자', '생산직', '일반'],
    directions: ['트렌디 메뉴', '가성비'],
    strengths: ['젊은 층 반응 좋음'],
    risks: ['염도', '대기시간'],
    bestSides: ['오뎅국', '단무지', '계란찜'],
    avoidSides: ['매운기름많은반찬', '오징어무침'],
    bestSoups: ['맑은국', '오뎅국'],
    upgradeIdeas: ['짠맛·매운맛 선택지 분리'],
    vocPrevention: ['양념 레시피 표준', '떡볶이 농도 점검'],
    operationNotes: ['고열 볶음 시간 관리', '주문량 기반 증량'],
  },
  {
    name: '볶음짬뽕 정식',
    category: '아시안',
    mealFit: ['중식', '석식', '야식'],
    customerFit: ['사무직', '일반', '협력사'],
    directions: ['트렌디 메뉴', '프리미엄'],
    strengths: ['국물·메인 균형', '메뉴 변형 용이'],
    risks: ['품절', '보온 지연', '위생'],
    bestSides: ['단무지', '브로콜리무침', '계란찜'],
    avoidSides: ['오징어무침', '회무침'],
    bestSoups: ['짬뽕국', '맑은국'],
    upgradeIdeas: ['해물 수량 조정', '면류 수분 점검'],
    vocPrevention: ['전처리 라인 교차점검', '보온 라인 분산 운영'],
    operationNotes: ['재료 입고량 대비 배차량 확인', '온도 기록'],
  },
  {
    name: '계란장조림 정식',
    category: '한식',
    mealFit: ['조식', '중식'],
    customerFit: ['사무직', '일반', '협력사'],
    directions: ['간편 운영형', '가성비'],
    strengths: ['기본 운영 안정성'],
    risks: ['양 부족', '직원 응대'],
    bestSides: ['무생채', '계란찜', '김치볶음'],
    avoidSides: ['고추기름많은반찬', '오징어무침'],
    bestSoups: ['맑은국', '두부된장국'],
    upgradeIdeas: ['추가 반찬 1종 준비', '장조림 국물 별도 제공'],
    vocPrevention: ['조리 완료량 공유', '배식 순서 통제'],
    operationNotes: ['소스 간 기준 기록', '최종 조리상태 점검'],
  },
  {
    name: '해물짬뽕 정식',
    category: '아시안',
    mealFit: ['중식', '야식'],
    customerFit: ['일반', '사무직', '야근자'],
    directions: ['프리미엄', '트렌디 메뉴'],
    strengths: ['해산물 풍미가 일품'],
    risks: ['품절', '이물 혼입'],
    bestSides: ['무생채', '계란찜', '오이무침'],
    avoidSides: ['회무침', '생채'],
    bestSoups: ['짬뽕국', '콩나물국'],
    upgradeIdeas: ['해물 입고량 선확보', '알러지 안내 추가'],
    vocPrevention: ['해물 세척 체크리스트', '이물 검수 라인'],
    operationNotes: ['냉장 보관 기록', '재료 입고 전수'],
  },
  {
    name: '치킨데리야끼 덮밥',
    category: '일식',
    mealFit: ['중식', '야식'],
    customerFit: ['일반', '생산직', '야근자'],
    directions: ['트렌디 메뉴', '가성비'],
    strengths: ['밸런스와 만족도 높음'],
    risks: ['양 부족', '대기시간'],
    bestSides: ['김치볶음', '브로콜리무침', '오이무침'],
    avoidSides: ['기름진튀김', '짠반찬'],
    bestSoups: ['맑은국', '콘스프'],
    upgradeIdeas: ['밥·소스 비율 사전 조정'],
    vocPrevention: ['주문량 기반 조리 배치', '출고 직전 수량 재확인'],
    operationNotes: ['덮밥 봉투 수량 기준 적용', '보온 용기 관리'],
  },
  {
    name: '새싹삼겹 정식',
    category: '한식',
    mealFit: ['중식', '석식', '야식'],
    customerFit: ['생산직', '야근자', '일반'],
    directions: ['든든한 메뉴', '프리미엄'],
    strengths: ['고기 중심 메뉴', '포만감 우수'],
    risks: ['보온 지연', '양 부족'],
    bestSides: ['감자구이', '브로콜리무침', '깍두기'],
    avoidSides: ['기름진반찬', '매운어묵'],
    bestSoups: ['된장국', '콩나물국'],
    upgradeIdeas: ['배식속도 높이기', '보온구간 보강'],
    vocPrevention: ['고기 보온 시간 제한', '추가 배식 안내'],
    operationNotes: ['보온기 온도 점검', '조리분 라인별 표시'],
  },
]

/**
 * 메인 메뉴 목록.
 * 이전에는 같은 메뉴를 "(추가 메뉴)", "(업그레이드)"로 3벌 복제한 뒤 30개로 잘라
 * 추천 1~3위가 같은 메뉴로 채워지고 11번째 이후 메뉴는 추천되지 않았습니다.
 */
export const menuMainItems: MainMenuItem[] = mainTemplates.map((item, index) => ({
  ...item,
  id: `main-${String(index + 1).padStart(2, '0')}`,
}))
