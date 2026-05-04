import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '@/entities/timer'
import { useStatusStore } from '@/entities/status'
import { useAuthStore } from '@/entities/auth'
import { api } from '@/shared/lib/api'
import { SessionReportModal } from '@/features/planner/SessionReportModal'
import { formatElapsed } from '@/features/planner/TimerWidget'
import { ROUTES } from '@/shared/constants/routes'
import type { Subject } from '@/shared/types'

const SUBJECTS: Subject[] = ['math', 'physics', 'informatics', 'chemistry', 'biology']
const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Математика',
  physics: 'Физика',
  informatics: 'Информатика',
  chemistry: 'Химия',
  biology: 'Биология',
}

export function TimerPage() {
  const navigate = useNavigate()
  const { subject, elapsedSeconds, status, checkpoints, showReportModal, setSubject, start, pause, resume, stop, hideReportModal, addCheckpoint, removeCheckpoint } = useTimerStore()
  const { setStatus } = useStatusStore()
  const { user } = useAuthStore()
  const [cpInput, setCpInput] = useState('')
  const [showCpInput, setShowCpInput] = useState(false)

  const handleStart = () => {
    if (subject) {
      setStatus({ status: 'working', subject })
      start()
    }
  }

  const handleStop = () => {
    stop()
    if (user) {
      api.post('/user/status', { status: 'online' }).catch(() => undefined)
    }
  }

  const handleAddCheckpoint = () => {
    if (cpInput.trim()) {
      addCheckpoint(cpInput.trim())
      setCpInput('')
      setShowCpInput(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center border-b border-gray-200 px-6 py-3 dark:border-gray-700">
        <button
          onClick={() => navigate(ROUTES.PLANNER)}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Назад в планировщик
        </button>
        <h1 className="mx-auto text-lg font-semibold text-gray-900 dark:text-white">Таймер</h1>
        <div className="w-32" />
      </div>

      <div className="flex flex-1 gap-8 p-8">
        {/* Left: Timer controls */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="font-mono text-8xl font-bold tabular-nums text-gray-900 dark:text-white">
            {formatElapsed(elapsedSeconds)}
          </div>

          {status === 'idle' ? (
            <div className="flex flex-col items-center gap-4">
              <select
                value={subject ?? ''}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-48 rounded-xl border border-gray-300 px-4 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Выберите предмет</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
                ))}
              </select>
              <button
                onClick={handleStart}
                disabled={!subject}
                className="rounded-xl bg-indigo-600 px-10 py-3 text-lg font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                ▶ Старт
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {subject && (
                <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {SUBJECT_LABELS[subject]}
                </span>
              )}
              <div className="flex gap-3">
                {status === 'running' ? (
                  <button onClick={pause} className="rounded-xl bg-amber-500 px-6 py-2.5 font-medium text-white hover:bg-amber-600">
                    ⏸ Пауза
                  </button>
                ) : (
                  <button onClick={resume} className="rounded-xl bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700">
                    ▶ Продолжить
                  </button>
                )}
                <button onClick={handleStop} className="rounded-xl bg-red-500 px-6 py-2.5 font-medium text-white hover:bg-red-600">
                  ⏹ Завершить
                </button>
                <button
                  onClick={() => setShowCpInput((v) => !v)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  🚩 Флажок
                </button>
              </div>
              {showCpInput && (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={cpInput}
                    onChange={(e) => setCpInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCheckpoint() }}
                    placeholder="Текст флажка..."
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button onClick={handleAddCheckpoint} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                    ОК
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Checkpoints */}
        {checkpoints.length > 0 && (
          <div className="w-72 flex-shrink-0">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Флажки</h3>
            <div className="space-y-2">
              {checkpoints.map((cp) => (
                <div key={cp.id} className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                  <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {formatElapsed(cp.elapsedSeconds)}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cp.text}</span>
                  <button onClick={() => removeCheckpoint(cp.id)} className="text-gray-400 hover:text-red-500">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReportModal && <SessionReportModal onClose={hideReportModal} />}
    </div>
  )
}
