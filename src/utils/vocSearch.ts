import { categories, type VocCase } from '../data/vocCases'

/**
 * VOC 사례 검색
 *
 * - 띄어쓰기를 무시하고 비교합니다('머리 카락' = '머리카락').
 * - 검색어를 단어로 나누고 조사·어미와 군말을 뗀 뒤, 단어마다 같은 뜻 말을 붙입니다.
 * - 드문 단어일수록 무게를 크게 둡니다('머리카락'이 '밥'보다 중요).
 * - 모든 단어가 맞는 사례를 먼저, 없으면 무게 합이 큰 사례를 '일부 일치'로 보여 줍니다.
 */

export function squash(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

/** 같은 뜻으로 찾을 말과, 그 말이 가리키는 사례 유형 */
const searchSynonyms: Array<{ pattern: RegExp; terms: string[]; category?: string }> = [
  { pattern: /짜(?!장|글|파게티|증|임)|짠|짰|짭/, terms: ['염도', '짜다', '짜요', '짜서', '짜게', '짠맛', '짬'], category: '염도' },
  { pattern: /싱겁|싱거/, terms: ['싱겁', '싱거', '염도'], category: '염도' },
  { pattern: /식었|식어|미지근/, terms: ['식었', '식어', '미지근', '차갑'] },
  { pattern: /알러지|알레르기/, terms: ['알레르기', '알러지'] },
  { pattern: /양부족|양이|적어|적게|모자/, terms: ['양 부족', '양이 적', '양이 부족', '적게', '제공량'], category: '양 부족' },
  { pattern: /품절|소진|떨어졌|떨어져|떨어짐|없어서/, terms: ['품절', '소진', '조기 마감'], category: '품절' },
  { pattern: /불친절|응대|태도|반말/, terms: ['직원 응대', '불친절', '응대', '태도'], category: '직원 응대' },
  { pattern: /더러|위생|청결|지저분/, terms: ['위생', '청결', '더러'], category: '위생 불만' },
  { pattern: /배탈|설사|복통|구토|토했|메스꺼/, terms: ['식중독', '배탈', '설사', '복통', '구토'], category: '식중독 의심' },
  { pattern: /머리카락|머리털|털/, terms: ['머리카락', '모발'], category: '머리카락' },
  { pattern: /벌레|애벌레|파리|날파리/, terms: ['벌레', '애벌레'], category: '벌레' },
  { pattern: /비닐|플라스틱|랩/, terms: ['비닐', '플라스틱'], category: '비닐/플라스틱' },
  { pattern: /뼈|가시/, terms: ['뼈', '가시'], category: '뼈/가시' },
  { pattern: /이물|철사|유리|돌멩이|쇳조각/, terms: ['이물'], category: '이물 혼입' },
  { pattern: /다쳤|다침|화상|데었|미끄러|넘어|치아|이빨/, terms: ['안전', '다쳤', '화상', '치아'], category: '안전사고' },
]

/** 검색에서 버릴 군말 */
const fillerWords = new Set([
  '너무', '정말', '진짜', '좀', '많이', '완전', '계속', '자꾸', '다', '또', '왜', '오늘', '어제', '아까', '방금', '그리고',
  '음식', '음식이', '음식에서', '먹고', '먹다가', '먹는데', '먹었는데', '나서', '먹고나서',
  '나왔어요', '나왔다', '나옴', '나와요', '나왔는데', '들어있어요', '들어있음', '있어요', '있음', '있었어요', '있는데',
  '해요', '했어요', '했는데', '같아요', '같은', '같은데', '것', '게', '거', '요',
])

/** 단어 끝 조사·어미를 뗍니다('머리카락이' → '머리카락', '불친절해요' → '불친절', '이물질' → '이물'). */
export function stem(word: string) {
  const base = word.replace(/질$/, '')
  // 조사만 뗀 경우는 한 글자 명사도 살립니다('밥이' → '밥', '국에' → '국').
  const noParticle = base.replace(/(에서|에게|에도|이랑|하고|까지|부터|으로|에|의|로|이|가|은|는|을|를|만)$/, '')
  if (noParticle !== base && noParticle.length >= 1) return noParticle.replace(/질$/, '')
  // '도'는 '온도'처럼 낱말 끝 글자일 수 있어 세 글자 이상일 때만 뗍니다.
  if (base.length >= 3 && base.endsWith('도')) return base.slice(0, -1)
  const stripped = base.replace(/(이에요|예요|였어요|었어요|았어요|했어요|해요|어요|아요|네요|요|함|임|음)$/, '')
  return stripped.length >= 2 ? stripped : base
}

export interface QueryGroup {
  /** 원래 단어 */
  word: string
  /** 이 중 하나라도 있으면 그 단어가 맞은 것으로 봅니다. */
  terms: string[]
  /** 이 단어가 가리키는 사례 유형(있으면 그 유형 사례에 가산) */
  category?: string
}

/** 두 단어로 나뉘는 표현을 한 단어로 바꿉니다('배가 아파요' → '복통'). */
const phraseRules: Array<[RegExp, string]> = [
  [/배\s?(가|이)?\s?(아프|아파|아팠|아픔)\S*/g, '복통'],
  [/속\s?(이)?\s?(안\s?좋|메스꺼|울렁)\S*/g, '배탈'],
  [/다\s?떨어\S*/g, '품절'],
  [/양\s?(이)?\s?(적|부족|모자)\S*/g, '양부족'],
]

export function queryGroups(query: string): QueryGroup[] {
  const normalized = phraseRules.reduce((text, [pattern, replacement]) => text.replace(pattern, ` ${replacement} `), query)
  return normalized
    .trim()
    .split(/\s+/)
    .map((word) => squash(word))
    .filter((word) => word && !fillerWords.has(word) && !fillerWords.has(stem(word)))
    .map((word) => {
      const stemmed = stem(word)
      const terms = new Set([word, stemmed])
      let category: string | undefined
      for (const synonym of searchSynonyms) {
        if (synonym.pattern.test(word)) {
          synonym.terms.forEach((term) => terms.add(squash(term)))
          category ??= synonym.category
        }
      }
      return { word, terms: [...terms].filter(Boolean), category }
    })
}

type Indexed = { entry: VocCase; title: string; body: string }

const indexCache = new WeakMap<VocCase[], Indexed[]>()

function indexOf(cases: VocCase[]) {
  let indexed = indexCache.get(cases)
  if (!indexed) {
    indexed = cases.map((entry) => {
      const categoryLabel = categories.find((c) => c.id === entry.category)?.label ?? ''
      return {
        entry,
        title: squash(entry.title),
        body: squash(
          [entry.title, categoryLabel, entry.incident, entry.customerScript, entry.onsiteAction, entry.rootCause, entry.prevention, entry.reportExample].join(' '),
        ),
      }
    })
    indexCache.set(cases, indexed)
  }
  return indexed
}

export interface SearchResult {
  cases: VocCase[]
  /** 모든 단어가 맞는 사례가 없어 일부만 맞는 사례를 보여 주는 경우 */
  partial: boolean
}

export function searchCases(cases: VocCase[], query: string, categoryFilter = 'all'): SearchResult {
  const indexed = indexOf(cases)
  const scoped = indexed.filter((item) => categoryFilter === 'all' || item.entry.category === categoryFilter)
  const groups = queryGroups(query)
  if (groups.length === 0) return { cases: scoped.map((item) => item.entry), partial: false }

  // 드문 단어일수록 무게를 크게: 전체 사례 중 그 단어가 나오는 비율의 역수(로그)
  const total = indexed.length
  const weights = groups.map((group) => {
    const df = indexed.filter((item) => group.terms.some((term) => item.body.includes(term))).length
    return Math.log((total + 1) / (df + 1)) + 1
  })
  const exact = squash(query)

  const scored = scoped.map((item, index) => {
    let score = 0
    let matched = 0
    groups.forEach((group, groupIndex) => {
      const inBody = group.terms.some((term) => item.body.includes(term))
      const inCategory = group.category !== undefined && item.entry.category === group.category
      if (!inBody && !inCategory) return
      matched += 1
      score += weights[groupIndex]
      if (group.terms.some((term) => item.title.includes(term))) score += weights[groupIndex] * 0.5
      if (inCategory) score += weights[groupIndex] * 0.5
    })
    if (exact && item.title.includes(exact)) score += 5
    else if (exact && item.body.includes(exact)) score += 2
    return { entry: item.entry, index, score, matched }
  })

  const full = scored.filter((item) => item.matched === groups.length)
  const sortByScore = (list: typeof scored) => list.sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.entry)
  if (full.length > 0 || groups.length === 1) return { cases: sortByScore(full), partial: false }

  // 일부 일치: 가장 잘 맞는 사례의 절반 이상 무게를 가진 사례만 보여 줍니다.
  const partial = scored.filter((item) => item.matched > 0)
  const best = Math.max(0, ...partial.map((item) => item.score))
  return { cases: sortByScore(partial.filter((item) => item.score >= best * 0.5)), partial: partial.length > 0 }
}
