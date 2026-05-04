import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  avatar: z.string().nullable().optional(),
  goal: z.string().max(200, 'Максимум 200 символов').optional(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
