// 보고서 생성 자동 점검
// 실행: npm run report:check   (--print 를 붙이면 대표 사례 출력)
// 1) 고객 표현 → 유형 판정이 기대와 같은지
// 2) 유형 × 조치 × 반응 × 상세도 × 강도 조합 전체에서 reportQuality 규칙 위반이 없는지
import {
  analyzeReportInput,
  customerReactionOptions,
  doneActionOptions,
  generateReportContents,
  reportCategoryOptions,
  reportDetailLevelOptions,
  responseIntensityOptions,
  type CustomerReaction,
  type OnsiteAction,
  type ReportFormState,
} from '../src/utils/reportGenerator'
import { checkReportQuality } from '../src/utils/reportQuality'
import { attachJosa } from '../src/utils/koreanJosa'

const base: ReportFormState = {
  keyword: '',
  workplace: '한빛전자 본관',
  restaurantManagerName: '김민지',
  clientContactName: '박정호',
  menuName: '제육볶음',
  occurredAt: '2026-11-16T12:20',
  customerInfo: '본관 3층 직원, 중식 이용',
  memo: '',
  customerReactions: [],
  onsiteActions: [],
  responseIntensity: '일반',
  reportDetailLevel: '보통',
  categoryOverride: '',
}

let failures = 0
const fail = (message: string) => {
  failures += 1
  if (failures <= 40) console.log('✗', message)
}

// ── 1. 유형 판정 ──
const detectionCases: Array<[string, string, string?]> = [
  ['머리카락이 나왔어요', '머리카락'],
  ['상추에 애벌레', '벌레'],
  ['김밥에 비닐', '비닐/플라스틱'],
  ['생선 가시가 걸렸어요', '뼈/가시'],
  ['철수세미 조각', '이물 혼입'],
  ['고기가 덜 익었어요', '품질', 'cooking'],
  ['튀김이 안 익은 것 같아요', '품질', 'cooking'],
  ['국이 식었어요', '품질'],
  ['음식이 너무 짜요', '염도'],
  ['국이 싱거워요', '염도'],
  ['돈가스 품절', '품절'],
  ['밥 양이 적어요', '양 부족'],
  ['반찬이 너무 적어요', '양 부족'],
  ['젓가락 부족', '시설·비품'],
  ['수저통이 비어 있음', '시설·비품'],
  ['식당이 너무 더워요', '시설·비품'],
  ['테이블이 더러워요', '위생 불만'],
  ['직원이 불친절', '직원 응대'],
  ['먹고 나서 배탈 설사', '식중독 의심'],
  ['돌 씹고 이가 깨졌어요', '안전사고'],
  ['국물에 데었어요', '안전사고', 'injury'],
  ['바닥이 미끄러워서 넘어짐', '안전사고', 'injury'],
  ['시간이 너무 오래 걸려요', '기타'],
  ['간장 맛이 이상해요', '품질'],
  // 1차 검수에서 틀렸던 표현
  ['돌솥 그릇에 손 데었어요', '안전사고', 'injury'],
  ['고기가 질겨서 목에 안 넘어가요', '품질'],
  ['숟가락이 다 떨어졌어요', '시설·비품'],
  ['국이 차가워요', '품질'],
  ['국에서 머리카락 나옴ㅠ', '머리카락'],
  ['밥이 딱딱함', '품질'],
  ['직원이 머리카락 나온 걸 무시함', '머리카락'],
  ['땅콩 알레르기 반응', '식중독 의심', 'allergy'],
  ['컵라면 품절', '품절'],
  // 2차 검수에서 틀렸던 표현
  ['배탈은 없는데 맛이 이상해요', '품질'],
  ['머리카락은 아니고 실밥 같은 게 나옴', '이물 혼입'],
  ['바닥이 젖어서 넘어질 뻔했어요', '시설·비품'],
  ['뜨거운 국 엎질러서 손 데임', '안전사고', 'injury'],
  ['밥에서 돌 나옴', '이물 혼입'],
  ['직원 손톱이 길어요', '위생 불만'],
  ['밥이 설었어요', '품질'],
  ['김치가 너무 셔요', '품질'],
  ['자리가 없어요', '시설·비품'],
  // 3차 검수에서 틀렸던 표현
  ['배가 아파요', '식중독 의심'],
  ['먹고 나서 배가 아팠어요', '식중독 의심'],
  ['토했어요', '식중독 의심'],
  ['속이 안 좋아요', '식중독 의심'],
  ['손가락 베었어요', '안전사고', 'injury'],
  ['배탈 난 건 아닌데 속이 메스꺼워요', '식중독 의심'],
  // 4차 검수: 구어 화풀이는 고위험이 아님
  ['줄이 길어서 열나네요', '기타'],
  ['열나게 기다렸는데 품절', '품절'],
  ['직원 태도에 속이 뒤집혀요', '직원 응대'],
  ['국이 너무 짜서 속이 불편해요', '염도'],
  ['점심 먹고 속이 불편해요', '식중독 의심'],
  ['어제 저녁 먹고 열이 나요', '식중독 의심'],
  ['밥 먹고 배부른데 양은 적어요', '양 부족'],
  ['국 먹고 속이 쓰려요', '식중독 의심'],
  // 2026-11 검수: 위험한 이물·기한 지난 음식
  ['국에 철사', '이물 혼입'],
  ['유리 조각이 나왔어요', '이물 혼입'],
  ['스테이플러 심이 들어있어요', '이물 혼입'],
  ['고무줄이 들어있음', '이물 혼입'],
  ['볼트가 나옴', '이물 혼입'],
  ['밥에 돌', '이물 혼입'],
  ['손톱이 나왔어요', '이물 혼입'],
  ['돌솥비빔밥이 짜요', '염도'],
  ['유통기한 지난 요구르트', '품질'],
  ['빵에 곰팡이 핀 것 같아요', '품질'],
  ['반찬이 너무 매워요', '품질'],
  ['나사 같은 게 씹힘', '이물 혼입'],
  ['머리끈이 나왔어요', '이물 혼입'],
  ['음식이 시큼해요', '품질'],
  ['유리문 손잡이가 끈적해요', '위생 불만'],
  ['화장실 벽에 곰팡이가 있어요', '위생 불만'],
  ['빵에 곰팡이가 있는지 확인해 주세요', '품질'],
  ['식판에 곰팡이', '위생 불만'],
  ['컵에 곰팡이가 있어요', '위생 불만'],
  ['수건에서 쉰내가 나요', '위생 불만'],
  ['쉰 김치가 나왔어요', '품질'],
  ['직원이 쉰 목소리로 불친절하게 대답함', '직원 응대'],
  ['그릇에서 비린내가 나요', '위생 불만'],
  ['생선이 비린내가 심해요', '품질'],
]

// 묻기만 한 경우는 증상·불편·사과를 쓰지 않음
for (const [keyword, flag] of [['어제 먹은 거 알레르기 성분 문의', 'isAllergyInquiry'], ['어제 먹은 반찬 원산지 문의', 'isGeneralInquiry']] as const) {
  const form = { ...base, keyword }
  const analysis = analyzeReportInput(form, null)
  if (!analysis[flag]) fail(`문의 갈래로 판정되지 않음: "${keyword}"`)
  if (analysis.isHighRisk) fail(`문의가 중대로 판정됨: "${keyword}"`)
  const report = generateReportContents(form, null)
  const all = [report.customerMessage, report.internalReport, report.clientReport].join('\n')
  if (/증상이 나타나|증상이 있다는|번거로우셨|불편을 드려/.test(all)) fail(`문의인데 증상·불편 문구가 들어감: "${keyword}"`)
}
// 알레르기 반응은 어떤 말로 와도 중대(식사 후 이상 증상)
for (const keyword of [
  '알레르기 성분 문의했는데 두드러기가 났어요',
  '알레르기 반응이 있었는데 원인 알려 주세요',
  '땅콩 먹고 목이 부었어요',
  '먹고 나서 입술이 부었어요',
  '먹고 나서 가려워요',
  '알레르기 표시가 없어서 먹었는데 입술이 부었어요',
  '새우튀김 먹고 숨쉬기 힘들어요',
  '점심 먹고 얼굴이 빨개졌어요',
]) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (analysis.category !== '식중독 의심' || !analysis.isAllergy || !analysis.isHighRisk || analysis.isAllergyInquiry || analysis.isAllergyLabelComplaint) {
    fail(`알레르기 반응이 중대로 판정되지 않음: "${keyword}" → ${analysis.label}`)
  }
}
// 안전망(양방향 20개): 먹은 뒤 몸 증상·의료 표현은 중대, 먹기 전·음식 맛·시설 표현은 중대 아님
for (const keyword of [
  '먹고 나서 의식을 잃었어요',
  '먹은 뒤 응급실 갔어요',
  '먹은 후 쌕쌕거려요',
  '식사 후 기침이 계속 나요',
  '새우 먹고 목이 간질간질해요',
  '점심 먹고 가슴이 두근거려요',
  '먹다가 쓰러졌어요',
  '어제 먹은 뒤 병원 진료 받았어요',
  '식사 후 손이 저려요',
  '먹고 나서 식은땀이 나요',
]) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (!analysis.isHighRisk) fail(`안전망 누락: "${keyword}" → ${analysis.label}`)
}
for (const keyword of [
  '밥 먹으러 왔는데 몸이 안 좋아서 일찍 갔어요',
  '먹었는데 맛이 이상해요',
  '줄이 길어서 숨이 막혀요',
  '더워서 숨 막혀요',
  '시끄러워서 어지러워요',
  '먹고 싶은 메뉴가 없어요',
  '에어컨 바람이 차가워요',
  '식판이 차가워요',
  '반찬 추가해 주세요',
  '숨은 메뉴 있나요',
  '병원 직원 식당인데 국이 짜요',
  '직원들 위생 의식이 부족해 보여요',
]) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (analysis.isHighRisk) fail(`안전망 과판정: "${keyword}" → ${analysis.label}`)
  if (analysis.category === '품질' && /(바람|식판)/.test(keyword)) fail(`시설·식기를 음식 품질로 판정: "${keyword}"`)
}
for (const keyword of ['반찬 추가해 주세요', '숨은 메뉴 있나요']) {
  const report = generateReportContents({ ...base, keyword }, null)
  if (/번거로우셨|불편을 드려/.test(report.customerMessage)) fail(`요청·문의에 불편 사과: "${keyword}"`)
}

// 먹은 뒤 이상하다는 말은 알레르기가 아니어도 중대
if (!analyzeReportInput({ keyword: '계란 들어간 줄 몰랐는데 먹고 나서 이상해요', memo: '', categoryOverride: '' }, null).isHighRisk) fail('먹고 나서 이상해요 → 중대 아님')

// 거짓 양성: 음식·증상과 무관한 붓다·가리다·반응·있었·숨·차갑다는 중대로 올리지 않음
for (const [keyword, notCategory] of [
  ['국을 부어 주는데 양이 너무 적어요', '식중독 의심'],
  ['편식이라 가려 먹는데 반찬이 단조로워요', '식중독 의심'],
  ['직원 반응이 너무 차가워요', '품질'],
  ['숨은 메뉴가 있나요', '식중독 의심'],
  ['눈이 부어서 왔는데 조명이 너무 밝아요', '식중독 의심'],
  ['알레르기 표시가 있었는데 글씨가 작아요', ''],
  ['알레르기 표시가 잘못되어 있었어요', ''],
  ['알레르기 정보 메뉴판에 추가해 주세요', ''],
  ['라면이 불었어요', '식중독 의심'],
] as const) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (notCategory && analysis.category === notCategory) fail(`거짓 양성: "${keyword}" → ${analysis.category}`)
  if (analysis.isHighRisk) fail(`거짓 양성(중대): "${keyword}" → ${analysis.label}`)
}
if (analyzeReportInput({ keyword: '직원 반응이 너무 차가워요', memo: '', categoryOverride: '' }, null).category !== '직원 응대') fail('"직원 반응이 차가워요" → 직원 응대 아님')

// 증상이 없으면 증상을 쓰지 않음
for (const [keyword, flag] of [
  ['알레르기 표시가 없어요', 'isAllergyLabelComplaint'],
  ['알레르기 때문에 못 먹었어요', 'isAllergyLabelComplaint'],
  ['알레르기 표시가 있었는데 글씨가 작아요', 'isAllergyLabelComplaint'],
  ['알레르기 정보 메뉴판에 추가해 주세요', 'isAllergyInquiry'],
  ['땅콩 들어갔는지 궁금해요', 'isAllergyInquiry'],
  ['새우 알레르기 있는데 오늘 국에 들어갔나요?', 'isAllergyInquiry'],
] as const) {
  const form = { ...base, keyword }
  const analysis = analyzeReportInput(form, null)
  if (!analysis[flag]) fail(`알레르기 갈래 판정 오류: "${keyword}" → ${analysis.label}`)
  const report = generateReportContents(form, null)
  if (/증상이 나타나|증상이 있다는/.test([report.customerMessage, report.internalReport, report.clientReport].join('\n'))) fail(`증상 없는데 증상 문구: "${keyword}"`)
}

// 겪은 일을 말하면 '확인해 주세요'로 끝나도 변질 제보(중대)
for (const keyword of ['유통기한 지난 우유 마셨는데 확인 부탁', '곰팡이 핀 빵 확인해 주세요', '상한 것 같은데 확인 요청', '어제 먹은 김밥이 쉰 것 같은데 알려 주세요']) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (!analysis.isSpoiled || !analysis.isHighRisk || analysis.isStorageInquiry) fail(`변질 제보가 문의로 낮아짐: "${keyword}"`)
}

// 문의는 불만·변질로 단정하지 않음
for (const keyword of ['유통기한 확인 요청드려요', '우유가 상했는지 확인해 주세요', '빵에 곰팡이가 있는지 확인해 주세요']) {
  const form = { ...base, keyword, menuName: '우유' }
  const analysis = analyzeReportInput(form, null)
  if (!analysis.isStorageInquiry) fail(`문의 갈래로 판정되지 않음: "${keyword}"`)
  const report = generateReportContents(form, null)
  const all = [report.customerMessage, report.internalReport, report.clientReport].join('\n')
  if (/기대에 미치지|좋지 않다는|상태가 좋지 않아/.test(all)) fail(`문의인데 불만 문구가 들어감: "${keyword}"`)
}

// 위험한 이물·상한 음식은 중대 기준
for (const keyword of ['국에 철사', '유리 조각이 나왔어요', '유통기한 지난 요구르트']) {
  if (!analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null).isHighRisk) fail(`고위험 판정 누락: "${keyword}"`)
}
// 위험하지 않은 유리·문의는 중대로 올리지 않음
if (analyzeReportInput({ keyword: '유리 창문이 더러워요', memo: '', categoryOverride: '' }, null).category === '이물 혼입') fail('판정: "유리 창문" → 이물 혼입')
for (const keyword of ['밥에 돌', '머리카락이 나왔어요', '유통기한 확인 요청드려요']) {
  if (analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null).isHighRisk) fail(`고위험 과판정: "${keyword}"`)
}
for (const [keyword, expected, sub] of detectionCases) {
  const analysis = analyzeReportInput({ keyword, memo: '', categoryOverride: '' }, null)
  if (analysis.category !== expected) fail(`판정: "${keyword}" → ${analysis.category} (기대 ${expected})`)
  if (sub === 'cooking' && !analysis.isCookingQuality) fail(`판정: "${keyword}" 조리 상태 갈래로 잡히지 않음`)
  if (sub === 'injury' && !analysis.isInjury) fail(`판정: "${keyword}" 부상 갈래로 잡히지 않음`)
  if (sub === 'allergy' && !analysis.isAllergy) fail(`판정: "${keyword}" 알레르기 갈래로 잡히지 않음`)
}

// 메모의 부정문은 판정에 쓰지 않음
{
  const analysis = analyzeReportInput(
    { keyword: '국이 너무 짜요', memo: '고객 치아 이상 없다고 함. 직원이 머리카락 등 이물 여부도 확인했으나 없음.', categoryOverride: '' },
    null,
  )
  if (analysis.category !== '염도') fail(`판정: 메모 부정문이 판정을 바꿈 → ${analysis.category}`)
  const complaint = analyzeReportInput({ keyword: '머리카락 나왔는데 직원이 사과도 없음', memo: '', categoryOverride: '' }, null)
  if (complaint.category !== '머리카락' || !complaint.alternatives.includes('직원 응대')) fail('판정: 응대 불만 구절이 부정어 때문에 지워짐')
  const negEvidence = analyzeReportInput({ keyword: '배탈 난 건 아닌데 속이 메스꺼워요', memo: '', categoryOverride: '' }, null)
  if (negEvidence.evidence.includes('배탈')) fail('판정 근거에 부정된 단어가 나옴')
  const shortEvidence = analyzeReportInput({ keyword: '어제 저녁 먹고 나서 열이 나요', memo: '', categoryOverride: '' }, null)
  if (shortEvidence.evidence.some((word) => word.length > 8)) fail(`판정 근거가 길게 표시됨: ${shortEvidence.evidence.join(', ')}`)
  const memoOnly = analyzeReportInput({ keyword: '불편해요', memo: '배식 후 상추에서 애벌레 확인', categoryOverride: '' }, null)
  if (memoOnly.category !== '벌레' || !memoOnly.evidenceFromMemo) fail('판정: 고객 말씀으로 판정 안 될 때 메모 보조 판정이 동작하지 않음')
}

// ── 2. 조사 ──
const josaCases: Array<[string, string, string]> = [
  ['제육볶음', '을/를', '제육볶음을'],
  ['돈가스', '이/가', '돈가스가'],
  ['스테이크', '은/는', '스테이크는'],
  ['A코스', '이/가', 'A코스가'],
  ['세트3', '을/를', '세트3을'],
  ['세트2', '을/를', '세트2를'],
  ['샐러드 bowl', '이/가', '샐러드 bowl이'],
  ['김밥', '으로/로', '김밥으로'],
  ['떡볶이', '으로/로', '떡볶이로'],
  ['불고기 덮밥', '과/와', '불고기 덮밥과'],
]
for (const [word, pair, expected] of josaCases) {
  const got = attachJosa(word, pair)
  if (got !== expected) fail(`조사: ${word}+${pair} → ${got} (기대 ${expected})`)
}

// ── 3. 조합 점검 ──
const keywordFor: Record<string, string> = {
  머리카락: '머리카락',
  벌레: '애벌레',
  '비닐/플라스틱': '비닐 조각',
  '뼈/가시': '생선 가시',
  '이물 혼입': '이물',
  품질: '맛이 이상해요',
  염도: '너무 짜요',
  품절: '품절',
  '양 부족': '양이 적어요',
  '위생 불만': '테이블이 더러워요',
  '직원 응대': '직원이 불친절',
  '시설·비품': '젓가락 부족',
  '식중독 의심': '배탈 설사',
  안전사고: '돌 씹고 이가 깨짐',
  기타: '대기 줄이 길어요',
}
const extraKeywords = ['고기가 덜 익었어요', '국물에 데었어요', '유통기한 지난 우유', '국에서 유리 조각이 나왔어요']

function subsets<T>(items: T[]): T[][] {
  return items.reduce<T[][]>((acc, item) => acc.concat(acc.map((set) => [...set, item])), [[]])
}

const actionSets = subsets(doneActionOptions).filter((set) => set.length <= 3)
const reactionSets: CustomerReaction[][] = [[], ...customerReactionOptions.map((r) => [r]), ['불쾌감 표현', '연락처 남김', '보상 요청']]
let combos = 0
const keywords = [...reportCategoryOptions.map((category) => keywordFor[category]), ...extraKeywords]

for (const keyword of keywords) {
  for (const actions of actionSets) {
    for (const checking of [false, true]) {
      for (const reactions of reactionSets) {
        for (const detail of reportDetailLevelOptions) {
          for (const intensity of responseIntensityOptions) {
            for (const menuName of ['제육볶음', '']) {
              if (menuName === '' && (detail !== '보통' || intensity !== '일반')) continue
              const onsiteActions: OnsiteAction[] = checking ? [...actions, '현장 확인 중'] : [...actions]
              const form: ReportFormState = { ...base, keyword, menuName, onsiteActions, customerReactions: reactions, reportDetailLevel: detail, responseIntensity: intensity }
              const analysis = analyzeReportInput(form, null)
              const report = generateReportContents(form, null)
              combos += 1
              for (const issue of checkReportQuality(form, analysis, report)) {
                if (issue.level === 'error' || issue.level === 'warn') {
                  fail(`[${keyword} | ${actions.join('+') || '조치없음'}${checking ? '+확인중' : ''} | ${reactions.join('+') || '반응없음'} | ${detail}/${intensity}${menuName ? '' : ' | 메뉴없음'}] ${issue.message}`)
                }
              }
            }
          }
        }
      }
    }
  }
}

// ── 4. 점검 규칙이 실제로 잘못을 잡는지(일부러 틀린 문장 넣기) ──
{
  const form: ReportFormState = { ...base, keyword: '머리카락', onsiteActions: ['고객 응대'] }
  const analysis = analyzeReportInput(form, null)
  const good = generateReportContents(form, null)
  const mutations: Array<[string, Partial<typeof good>]> = [
    ['체크 안 한 교체를 완료형으로', { customerMessage: `${good.customerMessage}\n\n불편을 드린 음식은 교체해 드렸습니다.` }],
    ['체크 안 한 회수를 완료형으로', { internalReport: good.internalReport.replace('- 고객 응대 완료함.', '- 고객 응대 완료함.\n- 해당 메뉴 회수 완료함.') }],
    ['체크 안 한 보상 언급', { clientReport: `${good.clientReport}\n\n보상 관련 사항은 협의드리겠습니다.` }],
    ['사내용에 합니다체', { internalReport: good.internalReport.replace('- 고객 응대 완료함.', '- 고객 응대를 마쳤습니다.') }],
    ['고객용에 음슴체', { customerMessage: `${good.customerMessage}\n\n재발 방지 교육 예정임.` }],
    ['다른 유형 설명 섞임', { customerMessage: good.customerMessage.replace('머리카락이 발견되어', '제공량이 충분하지 않아') }],
    ['위험 표현', { customerMessage: `${good.customerMessage}\n\n저희 잘못입니다.` }],
    ['자리표시 남음', { clientReport: `${good.clientReport} {m}` }],
    ['바꿔 드렸다는 표현', { customerMessage: `${good.customerMessage}

다른 메뉴로 바꿔 드렸습니다.` }],
    ['새로 준비해 드렸다는 표현', { customerMessage: `${good.customerMessage}

음식을 새로 준비해 드렸습니다.` }],
    ['치료비 부담', { customerMessage: `${good.customerMessage}

치료비는 저희가 부담하겠습니다.` }],
    ['전량 수거함', { internalReport: good.internalReport.replace('- 고객 응대 완료함.', '- 고객 응대 완료함.\n- 잔여 음식 전량 수거함.') }],
    ['촬영해 둠', { internalReport: good.internalReport.replace('- 고객 응대 완료함.', '- 고객 응대 완료함.\n- 현물 촬영해 둠.') }],
    ['유선 보고함', { internalReport: good.internalReport.replace('- 고객 응대 완료함.', '- 고객 응대 완료함.\n- 고객사 담당자에게 유선 보고함.') }],
    ['원인 단정', { clientReport: `${good.clientReport}

위생모 미착용이 원인으로 확인되었습니다.` }],
  ]
  for (const [name, patch] of mutations) {
    const issues = checkReportQuality(form, analysis, { ...good, ...patch }).filter((issue) => issue.level !== 'info')
    if (issues.length === 0) fail(`점검 누락: '${name}'을(를) 잡지 못함`)
  }
}

// 유형을 '기타'로 바꿔도 사용자 원문 때문에 오탐하지 않는지
{
  const form: ReportFormState = { ...base, keyword: '줄이 넘 길어요ㅠㅠ 머리카락도', categoryOverride: '기타' }
  const issues = checkReportQuality(form, analyzeReportInput(form, null), generateReportContents(form, null)).filter((issue) => issue.level === 'error')
  if (issues.length > 0) fail(`오탐: 기타로 바꾼 건에서 ${issues[0].message}`)
  const report = generateReportContents(form, null)
  if (/ㅠ/.test(report.customerMessage + report.internalReport) || report.customerMessage.includes('줄이 넘')) fail('고객 원문이 고객용에 인용되거나 구어 표지가 남음')
}

// 사용자가 유형을 직접 고르면 그 유형을 따르는지
for (const category of reportCategoryOptions) {
  const analysis = analyzeReportInput({ keyword: '머리카락', memo: '', categoryOverride: category }, null)
  if (analysis.category !== category) fail(`직접 고른 유형 ${category}가 적용되지 않음`)
}

console.log(`\n조합 ${combos.toLocaleString('ko-KR')}개 · 판정 ${detectionCases.length}개 · 조사 ${josaCases.length}개 점검`)
if (failures > 0) {
  console.log(`실패 ${failures}건`)
  process.exit(1)
}
console.log('모두 통과')

if (process.argv.includes('--print')) {
  const samples: Array<Partial<ReportFormState>> = [
    { keyword: '머리카락', onsiteActions: ['고객 응대', '음식 교체'], customerReactions: ['불쾌감 표현'] },
    { keyword: '젓가락 부족', menuName: '', onsiteActions: ['현장 확인 중'], memo: '12시 10분경 수저통이 비어 있었음' },
    { keyword: '돌 씹고 이가 깨짐', menuName: '잡곡밥', responseIntensity: '중대', reportDetailLevel: '자세히', onsiteActions: ['고객 응대', '메뉴 회수', '사진 기록'], customerReactions: ['보상 요청'] },
    { keyword: '고기가 덜 익었어요', menuName: '돼지불고기', reportDetailLevel: '짧게', onsiteActions: ['음식 교체', '동일 조리분 확인'] },
  ]
  for (const sample of samples) {
    const report = generateReportContents({ ...base, ...sample }, null)
    console.log(`\n==================== ${sample.keyword} ====================`)
    console.log(`--- 고객용 ---\n${report.customerMessage}\n\n--- 사내용 ---\n${report.internalReport}\n\n--- 고객사용 ---\n${report.clientReport}`)
  }
}
