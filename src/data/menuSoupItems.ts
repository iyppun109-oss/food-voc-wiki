import type { VocRisk } from './menuMainItems'

export type SoupRole =
  | '메인지원'
  | '가볍게'
  | '프리미엄'
  | '담백'
  | '안전형'
  | '균형형'

export type SoupMenuItem = {
  id: string
  name: string
  roles: SoupRole[]
  fitWith: string[]
  avoidWith: string[]
  strengths: string[]
  risks: VocRisk[]
}

const soupTemplates: Omit<SoupMenuItem, 'id'>[] = [
  {
    name: '미역국',
    roles: ['균형형', '메인지원'],
    fitWith: ['조식', '중식'],
    avoidWith: ['진한단짠메뉴'],
    strengths: ['담백한 맛으로 식후 부담이 적음', '점검이 쉬운 메뉴군'],
    risks: ['품절', '대기시간'],
  },
  {
    name: '콩나물국',
    roles: ['메인지원', '균형형'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['짠국물강조'],
    strengths: ['국물 양 조절이 쉬움', '제공 속도 빠름'],
    risks: ['염도', '대기시간'],
  },
  {
    name: '된장국',
    roles: ['안전형', '메인지원'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['향신료강도높음'],
    strengths: ['국물 간 조절 여지가 큼', '메인 보완용으로 활용도 높음'],
    risks: ['염도', '느끼함'],
  },
  {
    name: '맑은국',
    roles: ['담백', '메인지원'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['자극강한국물'],
    strengths: ['맵기/짠맛 이슈 분리 용이', '메뉴 간 충돌이 적음'],
    risks: ['염도'],
  },
  {
    name: '계란국',
    roles: ['가볍게', '균형형'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['고도기름메뉴'],
    strengths: ['구성 완성도가 쉬움', '조리 시간이 안정적'],
    risks: ['대기시간', '고객 불편'],
  },
  {
    name: '어묵탕',
    roles: ['프리미엄', '안전형'],
    fitWith: ['중식', '야식'],
    avoidWith: ['알레르기중점'],
    strengths: ['보관·재열 안정성 확인 용이', '메뉴 밀도 조절이 쉬움'],
    risks: ['이물 혼입', '위생'],
  },
  {
    name: '순두부찌개',
    roles: ['가볍게', '균형형'],
    fitWith: ['중식', '석식'],
    avoidWith: ['맵기강조'],
    strengths: ['조리 변수를 단순화', '재료 교체 여지 확보'],
    risks: ['느끼함', '염도'],
  },
  {
    name: '김치찌개',
    roles: ['안전형', '메인지원'],
    fitWith: ['중식', '석식', '야식'],
    avoidWith: ['고칼로리부반찬'],
    strengths: ['메인 호응도가 높은 구성', '열량과 포만감 확보'],
    risks: ['염도', '위생'],
  },
  {
    name: '소고기뭇국',
    roles: ['메인지원', '균형형'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['과한국물농도'],
    strengths: ['식사 후 편안한 맛', '국물량 기준 맞추기 쉬움'],
    risks: ['품절', '양 부족'],
  },
  {
    name: '청포묵국',
    roles: ['가볍게', '균형형'],
    fitWith: ['조식', '중식'],
    avoidWith: ['오래된국물'],
    strengths: ['짠맛 체감 완화', '식사 편차 완화'],
    risks: ['염도', '고객 불편'],
  },
  {
    name: '미역줄기국',
    roles: ['담백', '안전형'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['조리시간지연'],
    strengths: ['식감이 부드러워 접근성 높음', '단가 편차 관리가 쉬움'],
    risks: ['양 부족', '보온 지연'],
  },
  {
    name: '도토리묵국',
    roles: ['담백', '균형형'],
    fitWith: ['조식', '중식', '석식'],
    avoidWith: ['짠간'],
    strengths: ['재료 처리 공정이 단순함', '국물 간 조절이 직관적'],
    risks: ['염도', '위생'],
  },
]

export const menuSoupItems: SoupMenuItem[] = soupTemplates.map((soup, index) => ({
  ...soup,
  id: `soup-${String(index + 1).padStart(2, '0')}`,
}))
