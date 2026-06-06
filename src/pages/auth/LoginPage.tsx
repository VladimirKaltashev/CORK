import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { loginSchema, type LoginFormData } from '@/shared/schemas/auth'
import { showToast } from '@/shared/lib/toast'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      navigate('/feed', { replace: true })
      showToast('success', 'Вход выполнен')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Неверный email или пароль'
      showToast('error', msg)
    }
  }

  const inputBase = 'w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--cork-brand)]'
  const inputStyle = { background: 'var(--cork-surface)', color: 'var(--cork-text)' }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold" style={{ color: 'var(--cork-text)' }}>Вход</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: 'var(--cork-text-dim)' }}>Email</label>
          <input
            id="email"
            {...register('email')}
            type="email"
            autoComplete="email"
            className={cn(
              inputBase,
              errors.email
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300',
            )}
            style={inputStyle}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: 'var(--cork-text-dim)' }}>Пароль</label>
          <input
            id="password"
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className={cn(
              inputBase,
              errors.password
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300',
            )}
            style={inputStyle}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cork-btn-primary mt-2"
        >
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--cork-text-dim)' }}>
        Нет аккаунта?{' '}
        <Link to={ROUTES.REGISTER} className="cork-link">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
