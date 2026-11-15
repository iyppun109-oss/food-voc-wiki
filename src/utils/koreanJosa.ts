interface EndingInfo {
  hasBatchim: boolean
  isRieul: boolean
}

/** 숫자는 읽는 소리로 받침을 정합니다: 0영 1일 3삼 6육 7칠 8팔은 받침, 1·7·8은 ㄹ */
const digitEnding: Record<string, EndingInfo> = {
  '0': { hasBatchim: true, isRieul: false },
  '1': { hasBatchim: true, isRieul: true },
  '2': { hasBatchim: false, isRieul: false },
  '3': { hasBatchim: true, isRieul: false },
  '4': { hasBatchim: false, isRieul: false },
  '5': { hasBatchim: false, isRieul: false },
  '6': { hasBatchim: true, isRieul: false },
  '7': { hasBatchim: true, isRieul: true },
  '8': { hasBatchim: true, isRieul: true },
  '9': { hasBatchim: false, isRieul: false },
}

function lastEndingInfo(word: string): EndingInfo | null {
  const trimmed = word.trim().replace(/[)\]」』"'\s.,!?]+$/, '')
  if (!trimmed) return null
  const last = trimmed[trimmed.length - 1]
  const ch = last.charCodeAt(0)
  if (ch >= 0xac00 && ch <= 0xd7a3) {
    const jong = (ch - 0xac00) % 28
    return { hasBatchim: jong !== 0, isRieul: jong === 8 }
  }
  if (digitEnding[last]) return digitEnding[last]
  // 영문은 끝소리가 받침처럼 들리는 경우만 처리: ...l(ㄹ), ...m, ...n, ...ng
  const lower = trimmed.toLowerCase()
  if (/[a-z]$/.test(lower)) {
    if (lower.endsWith('l')) return { hasBatchim: true, isRieul: true }
    if (/(m|n|ng)$/.test(lower)) return { hasBatchim: true, isRieul: false }
    if (/(ck|k|p|t|b|d|g)$/.test(lower)) return { hasBatchim: true, isRieul: false }
    return { hasBatchim: false, isRieul: false }
  }
  return null
}

/**
 * 단어의 마지막 소리 받침에 맞춰 조사를 붙입니다.
 * pair 예: '이/가', '을/를', '은/는', '과/와', '으로/로', '이었/였'
 * 한글·숫자·영문으로 끝나지 않으면 '을(를)'처럼 병기합니다.
 */
export function attachJosa(word: string, pair: string) {
  const [withBatchim, withoutBatchim] = pair.split('/')
  const info = lastEndingInfo(word)
  if (!info) {
    return pair === '으로/로' ? `${word}(으)로` : `${word}${withBatchim}(${withoutBatchim})`
  }
  if (pair === '으로/로') {
    return `${word}${info.hasBatchim && !info.isRieul ? '으로' : '로'}`
  }
  return `${word}${info.hasBatchim ? withBatchim : withoutBatchim}`
}

/**
 * 목록을 한국어로 잇습니다.
 * 2개: 'A와 B', 3개 이상: 'A, B 및 C'(공식 문체) / 'A, B, C'(간결)
 */
export function joinKorean(items: string[], style: 'formal' | 'plain' = 'formal') {
  const list = items.filter(Boolean)
  if (list.length <= 1) return list[0] ?? ''
  if (list.length === 2) return `${attachJosa(list[0], '과/와')} ${list[1]}`
  if (style === 'plain') return list.join(', ')
  return `${list.slice(0, -1).join(', ')} 및 ${list[list.length - 1]}`
}
