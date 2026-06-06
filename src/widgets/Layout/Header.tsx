import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore } from '@/entities/profile'
import { useOnboardingStore } from '@/features/onboarding'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'
import { useFriendsStore } from '@/entities/friends'
import { showToast } from '@/shared/lib/api'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { loadProfile, getProfile } = useProfileStore()
  const startOnboarding = useOnboardingStore((s) => s.start)
  const openCreateDialog = useCreateAchievementDialog((s) => s.open)
  const pendingCount = useFriendsStore((s) => s.pendingIncomingCount())
  const profile = user ? getProfile(user.id) : undefined
  const avatar = profile?.avatar ?? null
  const name = user?.name ?? ''

  const loadFriendships = useFriendsStore((s) => s.loadFriendships)

  useEffect(() => {
    if (token && user) {
      loadProfile(user.id)
      loadFriendships(user.id)
    }
  }, [token, user?.id, loadProfile, loadFriendships]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <header className="cork-header">
      <div className="cork-header__inner">
        {/* Brand */}
        <NavLink to="/feed" className="cork-header__brand">
          <span>CORK</span>
        </NavLink>

        {/* Desktop nav — center */}
        <nav className="cork-header__nav">
          <NavLink to="/feed" className={({ isActive }) => `cork-nav-link ${isActive ? 'active' : ''}`}>
            Арена
          </NavLink>
          <NavLink to="/challenges" className={({ isActive }) => `cork-nav-link ${isActive ? 'active' : ''}`}>
            Челленджи
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `cork-nav-link ${isActive ? 'active' : ''}`}>
            Рейтинг
          </NavLink>
          <NavLink to="/profile/me" className={({ isActive }) => `cork-nav-link ${isActive ? 'active' : ''}`}>
            Профиль
          </NavLink>
        </nav>

        {/* Desktop actions — right */}
        <div className="cork-header__actions">
          {/* Search */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="cork-icon-btn"
            aria-label="Поиск"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Create + */}
          {token && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="cork-create-btn"
              aria-label="Вынести на суд"
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
                className="cork-avatar relative"
                aria-label="Меню профиля"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" style={{ borderRadius: 'var(--cork-radius-pill)' }} />
                ) : (
                  getInitials(name)
                )}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: 'var(--cork-clown)', color: '#fff' }}>
                    {pendingCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="dropdown">
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--cork-border-light)' }}>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--cork-text)' }}>{name}</p>
                  </div>
                  <NavLink to="/profile/me" onClick={() => setDropdownOpen(false)}>Мой профиль</NavLink>
                  <NavLink to="/friends" onClick={() => setDropdownOpen(false)}>
                    Заявки
                    {pendingCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--cork-clown)', color: '#fff' }}>
                        {pendingCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink to="/settings" onClick={() => setDropdownOpen(false)}>Настройки</NavLink>
                  {token && user?.role === 'admin' && (
                    <NavLink to="/admin" onClick={() => setDropdownOpen(false)}>Модерация</NavLink>
                  )}
                  <button type="button" onClick={() => { setDropdownOpen(false); startOnboarding() }}>Подсказки</button>
                  <div className="separator" />
                  <button type="button" onClick={handleLogout} className="danger">Выйти</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="cork-nav-link">Войти</NavLink>
              <NavLink to="/register" className="cork-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>Регистрация</NavLink>
            </div>
          )}
        </div>

        {/* Mobile actions — hamburger only */}
        <div className="cork-header__mobile">
          <button
            type="button"
            className="cork-icon-btn"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="cork-mobile-nav">
          <NavLink to="/feed" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Арена</NavLink>
          <NavLink to="/challenges" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Челленджи</NavLink>
          <NavLink to="/leaderboard" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Рейтинг</NavLink>
          <NavLink to="/profile/me" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Профиль</NavLink>
          {token && user?.role === 'admin' && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Модерация</NavLink>
          )}
          <div className="separator" />
          {token ? (
            <>
              <NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Настройки</NavLink>
              <button type="button" onClick={handleLogout} className="text-[var(--cork-clown)]">Выйти</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>Войти</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>Регистрация</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
