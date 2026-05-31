import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useProfileStore } from '@/entities/profile'
import { useOnboardingStore } from '@/features/onboarding'
import { showToast } from '@/shared/lib/api'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors ${
    isActive
      ? 'text-ra-accent'
      : 'text-ra-text-secondary hover:text-ra-text-primary'
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
    <header className="sticky top-0 z-40 border-b border-ra-border bg-ra-bg-elevated/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/feed" className="text-lg font-bold tracking-wider text-ra-text-primary font-display">
          <span className="bg-gradient-to-r from-ra-accent to-ra-gold bg-clip-text text-transparent">CORK</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {token && (
            <NavLink to="/feed" className={navClass} data-onboard="feed">Лента</NavLink>
          )}
          {token && (
            <NavLink
              to="/friends"
              data-onboard="friends"
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-ra-accent'
                    : 'text-ra-text-secondary hover:text-ra-text-primary'
                }`
              }
            >
              Друзья
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-3 inline-flex items-center justify-center w-4 h-4 rounded-full bg-ra-danger text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
          {token && (
            <NavLink to="/leaderboard" data-onboard="leaderboard" className={navClass}>Рейтинг</NavLink>
          )}
          {token && (
            <NavLink to="/challenges" className={navClass}>Челленджи</NavLink>
          )}
          {token && user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>Модерация</NavLink>
          )}

          {token ? (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                data-onboard="profile"
                className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden border-2 border-ra-border hover:border-ra-accent/50 transition-all duration-300 focus:outline-none"
                aria-label="Меню профиля"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-ra-accent/10 text-ra-accent flex items-center justify-center text-sm font-bold select-none">
                    {getInitials(name)}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-ra-border bg-ra-bg-elevated shadow-ra-card z-50 backdrop-blur-xl">
                  <div className="px-4 py-3 border-b border-ra-border">
                    <p className="text-sm font-bold text-ra-text-primary truncate">{name}</p>
                  </div>
                  <NavLink
                    to="/profile/me"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ra-text-secondary hover:text-ra-text-primary hover:bg-ra-bg-hover transition-colors"
                  >
                    Мой профиль
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ra-text-secondary hover:text-ra-text-primary hover:bg-ra-bg-hover transition-colors"
                  >
                    Настройки
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); startOnboarding() }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-ra-text-secondary hover:text-ra-text-primary hover:bg-ra-bg-hover transition-colors"
                  >
                    Подсказки
                  </button>
                  <div className="border-t border-ra-border mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-ra-danger hover:bg-ra-danger/10 transition-colors"
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
                className="text-sm font-medium text-ra-text-secondary hover:text-ra-text-primary transition-colors"
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                className="ra-btn-primary text-sm py-1.5 px-3"
              >
                Регистрация
              </NavLink>
            </div>
          )}
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          className="flex items-center justify-center rounded-xl p-2 text-ra-text-secondary hover:bg-ra-bg-hover hover:text-ra-text-primary transition-colors sm:hidden"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="flex flex-col border-t border-ra-border bg-ra-bg-elevated px-4 py-3 sm:hidden">
          {token && (
            <NavLink
              to="/feed"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
            >
              Лента
            </NavLink>
          )}
          {token && (
            <NavLink
              to="/friends"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`
              }
            >
              Друзья
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-ra-danger text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
          {token && (
            <NavLink
              to="/leaderboard"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
            >
              Рейтинг
            </NavLink>
          )}
          {token && (
            <NavLink
              to="/challenges"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
            >
              Челленджи
            </NavLink>
          )}
          {token && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
            >
              Модерация
            </NavLink>
          )}
          {token && (
            <>
              <NavLink
                to="/profile/me"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
              >
                Мой профиль
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block py-2.5 text-sm font-medium ${isActive ? 'text-ra-accent' : 'text-ra-text-secondary'}`}
              >
                Настройки
              </NavLink>
            </>
          )}

          {token ? (
            <div className="flex items-center justify-between pt-3 border-t border-ra-border mt-2">
              {user && <span className="text-xs text-ra-text-muted truncate">{name}</span>}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-ra-danger"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-ra-text-secondary"
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-ra-accent"
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
