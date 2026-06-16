import { describe, expect, it } from 'vitest'
import { challengeProposalSchema, challengeEntrySchema } from './challenge'

const validProposal = {
  title: 'Лучший мем месяца',
  description: 'Кто найдёт самый смешной мем по теме — победил',
}

const validEntry = {
  title: 'Мой мем',
  description: 'Этот мем просто огонь',
  claimId: '00000000-0000-4000-8000-000000000001',
}

describe('challengeProposalSchema', () => {
  it('принимает валидное предложение', () => {
    expect(challengeProposalSchema.safeParse(validProposal).success).toBe(true)
  })

  it('отклоняет пустой title', () => {
    expect(challengeProposalSchema.safeParse({ ...validProposal, title: '' }).success).toBe(false)
  })

  it('отклоняет title > 100 символов', () => {
    expect(challengeProposalSchema.safeParse({ ...validProposal, title: 'a'.repeat(101) }).success).toBe(false)
  })

  it('отклоняет пустой description', () => {
    expect(challengeProposalSchema.safeParse({ ...validProposal, description: '' }).success).toBe(false)
  })

  it('отклоняет description > 1000 символов', () => {
    expect(challengeProposalSchema.safeParse({ ...validProposal, description: 'b'.repeat(1001) }).success).toBe(false)
  })
})

describe('challengeEntrySchema', () => {
  it('принимает валидную запись', () => {
    expect(challengeEntrySchema.safeParse(validEntry).success).toBe(true)
  })

  it('принимает entry без description', () => {
    const { claimId, title } = validEntry
    expect(challengeEntrySchema.safeParse({ title, claimId }).success).toBe(true)
  })

  it('отклоняет пустой title', () => {
    expect(challengeEntrySchema.safeParse({ ...validEntry, title: '' }).success).toBe(false)
  })

  it('отклоняет некорректный claimId', () => {
    expect(challengeEntrySchema.safeParse({ ...validEntry, claimId: 'not-a-uuid' }).success).toBe(false)
  })
})
