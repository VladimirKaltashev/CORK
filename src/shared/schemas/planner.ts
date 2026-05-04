import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  priority: z.enum(['high', 'medium', 'low']),
  deadline: z.string().min(1, 'Выберите дедлайн'),
  subject: z.string().optional(),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

export const sessionReportSchema = z.object({
  report: z.string().min(1, 'Напишите отчёт о сессии'),
})

export type SessionReportData = z.infer<typeof sessionReportSchema>
