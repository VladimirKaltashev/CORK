import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/entities/auth'
import { showToast } from '@/shared/lib/api'

// --- Модалка создания сессии ---
function AddSessionModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Экономика',
    durationMinutes: 60,
    date: new Date().toISOString().slice(0, 16)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/api/sessions', {
        ...formData,
        authorId: user?.id
      })
      showToast('success', 'Сессия записана!')
      onSuccess() // Сообщаем родителю, что всё ок
    } catch (e) {
      showToast('error', 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Новая сессия</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Тема</label>
            <input 
              required
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Например: Микроэкономика"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-medium">Предмет</label>
              <select 
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              >
                <option>Экономика</option>
                <option>Математика</option>
                <option>Информатика</option>
                <option>Обществознание</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium">Минут</label>
              <input 
                type="number"
                required
                min="15"
                step="15"
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
                value={formData.durationMinutes}
                onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Дата</label>
            <input 
              type="datetime-local"
              required
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium">
              {loading ? 'Сохранение...' : 'Записать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- Главная страница ---
export function HomePage() {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState({ totalHours: 0, totalSessions: 0 })

  // Функция загрузки статистики
  const fetchStats = () => {
    if (!user?.id) return
    axios.get(`http://127.0.0.1:8000/api/profile/${user.id}`)
      .then(r => setStats(r.data.stats))
      .catch(console.error)
  }

  // Загружаем при открытии страницы
  useEffect(() => {
    fetchStats()
  }, [user])

  // Обработчик успеха: закрываем модалку и ОБНОВЛЯЕМ цифры
  const handleSuccess = () => {
    setIsModalOpen(false)
    fetchStats() // <--- Вот ключевой момент
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Привет, {user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Готов к ВсОШ? Запиши свою тренировку.</p>
      </header>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
          <div className="text-4xl font-bold text-indigo-600">{stats.totalHours}</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Часов всего</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
          <div className="text-4xl font-bold text-emerald-600">{stats.totalSessions}</div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Сессий</div>
        </div>
      </div>

      {/* Кнопка действия */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition transform active:scale-[0.98]"
      >
        + Записать новую сессию
      </button>

      {isModalOpen && (
        <AddSessionModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}
    </div>
  )
}