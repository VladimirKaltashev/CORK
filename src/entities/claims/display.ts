import type { Claim, ClaimSubjectType, ClaimType } from './types'

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  self_achievement: 'Моё',
  other_achievement: 'Нашёл',
  fail: 'Фейл',
  flex: 'Flex',
  discovery: 'Находка',
  debate: 'Спорно',
  absurd: 'Абсурд',
  organization: 'Орга/проект',
}

const CLAIM_TYPE_EMOJIS: Record<ClaimType, string> = {
  self_achievement: '👤',
  other_achievement: '🔎',
  fail: '💥',
  flex: '⚡',
  discovery: '💎',
  debate: '⚖️',
  absurd: '🌀',
  organization: '🏛️',
}

const SUBJECT_TYPE_LABELS: Record<ClaimSubjectType, string> = {
  self: 'Я',
  person: 'Человек',
  organization: 'Организация',
  project: 'Проект',
  event: 'Событие',
  internet: 'Интернет',
  unknown: 'Неясно',
}

export function claimTypeLabel(type: ClaimType): string {
  return CLAIM_TYPE_LABELS[type]
}

export function claimTypeEmoji(type: ClaimType): string {
  return CLAIM_TYPE_EMOJIS[type]
}

export function subjectTypeLabel(type: ClaimSubjectType): string {
  return SUBJECT_TYPE_LABELS[type]
}

export function shouldShowClaimBadge(claim: Claim): boolean {
  if (claim.type !== 'self_achievement') return true
  if (claim.subjectName?.trim()) return true
  if (claim.thread?.trim()) return true
  return false
}
