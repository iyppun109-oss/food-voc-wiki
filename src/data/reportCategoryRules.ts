/**
 * VOC 유형 판정 규칙
 * 고객 말씀(과 보조로 메모)에서 유형을 판정합니다. 문장은 utils/reportGenerator.ts가 만듭니다.
 */

export type ReportCategory =
  | '머리카락'
  | '벌레'
  | '비닐/플라스틱'
  | '뼈/가시'
  | '이물 혼입'
  | '품절'
  | '염도'
  | '품질'
  | '양 부족'
  | '위생 불만'
  | '직원 응대'
  | '식중독 의심'
  | '안전사고'
  | '시설·비품'
  | '기타'

export const QUALITY_COOKING_STATUS_KEYWORDS = [
  '덜익음',
  '덜 익음',
  '안 익음',
  '설익음',
  '익지 않음',
  '미가열',
  '가열 부족',
  '속이 차가움',
  '속이 덜 익음',
  '조리 부족',
  '조리상태 불량',
  '생고기',
  '반숙 아님',
  '피자가 덜 익음',
  '튀김이 덜 익음',
  '고기가 덜 익음',
]

/** 활용형까지 잡는 조리 상태 표현: '덜 익었어요', '안 익은', '익지 않았' 등 */
export const QUALITY_COOKING_STATUS_PATTERNS: RegExp[] = [/덜\s?익/, /안\s?익/, /설익/, /익지\s?않/, /생고기/, /핏물/, /속이\s?(차갑|차가|얼어)/]

type AliasKeyword = string | RegExp

/**
 * 유형 판정 규칙. 배열 순서가 곧 우선순위입니다.
 * - 고위험 유형(식중독 의심, 안전사고)을 가장 먼저 판정합니다.
 * - 한 글자 키워드(예: '간')는 '시간', '간장'에도 걸리므로 문자열 대신 정규식으로 경계를 둡니다.
 */
export const REPORT_TEMPLATE_ALIASES: Array<{ type: ReportCategory; keywords: AliasKeyword[] }> = [
  {
    type: '식중독 의심',
    keywords: [
      '식중독',
      '구토',
      '복통',
      '설사',
      '토사',
      '메스꺼',
      '울렁',
      '배탈',
      '장염',
      /배(가)?\s?(아프|아파|아팠|아픈|아픔)/,
      /(^|\s)토(했|함|할|하고|해서|하셨)/,
      // 구어 화풀이('열나게 기다림', '직원 태도에 속이 뒤집혀')는 증상으로 보지 않습니다.
      /^(?!.*(직원|태도|응대|기다|줄이|짜증|화가|화나)).*속(이)?\s?(안\s?좋|더부룩)/,
      /^(?=.*(먹|식사|섭취|드시|드신|드셨|점심|저녁|아침|후))(?!.*(직원|태도|응대|기다|줄이|짜증|화가|화나)).*속(이)?\s?(불편|뒤집|쓰려|쓰리|쓰림)/,
      '오한',
      /^(?!.*(직원|태도|응대|기다|줄이|짜증|화가|화나)).*(^|\s)열(이)?\s?(나|났)(?!게|네|서)/,
      '두드러기',
      '알레르기',
      '알러지',
      // '알레르기'라는 말이 없어도 먹은 뒤 붓거나 가렵다면 알레르기 의심 증상입니다.
      /(입술|목|혀|입안|입)(이|가|안|이랑)?\s?(부었|부어|붓|따끔|간지)/,
      /^(?!.*(맛|냄새|식감|향|말투|태도)\S*\s?(이|가)?\s?이상).*(먹고|먹은|먹었|먹다가|마시고|마신|마셨|드시고|드신|드셨|섭취\S*\s?후|식사\s?(후|하고|하다가|중))\S*\s.*(부었|부어|붓|가려|간지|두드러기|발진|숨\s?(이|을)?\s?(차|막|가빠|쉬기|못\s?쉬|쉬기\s?힘)|호흡|따끔|빨갛|빨개|이상해|이상하|어지러|어지럽|몸이\s?안\s?좋|토할|메스꺼|울렁)/,
    ],
  },
  {
    type: '안전사고',
    keywords: [
      '안전사고',
      '치아',
      '이빨',
      /이가\s?(깨|부러|빠|아프)/,
      '파절',
      '딱딱한 물질',
      '딱딱한 이물',
      '딱딱한 것',
      /돌(을)?\s?씹/,
      '이물 씹',
      '다쳤',
      '다침',
      '화상',
      '데었',
      '베임',
      '베였',
      '찔림',
      '찔렸',
      /미끄러(졌|짐|져서)/,
      /넘어(졌|짐|져서)/,
      '데임',
      '데였',
      /베(었|임|였)/,
    ],
  },
  { type: '머리카락', keywords: ['머리카락', '머리털', '헤어', '모발', '털이', 'hair'] },
  { type: '벌레', keywords: ['벌레', '벌래', '애벌레', '파리', '바퀴', '곤충', '구더기', '진드기', '날파리', '초파리'] },
  {
    type: '비닐/플라스틱',
    keywords: ['비닐', '플라스틱', '포장재', '포장지', '랩 조각', '비닐랩', '필름', '테이프', '고무장갑', '장갑 조각', 'plastic'],
  },
  { type: '뼈/가시', keywords: [/(^|[^가-힣])뼈/, '뼛조각', '생선 가시', /가시(가|를|이)?\s?(나|있|걸)/, '연골'] },
  {
    type: '이물 혼입',
    keywords: [
      '이물',
      '혼입',
      '쇳조각',
      '철수세미',
      '수세미',
      '금속',
      '쇠붙이',
      '철사',
      /유리(?!\s?(컵|창|문|병))/,
      '스테이플',
      /호치키스\s?심/,
      '볼트',
      '너트',
      /나사(?!렛)/,
      '머리끈',
      '고무밴드',
      /(^|\s)못(이|이나|\s?조각)/,
      '칼날',
      '고무줄',
      '고무 조각',
      '돌멩이',
      /(^|[^가-힣]|에|서)돌(\s?(이|을|조각|나|가)|$|[\s.,!?])/,
      /손톱(이|\s?조각)?\s?(나|들어|있|발견|씹|섞)/,
      '실밥',
      '실 같은',
      '나무 조각',
      '종이 조각',
      '이쑤시개',
      'foreign body',
    ],
  },
  {
    type: '품질',
    keywords: [
      ...QUALITY_COOKING_STATUS_KEYWORDS,
      ...QUALITY_COOKING_STATUS_PATTERNS,
      '품질',
      '식감',
      /^(?!.*(벽|천장|화장실|바닥|창문|창틀|에어컨|환풍|식판|컵|수저|숟가락|젓가락|포크|그릇|행주|수건|물수건|식기|쟁반|정수기|테이블|식탁)).*냄새/,
      /^(?!.*(벽|천장|화장실|바닥|창문|창틀|에어컨|환풍|식판|컵|수저|숟가락|젓가락|포크|그릇|행주|수건|물수건|식기|쟁반|정수기|테이블|식탁)).*쉰내/,
      '쉬었',
      '상했',
      '상한',
      '변질',
      '유통기한',
      '소비기한',
      /기한(이)?\s?지난/,
      /^(?!.*(벽|천장|화장실|바닥|창문|창틀|에어컨|환풍|식판|컵|수저|숟가락|젓가락|포크|그릇|행주|수건|물수건|식기|쟁반|정수기|테이블|식탁)).*곰팡/,
      /쉰\s?(것|거|맛|듯|김치|밥|국|반찬|우유|나물|떡|빵|김밥|도시락|음식|요구르트)/,
      '눅눅',
      '딱딱',
      '질기',
      '질겨',
      /^(?!.*(벽|천장|화장실|바닥|창문|창틀|에어컨|환풍|식판|컵|수저|숟가락|젓가락|포크|그릇|행주|수건|물수건|식기|쟁반|정수기|테이블|식탁)).*비린/,
      '식었',
      '식어서',
      /^(?!.*(직원|응대|태도|반응|말투|표정|분위기|에어컨|바람|냉방|실내|날씨|식판|컵|그릇|수저|정수기|물이)).*차갑/,
      /^(?!.*(직원|응대|태도|반응|말투|표정|분위기|에어컨|바람|냉방|실내|날씨|식판|컵|그릇|수저|정수기|물이)).*차가워/,
      /^(?!.*(직원|응대|태도|반응|말투|표정|분위기|에어컨|바람|냉방|실내|날씨|식판|컵|그릇|수저|정수기|물이)).*차가운/,
      '미지근',
      '불었',
      '퍼졌',
      '탔어',
      '탄 맛',
      '맛이 없',
      /너무\s?(매워|맵|매움)/,
      '시큼',
      '신맛',
      '쉰맛',
      '맛없',
      '맛이 이상',
      '설었',
      '셔요',
      '시어',
      '쉬어',
    ],
  },
  {
    type: '염도',
    keywords: ['염도', '짜다', '짜요', '짜서', '짜고', /짜(게|네|더|ㅠ)/, /(^|\s)짠/, /짬(?!뽕)/, '싱겁', '싱거', '소금', /(^|\s)간(이|을|은|도)?(\s|$|[.,!?])/],
  },
  {
    type: '위생 불만',
    keywords: ['위생', '청결', '먼지', '세균', '더러', '불결', '곰팡이', /(벽|천장|화장실|바닥|창문|창틀|에어컨|환풍|식판|컵|수저|숟가락|젓가락|포크|그릇|행주|수건|물수건|식기|쟁반|정수기|테이블|식탁)\S*\s?\S*(쉰내|냄새|비린내)/, '청소', '얼룩', '찌꺼기', '끈적', '덜 씻', '고춧가루 묻', '손톱', '맨손', /장갑(을)?\s?(안|미착용|없이)/],
  },
  {
    type: '시설·비품',
    keywords: [
      /(넘어질|미끄러질|다칠)\s?뻔/,
      '바닥이 젖',
      '미끄러워',
      '수저',
      '젓가락',
      '숟가락',
      '포크',
      '식기',
      '식판',
      /컵(?!라면|밥|케이크|과일)/,
      '냅킨',
      '물티슈',
      '정수기',
      '에어컨',
      '냉방',
      '난방',
      '덥다',
      '더워',
      '추워',
      '춥다',
      '소음',
      '시끄',
      /의자(가|이)?\s?(부족|없|흔들|부서|망가)/,
      /테이블(이)?\s?(부족|흔들|부서|망가)/,
      '조명',
      '자리가 없',
      '좌석',
      '퇴식',
      '잔반대',
    ],
  },
  { type: '품절', keywords: ['품절', '소진', '조기 마감', '재고 부족', '다 떨어', '떨어져서', '없어서 못', '못 먹었'] },
  {
    type: '양 부족',
    keywords: [
      '양 부족',
      '양부족',
      /양(이|도|은)?\s?(너무\s?)?(적|부족|모자)/,
      '배식량',
      '제공량',
      /(밥|반찬|국|고기|메인|건더기|토핑|소스)(이|가|을|를|도)?\s?(너무\s?)?(적|부족|모자|조금)/,
      '적게 주',
      '적게 담',
      '조금 줘',
      '조금 주',
    ],
  },
  {
    type: '직원 응대',
    keywords: ['응대', '직원', '불친절', '친절', '태도', '반말', '퉁명', '무시', '짜증', '조리원', '여사님'],
  },
]

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesKeyword(normalized: string, keyword: AliasKeyword) {
  if (keyword instanceof RegExp) return keyword.test(normalized)
  const lower = keyword.toLowerCase()
  return normalized.includes(lower) || normalized.replace(/\s+/g, '').includes(lower.replace(/\s+/g, ''))
}

function findAlias(value: string) {
  const normalized = normalizeText(value)
  if (!normalized) return undefined
  return REPORT_TEMPLATE_ALIASES.find((entry) => entry.keywords.some((keyword) => matchesKeyword(normalized, keyword)))
}

export function detectReportCategory(value: string): ReportCategory {
  return findAlias(value)?.type ?? '기타'
}

export interface CategoryDetection {
  /** 우선순위가 가장 높은 판정 결과 */
  category: ReportCategory
  /** 판정에 쓰인 단어(사용자 입력에서 실제로 찾은 부분) */
  evidence: string[]
  /** 함께 걸린 다른 유형(사용자가 바꿀 수 있게 보여 줍니다) */
  alternatives: ReportCategory[]
}

/** '^(?!…)(?=…).*핵심' 꼴 정규식에서 앞쪽 조건을 떼고 핵심 부분만 남깁니다(판정 근거 표시용). */
function coreOf(source: string) {
  let rest = source.startsWith('^') ? source.slice(1) : source
  while (rest.startsWith('(?=') || rest.startsWith('(?!')) {
    let depth = 0
    let i = 0
    for (; i < rest.length; i += 1) {
      if (rest[i] === '\\') {
        i += 1
        continue
      }
      if (rest[i] === '(') depth += 1
      if (rest[i] === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }
    rest = rest.slice(i + 1)
  }
  return rest.startsWith('.*') ? rest.slice(2) : null
}

function evidenceOf(normalized: string, keyword: AliasKeyword) {
  if (!(keyword instanceof RegExp)) return keyword
  const core = coreOf(keyword.source)
  const pattern = core ? new RegExp(core) : keyword
  return normalized.match(pattern)?.[0]?.trim() ?? ''
}

/** 판정 근거와 함께 걸린 다른 유형까지 돌려줍니다. 배열 순서가 우선순위입니다. */
export function detectReportCategoryDetailed(value: string): CategoryDetection {
  const normalized = normalizeText(value)
  const hits = normalized
    ? REPORT_TEMPLATE_ALIASES.map((entry) => ({
        type: entry.type,
        evidence: entry.keywords.filter((keyword) => matchesKeyword(normalized, keyword)).map((keyword) => evidenceOf(normalized, keyword)),
      })).filter((hit) => hit.evidence.length > 0)
    : []
  if (hits.length === 0) return { category: '기타', evidence: [], alternatives: [] }
  return {
    category: hits[0].type,
    evidence: [...new Set(hits[0].evidence.filter(Boolean))].slice(0, 3),
    alternatives: hits.slice(1).map((hit) => hit.type),
  }
}
