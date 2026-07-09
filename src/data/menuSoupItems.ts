import type { VocRisk } from './menuMainItems'

export type SoupRole =
  | 'main-support'
  | 'light'
  | 'premium'
  | 'mild'
  | 'safe-option'
  | 'balanced'

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
    name: 'Miso Soup',
    roles: ['light', 'main-support'],
    fitWith: ['한식', '건강식'],
    avoidWith: ['heavy broth'],
    strengths: ['light flavor profile', 'easy to scale'],
    risks: ['염도', '고객 불편'],
  },
  {
    name: 'Soybean Sprout Soup',
    roles: ['main-support', 'balanced'],
    fitWith: ['한식', '분식', '건강식'],
    avoidWith: ['repeated soy-heavy combination'],
    strengths: ['stable baseline menu', 'good complement for main dish'],
    risks: ['고객 불편', '대기시간'],
  },
  {
    name: 'Soybean Paste Stew',
    roles: ['main-support', 'safe-option'],
    fitWith: ['한식'],
    avoidWith: ['salt-first preference group'],
    strengths: ['clear seasonal consistency', 'easy operation'],
    risks: ['염도', '이물 혼입'],
  },
  {
    name: 'Clear Broth',
    roles: ['mild', 'main-support'],
    fitWith: ['한식', '일반'],
    avoidWith: ['high-fat menus'],
    strengths: ['neutral taste', 'low operation complexity'],
    risks: ['고객 불편', '보온 지연'],
  },
  {
    name: 'Vegetable Soup',
    roles: ['light', 'balanced'],
    fitWith: ['건강식', '아시안'],
    avoidWith: ['greasy side cluster'],
    strengths: ['low fat option', 'easy substitution'],
    risks: ['느끼함', '직원 응대'],
  },
  {
    name: 'Egg Soup',
    roles: ['main-support', 'safe-option'],
    fitWith: ['한식', '아시안', '분식'],
    avoidWith: ['high cost variant'],
    strengths: ['fast rotation', 'good for breakfast'],
    risks: ['대기시간', '양 부족'],
  },
  {
    name: 'Seafood Stew Soup',
    roles: ['premium', 'balanced'],
    fitWith: ['아시안', '일반'],
    avoidWith: ['allergen-sensitive group'],
    strengths: ['high differentiation', 'customer preference for premium options'],
    risks: ['이물 혼입', '위생'],
  },
  {
    name: 'Jjamppong Broth',
    roles: ['balanced', 'main-support'],
    fitWith: ['아시안'],
    avoidWith: ['high-risk seafood substitute'],
    strengths: ['standard volume control', 'acceptable flavor profile'],
    risks: ['염도', '품절'],
  },
  {
    name: 'Mild Bean Paste Stew',
    roles: ['main-support', 'light'],
    fitWith: ['한식', '건강식'],
    avoidWith: ['extreme spicy demand'],
    strengths: ['steady demand handling', 'simple reheating'],
    risks: ['염도', '위생'],
  },
  {
    name: 'Kimchi Stew',
    roles: ['main-support', 'balanced'],
    fitWith: ['한식', '분식'],
    avoidWith: ['extreme spicy intolerance'],
    strengths: ['high familiarity', 'simple service flow'],
    risks: ['고객 불편', '직원 응대'],
  },
  {
    name: 'Soft Tofu Soup',
    roles: ['light', 'main-support'],
    fitWith: ['건강식', '한식'],
    avoidWith: ['oily side stack'],
    strengths: ['mild texture', 'low reheat friction'],
    risks: ['보온 지연', '염도'],
  },
  {
    name: 'Fish Cake Soup',
    roles: ['main-support', 'safe-option'],
    fitWith: ['분식', '한식'],
    avoidWith: ['rush-hour-only operations'],
    strengths: ['short prep lead', 'easy to adjust quantity'],
    risks: ['대기시간', '위생'],
  },
  {
    name: 'Seaweed Broth',
    roles: ['light', 'balanced'],
    fitWith: ['한식', '건강식'],
    avoidWith: ['high-salt side pairing'],
    strengths: ['clean taste', 'quick cook'],
    risks: ['고객 불편', '직원 응대'],
  },
  {
    name: 'Bean Jelly Soup',
    roles: ['main-support', 'safe-option'],
    fitWith: ['건강식', '한식'],
    strengths: ['soft taste profile', 'standardized management'],
    avoidWith: ['strong seasoning'],
    risks: ['염도', '보온 지연'],
  },
  {
    name: 'Morning Hangover Soup',
    roles: ['safe-option', 'mild'],
    fitWith: ['한식', '건강식'],
    avoidWith: ['spicy side stack'],
    strengths: ['light recovery option', 'good for late shift'],
    risks: ['고객 불편', '대기시간'],
  },
  {
    name: 'Dried Radish Soup',
    roles: ['main-support', 'light'],
    fitWith: ['한식'],
    avoidWith: ['high fat topping'],
    strengths: ['easy control', 'balanced aroma'],
    risks: ['염도', '위생'],
  },
  {
    name: 'Potato Soup',
    roles: ['main-support', 'balanced'],
    fitWith: ['한식', '건강식', '분식'],
    avoidWith: ['greasy heavy side'],
    strengths: ['budget-friendly', 'easy topping expansion'],
    risks: ['양 부족', '대기시간'],
  },
  {
    name: 'Mushroom Soup',
    roles: ['balanced', 'premium'],
    fitWith: ['한식', '양식', '건강식'],
    avoidWith: ['allergy-sensitive'],
    strengths: ['differentiation point', 'easy to upscale'],
    risks: ['이물 혼입', '직원 응대'],
  },
  {
    name: 'Corn Soup',
    roles: ['premium', 'safe-option'],
    fitWith: ['양식', '아시안'],
    avoidWith: ['sensitive group'],
    strengths: ['quick menu upgrade', 'good trend fit'],
    risks: ['품절', '고객 불편'],
  },
  {
    name: 'Vegetable Cream Soup',
    roles: ['light', 'balanced'],
    fitWith: ['건강식', '한식', '양식'],
    avoidWith: ['strong oil group'],
    strengths: ['light starter option', 'smooth mixing'],
    risks: ['염도', '고객 불편'],
  },
]

export const menuSoupItems: SoupMenuItem[] = soupTemplates.map((soup, index) => ({
  ...soup,
  id: `soup-${(index + 1).toString().padStart(2, '0')}`,
}))

