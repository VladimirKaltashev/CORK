import { z } from 'zod'

export const challengeSchema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  description: z.string().max(1000, 'Максимум 1000 символов'),
  category: z.enum(['olympiad', 'academic', 'it', 'creative', 'sport', 'movies', 'games', 'other']).nullable(),
  goalType: z.enum(['distance', 'count', 'hours', 'boolean']),
  unit: z.string().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
  proofConfig: z.object({
    fields: z.array(z.enum(['photo', 'url', 'text', 'value'])),
    valueLabel: z.string().optional(),
    valueRequired: z.boolean().optional(),
  }),
})

export type ChallengeFormData = z.infer<typeof challengeSchema>

export const challengeSubmissionSchema = z.object({
  proofType: z.enum(['photo', 'url', 'text']),
  proofValue: z.string().max(500, 'Максимум 500 символов'),
  value: z.number().optional(),
  description: z.string().max(500, 'Максимум 500 символов'),
})

export type ChallengeSubmissionFormData = z.infer<typeof challengeSubmissionSchema>
