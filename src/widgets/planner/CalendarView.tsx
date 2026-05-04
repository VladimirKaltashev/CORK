import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { format, parse, startOfWeek, getDay, addSeconds } from 'date-fns'
import { ru } from 'date-fns/locale'
import { usePlannerStore } from '@/entities/planner'
import { TaskModal } from '@/features/planner/TaskModal'
import type { Task, StudySession } from '@/shared/types'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { ru },
})

const messages = {
  allDay: 'Весь день',
  previous: '‹',
  next: '›',
  today: 'Сегодня',
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
  agenda: 'Повестка',
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  noEventsInRange: 'Нет событий',
  showMore: (total: number) => `+${total} ещё`,
}

interface PlannerEventResource {
  type: 'task' | 'session'
  data: Task | StudySession
}

interface PlannerEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: PlannerEventResource
}

const DnDCalendar = withDragAndDrop<PlannerEvent>(Calendar)

interface CalendarViewProps {
  onSlotSelect?: (date: Date) => void
}

export function CalendarView({ onSlotSelect }: CalendarViewProps) {
  const { tasks, sessions, updateTask } = usePlannerStore()
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const events = useMemo<PlannerEvent[]>(() => {
    const taskEvents: PlannerEvent[] = tasks.map((task) => {
      const start = new Date(task.deadline)
      return {
        id: task.id,
        title: task.title,
        start,
        end: new Date(start.getTime() + 60 * 60 * 1000),
        resource: { type: 'task', data: task },
      }
    })
    const sessionEvents: PlannerEvent[] = sessions.map((session) => {
      const start = new Date(session.completedAt)
      return {
        id: session.id,
        title: `${SUBJECT_LABELS[session.subject]} (${Math.round(session.durationSeconds / 60)} мин)`,
        start,
        end: addSeconds(start, session.durationSeconds),
        resource: { type: 'session', data: session },
      }
    })
    return [...taskEvents, ...sessionEvents]
  }, [tasks, sessions])

  const eventPropGetter = (event: PlannerEvent) => ({
    style: {
      backgroundColor: event.resource.type === 'task' ? '#4F46E5' : '#10B981',
      borderRadius: '4px',
      border: 'none',
      color: '#fff',
      opacity: event.resource.type === 'task' && (event.resource.data as Task).completed ? 0.5 : 1,
    },
  })

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (onSlotSelect) {
      onSlotSelect(start)
    }
  }

  const handleSelectEvent = (event: PlannerEvent) => {
    if (event.resource.type === 'task') {
      setEditingTask(event.resource.data as Task)
    }
  }

  const handleEventDrop = ({ event, start }: { event: PlannerEvent; start: Date | string }) => {
    if (event.resource.type === 'task') {
      const task = event.resource.data as Task
      const deadline = start instanceof Date ? start : new Date(start)
      updateTask(task.id, { deadline: deadline.toISOString() })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <DnDCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        views={['month', 'week']}
        culture="ru"
        messages={messages}
        eventPropGetter={eventPropGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        draggableAccessor={(event: PlannerEvent) => event.resource.type === 'task'}
        selectable
        style={{ flex: 1 }}
      />
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
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
