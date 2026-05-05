import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const achievementSchema = z.object({
  category: z.enum(['olympiad', 'academic', 'it', 'creative', 'sport', 'other']),
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  year: z.coerce
    .number()
    .int()
    .min(2000, 'Год не раньше 2000')
    .max(currentYear, `Год не позже ${currentYear}`),
  proofImage: z.string().optional(),
})

export type AchievementFormData = z.infer<typeof achievementSchema>
