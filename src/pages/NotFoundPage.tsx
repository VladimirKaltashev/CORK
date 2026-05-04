import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700">404</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400">Страница не найдена</p>
      <Link
        to={ROUTES.HOME}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        На главную
      </Link>
    </div>
  )
}
