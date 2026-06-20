# 단체급식 VOC 대처 백과사전

급식 현장에서 발생하는 **VOC·이물 사고**를 빠르게 검색하고 대응하기 위한 React + Vite 실무 참고 시스템.

## 기능

- **20건** 실무 사례 (11개 카테고리)
- 전체 텍스트 **검색** (사고 내용, 대응 문구, 조치, 보고서 등)
- **카테고리 필터** (이물 혼입, 벌레, 머리카락, 비닐/플라스틱, 오징어뼈, 품절, 염도, 양 부족, 위생 불만, 직원 응대, 식중독 의심)
- 카드 클릭 시 **상세 팝업** (사고 내용, 고객 응대 문구, 현장 조치, 원인 분석, 재발방지 대책, 보고서 예시)
- **모바일 대응** UI

## 실행 방법

```bash
cd food-voc-wiki
npm install
npm run dev
```

## 사례 추가

`src/data/vocCases.ts` 파일의 `vocCases` 배열에 새 객체를 추가합니다.

## 프로젝트 구조

```
src/
  components/   SearchBar, CategoryFilter, EntryCard, EntryModal
  data/         vocCases.ts (사례 데이터)
  App.tsx
```
