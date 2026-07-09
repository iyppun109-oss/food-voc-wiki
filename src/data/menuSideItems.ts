import type { VocRisk } from './menuMainItems'

export type SideRole =
  | '메인 보완'
  | '가볍게'
  | '기름 관리'
  | '담백형'
  | '느끼함 완화'
  | '알레르기 대체'
  | '아이 입맛'
  | '프리미엄'

export type SideMenuItem = {
  id: string
  name: string
  roles: SideRole[]
  fitWith: string[]
  avoidWith: string[]
  strengths: string[]
  risks: VocRisk[]
}

const sideNames = [
  '오이무침',
  '콩나물무침',
  '김치볶음',
  '브로콜리무침',
  '무생채',
  '두부조림',
  '계란찜',
  '깍두기',
  '계란말이',
  '김치전',
  '시금치나물',
  '가지나물',
  '버섯볶음',
  '감자조림',
  '마늘쫑볶음',
  '오징어무침',
  '부추겉절이',
  '배추겉절이',
  '도토리묵무침',
  '연근조림',
  '무말랭이무침',
  '고추장무침',
  '비빔채소',
  '청경채나물',
  '콩조림',
  '멸치볶음',
  '새송이볶음',
  '양배추슬로우',
  '단무지',
  '깻잎무침',
  '오이볶음',
  '김치볶음',
  '감자볶음',
  '두부부침',
  '연두부무침',
  '미역줄기볶음',
  '상추겉절이',
  '고구마구이',
  '감자채볶음',
  '오이소박이',
  '쑥갓무침',
  '마늘쫑무침',
]

const sideRoleList: SideRole[] = ['메인 보완', '가볍게', '기름 관리', '담백형', '느끼함 완화', '알레르기 대체', '아이 입맛', '프리미엄']
const sideRiskHints: VocRisk[] = ['품절', '양 부족', '염도', '느끼함', '대기시간', '보온 지연', '이물 혼입', '위생', '고객 불편', '직원 응대']

export const menuSideItems: SideMenuItem[] = sideNames.map((name, index) => {
  const role = sideRoleList[index % sideRoleList.length]
  const riskA = sideRiskHints[index % sideRiskHints.length]
  const riskB = sideRiskHints[(index + 3) % sideRiskHints.length]

  return {
    id: `side-${index + 1}`,
    name,
    roles: [role, sideRoleList[(index + 2) % sideRoleList.length]],
    fitWith: index % 2 === 0 ? ['한식', '아시안'] : ['양식', '건강식'],
    avoidWith: index % 4 === 0 ? ['오징어무침', '회무침'] : [],
    strengths:
      index % 2 === 0
        ? ['식사 후 간편히 배식', '메인과 밸런스', '비용 변동 적음']
        : ['담백함 유지', '조리량 조절 용이', '재고 관리 편리'],
    risks: [riskA, riskB],
  }
})
