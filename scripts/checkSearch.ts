/**
 * VOC 검색 점검: 자연스러운 문장으로 찾았을 때 맨 위 사례의 유형이 맞는지 봅니다.
 * 실행: npm run search:check
 */
import { vocCases } from '../src/data/vocCases'
import { searchCases, stem } from '../src/utils/vocSearch'

const failures: string[] = []
const fail = (message: string) => failures.push(message)

// [검색어, 맨 위 사례의 유형]
const topCases: Array<[string, string]> = [
  ['밥에서 머리카락이 나왔어요', '머리카락'],
  ['국에서 비닐', '비닐/플라스틱'],
  ['돈가스가 다 떨어졌어요', '품절'],
  ['먹고 나서 배가 아파요', '식중독 의심'],
  ['음식이 너무 짜요', '염도'],
  ['국이 짜요', '염도'],
  ['밥이 너무 적어요', '양 부족'],
  ['양이 적어요', '양 부족'],
  ['직원이 불친절해요', '직원 응대'],
  ['반찬에 벌레', '벌레'],
  ['생선 가시', '뼈/가시'],
  ['애벌레', '벌레'],
  ['오징어뼈', '뼈/가시'],
  ['국이 식었어요', '품질'],
  ['위생', '위생 불만'],
  // 2026-11 2차 검수
  ['이가 깨졌어요', '안전사고'],
  ['김치에서 벌레가 나왔어요', '벌레'],
  ['국물이 미지근해요', '품질'],
  ['반찬이 식어서 나왔어요', '품질'],
]

// 한 글자로 잘려 엉뚱한 사례가 쏟아지면 안 되는 검색어: 결과 수 상한
for (const [query, max] of [['품질', 150], ['불만', 80], ['문의', 40], ['오이', 10]] as Array<[string, number]>) {
  const count = searchCases(vocCases, query).cases.length
  if (count > max) fail(`"${query}": 결과 ${count}건으로 너무 많음(한 글자로 잘림 의심)`)
}
if (searchCases(vocCases, '오이').cases.slice(0, 5).some((entry) => entry.title.includes('오징어'))) fail('"오이" 검색 상위에 오징어 사례')
for (const [query, category] of topCases) {
  const result = searchCases(vocCases, query)
  const top = result.cases[0]
  if (!top) fail(`"${query}": 결과 없음`)
  else if (top.category !== category) fail(`"${query}": 맨 위 [${top.category}] ${top.title} (기대 ${category})`)
}

// 결과가 0건이면 안 되는 검색어(화면의 빠른·인기 검색어 포함)
for (const query of ['짜요', '품절', '양이 적어요', '위생', '머리카락', '애벌레', '비닐', '오징어뼈', '젓가락에 이물질', '온도']) {
  if (searchCases(vocCases, query).cases.length === 0) fail(`"${query}": 결과 0건`)
}

// 조사·어미 떼기
const stems: Array<[string, string]> = [
  ['머리카락이', '머리카락'],
  ['국에', '국'],
  ['이물질', '이물'],
  ['불친절해요', '불친절'],
  ['온도', '온도'],
  ['밥이', '밥'],
  ['품질', '품질'],
  ['불만', '불만'],
  ['오이', '오이'],
  ['국물이', '국물'],
]
for (const [word, expected] of stems) {
  if (stem(word) !== expected) fail(`stem("${word}") = "${stem(word)}" (기대 "${expected}")`)
}

// 유형 필터와 빈 검색어
if (searchCases(vocCases, '').cases.length !== vocCases.length) fail('빈 검색어가 전체 사례를 보여 주지 않음')
if (searchCases(vocCases, '', '염도').cases.some((entry) => entry.category !== '염도')) fail('유형 필터가 적용되지 않음')

if (failures.length > 0) {
  console.error(failures.map((line) => `✗ ${line}`).join('\n'))
  process.exit(1)
}
console.log(`검색 ${topCases.length + 10}개 · 조사 ${stems.length}개 점검\n모두 통과`)
