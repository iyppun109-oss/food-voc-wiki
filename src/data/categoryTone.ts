/** 불만 유형을 다섯 색 묶음으로 나눠 목록에 리듬을 줍니다 */
export const categoryTone: Record<string, string> = {
  '이물 혼입': 'foreign',
  벌레: 'foreign',
  머리카락: 'foreign',
  '비닐/플라스틱': 'foreign',
  '뼈/가시': 'foreign',
  품질: 'taste',
  염도: 'taste',
  품절: 'stock',
  '양 부족': 'stock',
  '위생 불만': 'safety',
  '식중독 의심': 'safety',
  안전사고: 'safety',
  '직원 응대': 'service',
}
