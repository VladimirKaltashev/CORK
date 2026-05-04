import { useEffect, useState } from 'react'
import { usePlannerStore } from '@/entities/planner'
import { useTimerStore } from '@/entities/timer'
import { useStatusStore } from '@/entities/status'
import { useAuthStore } from '@/entities/auth'
import { TaskList } from '@/features/planner/TaskList'
import { TimerWidget } from '@/features/planner/TimerWidget'
import { CalendarView } from '@/widgets/planner/CalendarView'
import { TaskModal } from '@/features/planner/TaskModal'

export function PlannerPage() {
  const { loadTasks, loadSessions } = usePlannerStore()
  const { status: timerStatus } = useTimerStore()
  const { fetchStatus } = useStatusStore()
  const { user } = useAuthStore()
  const [createModalDate, setCreateModalDate] = useState<string | undefined>()

  useEffect(() => {
    loadTasks()
    loadSessions()
  }, [loadTasks, loadSessions])

  // Polling only when timer is running
  useEffect(() => {
    if (!user || timerStatus !== 'running') return
    const interval = setInterval(() => {
      fetchStatus(user.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [timerStatus, user, fetchStatus])

  const handleSlotSelect = (date: Date) => {
    setCreateModalDate(date.toISOString())
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Планировщик</h1>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr] gap-4">
        <TaskList />
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          <CalendarView onSlotSelect={handleSlotSelect} />
        </div>
      </div>

      <div className="shrink-0">
        <TimerWidget />
      </div>

      {createModalDate && (
        <TaskModal
          defaultDeadline={createModalDate}
          onClose={() => setCreateModalDate(undefined)}
        />
      )}
    </div>
  )
}
