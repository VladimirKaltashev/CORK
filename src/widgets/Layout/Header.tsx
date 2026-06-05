import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useProfileStore } from '@/entities/profile'
import { useOnboardingStore } from '@/features/onboarding'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'
import { showToast } from '@/shared/lib/api'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors ${
    isActive
      ? 'text-indigo-600 dark:text-indigo-400'
      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
  }`
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { loadFriendships, pendingIncomingCount } = useFriendsStore()
  const { loadProfile, getProfile } = useProfileStore()
  const startOnboarding = useOnboardingStore((s) => s.start)
  const pendingCount = token && user ? pendingIncomingCount() : 0
  const profile = user ? getProfile(user.id) : undefined
  const avatar = profile?.avatar ?? null
  const name = user?.name ?? ''

  useEffect(() => {
    if (token && user) {
      loadFriendships(user.id)
      loadProfile(user.id)
    }
  }, [token, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const handleLogout = () => {
    logout()
    showToast('success', 'Вы вышли из системы')
    navigate('/login')
    setMenuOpen(false)
    setDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/feed" className="text-lg font-bold tracking-wider text-gray-900 dark:text-white">
          CORK
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/feed" className={navClass} data-onboard="feed">Лента</NavLink>
          {token && (
            <NavLink
              to="/friends"
              data-onboard="friends"
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`
              }
            >
              Друзья
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-3 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
          <NavLink to="/leaderboard" data-onboard="leaderboard" className={navClass}>Рейтинг</NavLink>
          <NavLink to="/challenges" className={navClass}>Челленджи</NavLink>
          {token && user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>Модерация</NavLink>
          )}

          {/* Search icon - available for all users */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Поиск"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Create achievement + button */}
          {token && (
            <button
              type="button"
              onClick={() => useCreateAchievementDialog.getState().open()}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              aria-label="Создать достижение"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {token ? (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                data-onboard="profile"
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-indigo-400 transition-all focus:outline-none"
                aria-label="Меню профиля"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold select-none">
                    {getInitials(name)}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-800">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{name}</p>
                  </div>
                  <NavLink
                    to="/profile/me"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Мой профиль
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Настройки
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); startOnboarding() }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Подсказки
                  </button>
                  <div className="border-t border-gray-100 mt-1 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-900/20"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
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
        <nav className="flex flex-col border-t border-gray-200 bg-white px-4 py-3 sm:hidden dark:border-gray-800 dark:bg-gray-900">
          <NavLink
            to="/feed"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Лента
          </NavLink>
          {token && (
            <NavLink
              to="/friends"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`
              }
            >
              Друзья
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
          <NavLink
            to="/leaderboard"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Рейтинг
          </NavLink>
          <NavLink
            to="/challenges"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Челленджи
          </NavLink>
          {token && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Модерация
            </NavLink>
          )}
          {token && (
            <>
              <NavLink
                to="/profile/me"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Мой профиль
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Настройки
              </NavLink>
            </>
          )}

          {token ? (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1 dark:border-gray-700">
              {user && <span className="text-xs text-gray-500 truncate dark:text-gray-400">{name}</span>}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 dark:text-red-400"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
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
