function lastHangulInfo(word: string) {
  const trimmed = word.trim().replace(/[)\]」』"'\s]+$/, '')
  const ch = trimmed.charCodeAt(trimmed.length - 1)
  if (Number.isNaN(ch) || ch < 0xac00 || ch > 0xd7a3) return null
  const jong = (ch - 0xac00) % 28
  return { hasBatchim: jong !== 0, isRieul: jong === 8 }
}

/**
 * 단어의 마지막 글자 받침에 맞춰 조사를 붙입니다.
 * pair 예: '이/가', '을/를', '은/는', '과/와', '으로/로'
 * 한글로 끝나지 않으면 '을(를)'처럼 병기합니다.
 */
export function attachJosa(word: string, pair: string) {
  const [withBatchim, withoutBatchim] = pair.split('/')
  const info = lastHangulInfo(word)
  if (!info) {
    return pair === '으로/로' ? `${word}(으)로` : `${word}${withBatchim}(${withoutBatchim})`
  }
  if (pair === '으로/로') {
    return `${word}${info.hasBatchim && !info.isRieul ? '으로' : '로'}`
  }
  return `${word}${info.hasBatchim ? withBatchim : withoutBatchim}`
}
