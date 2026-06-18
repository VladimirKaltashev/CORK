import { z } from 'zod'

export const challengeProposalSchema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  description: z.string().min(1, 'Обязательное поле').max(1000, 'Максимум 1000 символов'),
})

export const challengeEntrySchema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
  claimId: z.string().uuid('Неверный ID достижения').optional(),
})

export type ChallengeProposalFormData = z.infer<typeof challengeProposalSchema>
export type ChallengeEntryFormData = z.infer<typeof challengeEntrySchema>
