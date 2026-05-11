import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { showToast } from '@/shared/lib/api'

const NAV_LINKS = [
  { to: '/feed', label: 'Лента' },
  { to: '/search', label: 'Поиск' },
  { to: '/profile/me', label: 'Профиль' },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { loadFriendships, pendingIncomingCount } = useFriendsStore()
  const pendingCount = token && user ? pendingIncomingCount() : 0

  useEffect(() => {
    if (token && user) loadFriendships(user.id)
  }, [token, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout()
    showToast('success', 'Вы вышли из системы')
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/feed" className="text-lg font-bold text-gray-900">
          Olympiad Tracker
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {token &&
            NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          {token && (
            <>
              <NavLink
                to="/friends"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Друзья
              </NavLink>
              <NavLink
                to="/friend-requests"
                className={({ isActive }) =>
                  `relative text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Заявки
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            </>
          )}
          {token && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Модерация
            </NavLink>
          )}

          {token ? (
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-gray-500">{user.name}</span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Регистрация
              </NavLink>
            </div>
          )}
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="flex flex-col border-t border-gray-200 bg-white px-4 py-3 sm:hidden">
          {token &&
            NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 text-sm font-medium ${
                    isActive ? 'text-indigo-600' : 'text-gray-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          {token && (
            <>
              <NavLink
                to="/friends"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
                }
              >
                Друзья
              </NavLink>
              <NavLink
                to="/friend-requests"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
                }
              >
                Заявки
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            </>
          )}
          {token && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
              }
            >
              Модерация
            </NavLink>
          )}

          {token ? (
            <div className="flex items-center justify-between py-2">
              {user && <span className="text-sm text-gray-500">{user.name}</span>}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-red-500"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-600"
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-indigo-600"
              >
                Регистрация
              </NavLink>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
