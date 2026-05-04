import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sessionReportSchema, type SessionReportData } from '@/shared/schemas/planner'
import { useTimerStore } from '@/entities/timer'
import { usePlannerStore } from '@/entities/planner'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'
import type { StudySession } from '@/shared/types'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

interface SessionReportModalProps {
  onClose: () => void
}

export function SessionReportModal({ onClose }: SessionReportModalProps) {
  const { elapsedSeconds, checkpoints, subject, reset } = useTimerStore()
  const { addSession } = usePlannerStore()

  const defaultReport = checkpoints
    .map((c) => `[${formatElapsed(c.elapsedSeconds)}] ${c.text}`)
    .join('\n')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionReportData>({
    resolver: zodResolver(sessionReportSchema),
    defaultValues: { report: defaultReport },
  })

  const onSubmit = async (data: SessionReportData) => {
    if (!subject) return
    try {
      const response = await api.post<StudySession>('/planner/sessions', {
        subject,
        durationSeconds: elapsedSeconds,
        checkpoints,
        report: data.report,
        completedAt: new Date().toISOString(),
      })
      addSession(response.data)
      showToast('success', `Сессия сохранена! (${formatElapsed(elapsedSeconds)})`)
      reset()
    } catch {
      showToast('error', 'Не удалось сохранить сессию')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Отчёт о сессии</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Продолжительность: <strong>{formatElapsed(elapsedSeconds)}</strong>
          {subject && <> · Предмет: <strong>{SUBJECT_LABELS[subject]}</strong></>}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Что сделал за эту сессию?
            </label>
            <textarea
              {...register('report')}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Опишите что было сделано..."
            />
            {errors.report && <p className="mt-1 text-xs text-red-500">{errors.report.message}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить сессию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  physics: 'Физика',
  informatics: 'Информатика',
  chemistry: 'Химия',
  biology: 'Биология',
}
