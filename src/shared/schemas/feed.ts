import { z } from 'zod'

export const createSessionSchema = z.object({
  title: z.string().min(2, 'Минимум 2 символа'),
  subject: z.string().min(2, 'Минимум 2 символа'),
  date: z.string().min(1, 'Выберите дату'),
  hours: z.number().min(0.5, 'Минимум 0.5 часа').max(24, 'Максимум 24 часа'),
  olympiadId: z.string().optional(),
})

export const createAchievementSchema = z.object({
  title: z.string().min(2, 'Минимум 2 символа'),
  description: z.string().min(10, 'Минимум 10 символов'),
  place: z.number().int().min(1, 'Минимум 1').max(100, 'Максимум 100'),
  olympiadName: z.string().min(2, 'Минимум 2 символа'),
})

export const createPostSchema = z.object({
  content: z.string().min(1, 'Напишите что-нибудь').max(500, 'Максимум 500 символов'),
})

export type CreateSessionData = z.infer<typeof createSessionSchema>
export type CreateAchievementData = z.infer<typeof createAchievementSchema>
export type CreatePostData = z.infer<typeof createPostSchema>
