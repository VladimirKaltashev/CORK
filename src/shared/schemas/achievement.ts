import { z } from 'zod'

export const achievementSchema = z.object({
  category: z.enum(['education', 'sport', 'it', 'creative', 'life']),
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  description: z.string().min(1, 'Обязательное поле').max(500, 'Максимум 500 символов'),
  date: z.string().min(1, 'Выберите дату'),
  proofUrl: z.string().optional(),
})

export type AchievementFormData = z.infer<typeof achievementSchema>
