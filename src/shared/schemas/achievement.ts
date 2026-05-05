import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const achievementSchema = z.object({
  category: z.enum(['olympiad', 'academic', 'it', 'creative', 'sport', 'movies', 'games', 'other']),
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  description: z.string().min(1, 'Обязательное поле').max(500, 'Максимум 500 символов'),
  year: z.coerce
    .number()
    .int()
    .min(2000, 'Год не раньше 2000')
    .max(currentYear, `Год не позже ${currentYear}`),
  proofType: z.enum(['photo', 'url', 'none']),
  proofValue: z.string().optional(),
})

export type AchievementFormData = z.infer<typeof achievementSchema>
