import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/entities/auth/api/authApi'
import { useAuthStore } from '@/entities/auth'
import { loginSchema, type LoginFormData } from '@/shared/schemas/auth'
import { showToast } from '@/shared/lib/api'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    console.log('Отправка входа:', data)
    try {
      const response = await authApi.login(data.email, data.password)
      console.log('Ответ от сервера:', response)
      
      setToken(response.token)
      setUser(response.user)
      
      navigate('/', { replace: true })
      showToast('success', 'Вход выполнен')
    } catch (e: any) {
      console.error('Ошибка входа:', e)
      showToast('error', e.response?.data?.detail || 'Неверный email или пароль')
    }
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Вход
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-white text-gray-900',
              'focus:ring-2 focus:ring-indigo-500',
              errors.email
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300',
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Пароль
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-white text-gray-900',
              'focus:ring-2 focus:ring-indigo-500',
              errors.password
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300',
            )}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <Link to={ROUTES.REGISTER} className="text-indigo-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}