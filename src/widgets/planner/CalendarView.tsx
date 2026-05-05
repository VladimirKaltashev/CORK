import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks,
  format, startOfWeek as startOfWeekFn, endOfWeek as endOfWeekFn,
  eachDayOfInterval as eachDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { usePlannerStore } from '@/entities/planner'
import { TaskModal } from '@/features/planner/TaskModal'
import type { Task } from '@/shared/types'

type CalendarView = 'month' | 'week'

interface CalendarViewProps {
  onSlotSelect?: (date: Date) => void
}

interface DayEvent {
  id: string
  title: string
  color: 'indigo' | 'green'
  completed?: boolean
  task?: Task
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  physics: 'Физика',
  informatics: 'Информатика',
  chemistry: 'Химия',
  biology: 'Биология',
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CalendarView({ onSlotSelect }: CalendarViewProps) {
  const { tasks, sessions } = usePlannerStore()
  const [view, setView] = useState<CalendarView>('month')
  const [date, setDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Build a map: dateKey -> events[]
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    const add = (key: string, ev: DayEvent) => {
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    for (const task of tasks) {
      const key = format(new Date(task.deadline), 'yyyy-MM-dd')
      add(key, { id: task.id, title: task.title, color: 'indigo', completed: task.completed, task })
    }
    for (const session of sessions) {
      const key = format(new Date(session.completedAt), 'yyyy-MM-dd')
      add(key, {
        id: session.id,
        title: `${SUBJECT_LABELS[session.subject] ?? session.subject} (${Math.round(session.durationSeconds / 60)} мин)`,
        color: 'green',
      })
    }
    return map
  }, [tasks, sessions])

  const getDays = (): Date[] => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeekFn(date, { weekStartsOn: 1 })
      const end = endOfWeekFn(date, { weekStartsOn: 1 })
      return eachDay({ start, end })
    }
  }

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setDate(dir === 1 ? addMonths(date, 1) : subMonths(date, 1))
    else setDate(dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1))
  }

  const title = view === 'month'
    ? format(date, 'LLLL yyyy', { locale: ru })
    : (() => {
        const s = startOfWeekFn(date, { weekStartsOn: 1 })
        const e = endOfWeekFn(date, { weekStartsOn: 1 })
        return `${format(s, 'd MMM', { locale: ru })} – ${format(e, 'd MMM yyyy', { locale: ru })}`
      })()

  const days = getDays()

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">‹</button>
          <span className="min-w-[180px] text-center text-sm font-semibold capitalize text-gray-800 dark:text-gray-200">{title}</span>
          <button onClick={() => navigate(1)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">›</button>
          <button onClick={() => setDate(new Date())} className="ml-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">
            Сегодня
          </button>
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['month', 'week'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            >
              {v === 'month' ? 'Месяц' : 'Неделя'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />Задачи
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />Сессии
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className={`flex-1 overflow-hidden grid grid-cols-7 ${view === 'month' ? 'auto-rows-fr' : 'grid-rows-1'}`}
        style={{ gridAutoRows: view === 'month' ? '1fr' : undefined }}
      >
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(key) ?? []
          const isCurrentMonth = view === 'week' || isSameMonth(day, date)
          const isSelected = isSameDay(day, date)
          const isTodayDay = isToday(day)

          return (
            <div
              key={key}
              onClick={() => { setDate(day); onSlotSelect?.(day) }}
              className={`group min-h-[70px] cursor-pointer border-b border-r border-gray-100 p-1 transition-colors dark:border-gray-700/50 ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/30'} hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10`}
            >
              <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isTodayDay ? 'bg-indigo-600 text-white' : isSelected ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); if (ev.task) setEditingTask(ev.task) }}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-xs font-medium text-white transition-opacity ${ev.color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-green-500 hover:bg-green-600'} ${ev.completed ? 'opacity-40' : ''}`}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-xs text-gray-400 dark:text-gray-500">+{dayEvents.length - 3} ещё</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  )
}
