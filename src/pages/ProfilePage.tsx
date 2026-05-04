import { useEffect, useState } from 'react'
import axios from 'axios'
// @ts-ignore
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css' // Обязательный импорт стилей
import { useAuthStore } from '@/entities/auth'

// Типы для хитмапа
type HeatmapValue = {
  date: string
  count: number
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = () => {
    if (!user?.id) return
    setLoading(true)
    axios.get(`http://127.0.0.1:8000/api/profile/${user.id}`)
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  if (loading) return <div className="p-8 text-center">Загрузка...</div>
  if (!profile) return <div className="p-8 text-center text-red-500">Ошибка загрузки</div>

  // Трансформация данных для react-calendar-heatmap
  // Библиотека требует формат [{ date: '2023-01-01', count: 5 }]
  const heatmapData: HeatmapValue[] = (profile.sessions || []).map((s: any) => {
    const dateStr = s.date ? s.date.split('T')[0] : new Date().toISOString().split('T')[0]
    // Можно считать по количеству сессий (count: 1) или по часам (count: hours)
    // Для "GitHub style" лучше считать количество действий (сессий) в день
    return {
      date: dateStr,
      count: 1 
    }
  })

  // Настройка цветов как на GitHub
  const classForValue = (value: HeatmapValue | null) => {
    if (!value || value.count === 0) return 'color-empty'
    if (value.count >= 4) return 'color-scale-4'
    if (value.count >= 3) return 'color-scale-3'
    if (value.count >= 2) return 'color-scale-2'
    return 'color-scale-1'
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6 border border-gray-100 dark:border-gray-700">
        
        {/* Шапка профиля */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
              {profile.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {profile.role}
              </div>
            </div>
          </div>
          <button onClick={fetchProfile} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Обновить данные
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Всего сессий" value={profile.stats?.totalSessions || 0} />
          <StatCard label="Часов подготовки" value={profile.stats?.totalHours || 0} />
          <StatCard label="Достижений" value={profile.stats?.achievements || 0} />
        </div>

        {/* Цель */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Текущая цель</h3>
          <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.goal || 'Не указана'}</p>
        </div>

        {/* GitHub-style Heatmap */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Активность</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-[#ebedf0] dark:bg-[#161b22] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#9be9a8] dark:bg-[#0e4429] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#40c463] dark:bg-[#006d32] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#30a14e] dark:bg-[#26a641] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#216e39] dark:bg:[#39d353] rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={heatmapData}
              classForValue={classForValue}
              tooltipDataAttrs={(value: HeatmapValue | null) => {
                if (!value || !value.date) return {}
                const dateObj = new Date(value.date)
                const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
                return {
                  'data-tip': `${value.count} сессий • ${dateObj.toLocaleDateString('ru-RU', options)}`
                }
              }}
              showWeekdayLabels={true}
              gutterSize={4}
            />
          </div>
          
          {/* Легенда подсказки (опционально, если tooltip не работает без доп. либы) */}
          <p className="text-center text-xs text-gray-400 mt-2">
            Наведите на квадратик, чтобы увидеть детали
          </p>
        </div>

      </div>
    </div>
  )
}

// Компонент карточки статистики для чистоты кода
function StatCard({ label, value }: { label: string, value: number | string }) {
  return (
    <div className="bg-white dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
      <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}