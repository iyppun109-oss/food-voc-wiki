import {
  forbiddenExpressions,
  type ForbiddenExpression,
  type ForbiddenSeverity,
} from '../data/forbiddenExpressions'

export interface ForbiddenMatch {
  keyword: string
  reason: string
  replacement: string
  severity: ForbiddenSeverity
}

interface MatchableExpression extends ForbiddenExpression {
  normalizedKeyword: string
  regex: RegExp
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalize(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
}

function createExpressionMatcher(expression: ForbiddenExpression): MatchableExpression {
  const normalizedKeyword = normalize(expression.keyword)
  const regex = new RegExp(escapeRegExp(expression.keyword.trim()).replace(/\s+/g, '\\s*'), 'g')

  return {
    ...expression,
    normalizedKeyword,
    regex,
  }
}

const matchableExpressions = forbiddenExpressions.map((expression) => createExpressionMatcher(expression))

const dedupeByKeyword = (matches: ForbiddenMatch[]) => {
  const seen = new Set<string>()

  return matches.filter((match) => {
    if (seen.has(match.keyword)) return false
    seen.add(match.keyword)
    return true
  })
}

export function checkForbiddenExpressions(text: string): ForbiddenMatch[] {
  const normalizedText = normalize(text)
  const matches = matchableExpressions
    .filter((item) => normalizedText.includes(item.normalizedKeyword))
    .map((item) => ({
      keyword: item.keyword,
      reason: item.reason,
      replacement: item.replacement,
      severity: item.severity,
    }))

  return dedupeByKeyword(matches)
}

export function applyRecommendedExpressions(text: string) {
  let updated = text
  for (const item of matchableExpressions) {
    if (!updated.match(item.regex)) continue
    updated = updated.replaceAll(item.regex, item.replacement)
  }

  return updated
}

export function hasAnyForbiddenExpression(text: string) {
  return checkForbiddenExpressions(text).length > 0
}
