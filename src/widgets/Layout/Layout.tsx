import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { ToastContainer } from '@/shared/ui/Toast'
import { OnboardingTour, OnboardingAutoStart } from '@/features/onboarding'
import { CreateAchievementFAB } from '@/features/profile/CreateAchievementFAB'
import { AddAchievementModal } from '@/features/profile/AddAchievementModal'
import { useAuthStore } from '@/entities/auth'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'

export function Layout() {
  const { token } = useAuthStore()
  const isDialogOpen = useCreateAchievementDialog((s) => s.isOpen)
  const closeDialog = useCreateAchievementDialog((s) => s.close)

  return (
    <div className="flex min-h-screen flex-col bg-ra-bg-base text-ra-text-primary">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <ToastContainer />
      {token && <OnboardingAutoStart />}
      <OnboardingTour />
      {token && <CreateAchievementFAB />}
      {token && isDialogOpen && <AddAchievementModal onClose={closeDialog} />}
    </div>
  )
}
