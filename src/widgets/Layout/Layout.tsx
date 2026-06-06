import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { ToastContainer } from '@/shared/ui/Toast'
import { OnboardingTour, OnboardingAutoStart } from '@/features/onboarding'
import { AddAchievementModal } from '@/features/profile/AddAchievementModal'
import { useAuthStore } from '@/entities/auth'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'
import { useThemeStore } from '@/entities/theme'

export function Layout() {
  const { token } = useAuthStore()
  const isDialogOpen = useCreateAchievementDialog((s) => s.isOpen)
  const closeDialog = useCreateAchievementDialog((s) => s.close)
  const theme = useThemeStore((s) => s.theme)

  const isAcid = theme === 'acid'

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--cork-bg)', color: 'var(--cork-text)' }}>
      <Header />
      <main className={isAcid ? 'flex-1' : 'mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>
      <ToastContainer />
      {token && <OnboardingAutoStart />}
      <OnboardingTour />
      {token && isDialogOpen && <AddAchievementModal onClose={closeDialog} />}
    </div>
  )
}