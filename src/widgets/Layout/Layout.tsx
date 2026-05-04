import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { ToastContainer } from '@/shared/ui/Toast'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
