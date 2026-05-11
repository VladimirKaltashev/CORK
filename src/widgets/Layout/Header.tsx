import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useProfileStore } from '@/entities/profile'
import { showToast } from '@/shared/lib/api'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { loadFriendships, pendingIncomingCount } = useFriendsStore()
  const { loadProfile, getProfile } = useProfileStore()
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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/feed" className="text-lg font-bold text-gray-900">
          Olympiad Tracker
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {token && (
            <NavLink to="/feed" className={navClass}>Лента</NavLink>
          )}
          {token && (
            <NavLink
              to="/friends"
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
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
          {token && user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>Модерация</NavLink>
          )}

          {token ? (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
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
                <div className="absolute right-0 top-full mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                  </div>
                  <NavLink
                    to="/profile/me"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Мой профиль
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Настройки
                  </NavLink>
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
          {token && (
            <NavLink
              to="/feed"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
            >
              Лента
            </NavLink>
          )}
          {token && (
            <NavLink
              to="/friends"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
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
          {token && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
            >
              Модерация
            </NavLink>
          )}
          {token && (
            <>
              <NavLink
                to="/profile/me"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
              >
                Мой профиль
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
              >
                Настройки
              </NavLink>
            </>
          )}

          {token ? (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
              {user && <span className="text-xs text-gray-500 truncate">{name}</span>}
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
