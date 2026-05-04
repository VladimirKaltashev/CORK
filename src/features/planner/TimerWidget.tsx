import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '@/entities/timer'
import { useStatusStore } from '@/entities/status'
import { useAuthStore } from '@/entities/auth'
import { api } from '@/shared/lib/api'
import { SessionReportModal } from './SessionReportModal'
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

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

interface TimerWidgetProps {
  fullscreen?: boolean
}

export function TimerWidget({ fullscreen = false }: TimerWidgetProps) {
  const navigate = useNavigate()
  const { subject, elapsedSeconds, status, checkpoints, showReportModal, setSubject, start, pause, resume, stop, hideReportModal, addCheckpoint, removeCheckpoint } = useTimerStore()
  const { setStatus } = useStatusStore()
  const { user } = useAuthStore()
  const [cpInput, setCpInput] = useState('')
  const [showCpInput, setShowCpInput] = useState(false)

  // Sync status store with timer state
  useEffect(() => {
    if (status === 'running' && subject) {
      setStatus({ status: 'working', subject })
    } else if (status === 'idle') {
      setStatus({ status: 'online' })
    }
  }, [status, subject, setStatus])

  // Update server status when timer starts/stops
  useEffect(() => {
    if (!user) return
    if (status === 'running' && subject) {
      api.post('/user/status', { status: 'working', subject, since: new Date().toISOString() }).catch(() => undefined)
    } else if (status === 'idle') {
      api.post('/user/status', { status: 'online' }).catch(() => undefined)
    }
  }, [status, subject, user])

  const handleAddCheckpoint = () => {
    if (cpInput.trim()) {
      addCheckpoint(cpInput.trim())
      setCpInput('')
      setShowCpInput(false)
    }
  }

  const containerClass = fullscreen
    ? 'flex flex-col gap-6'
    : 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'

  return (
    <div className={containerClass}>
      {status === 'idle' ? (
        <div className={`flex ${fullscreen ? 'flex-col items-center gap-4' : 'items-center gap-4'}`}>
          {fullscreen && <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Выберите предмет и начните сессию</p>}
          <select
            value={subject ?? ''}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Выберите предмет</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={start}
            disabled={!subject}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            ▶ Старт
          </button>
          {!fullscreen && (
            <span className="text-xs text-gray-400">Таймер не запущен</span>
          )}
        </div>
      ) : (
        <div className={`flex ${fullscreen ? 'flex-col items-center gap-4' : 'items-center gap-4 flex-wrap'}`}>
          <div className={`font-mono font-bold tabular-nums ${fullscreen ? 'text-7xl text-gray-900 dark:text-white' : 'text-2xl text-gray-900 dark:text-white'}`}>
            {formatElapsed(elapsedSeconds)}
          </div>

          {subject && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {SUBJECT_LABELS[subject]}
            </span>
          )}

          <div className={`flex gap-2 ${fullscreen ? 'flex-wrap justify-center' : ''}`}>
            {status === 'running' ? (
              <button onClick={pause} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600">
                ⏸ Пауза
              </button>
            ) : (
              <button onClick={resume} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                ▶ Продолжить
              </button>
            )}
            <button onClick={stop} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600">
              ⏹ Завершить
            </button>
            <button
              onClick={() => setShowCpInput((v) => !v)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              🚩 Флажок
            </button>
            {!fullscreen && (
              <button
                onClick={() => navigate(ROUTES.TIMER)}
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400"
              >
                ⛶ На весь экран
              </button>
            )}
          </div>

          {showCpInput && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={cpInput}
                onChange={(e) => setCpInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCheckpoint() }}
                placeholder="Текст флажка..."
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button onClick={handleAddCheckpoint} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
                ОК
              </button>
            </div>
          )}

          {checkpoints.length > 0 && (
            <div className={`space-y-1 ${fullscreen ? 'w-full max-w-sm' : 'w-full'}`}>
              {checkpoints.map((cp) => (
                <div key={cp.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-700">
                  <span className="font-mono text-xs text-gray-400">{formatElapsed(cp.elapsedSeconds)}</span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cp.text}</span>
                  <button
                    onClick={() => removeCheckpoint(cp.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReportModal && <SessionReportModal onClose={hideReportModal} />}
    </div>
  )
}
