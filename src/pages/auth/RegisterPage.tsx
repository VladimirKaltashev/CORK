import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/entities/auth/api/authApi'
import { useAuthStore } from '@/entities/auth'
import { registerSchema, type RegisterFormData } from '@/shared/schemas/auth'
import { showToast } from '@/shared/lib/api'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

const FIELDS = [
  { name: 'name', label: 'Имя', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Пароль', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Повторите пароль', type: 'password', autoComplete: 'new-password' },
] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Отправка регистрации:', data) 
    try {
      const result = await authApi.register(data.name, data.email, data.password)
      setToken(result.token)
      setUser(result.user)
      showToast('success', 'Аккаунт создан!')
      navigate(ROUTES.HOME)
    } catch (e: any) {
      console.error('Ошибка регистрации:', e)
      showToast('error', e.response?.data?.detail || 'Ошибка регистрации')
    }
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Регистрация
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <div key={name}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              {...register(name)}
              type={type}
              autoComplete={autoComplete}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-white text-gray-900',
                'focus:ring-2 focus:ring-indigo-500',
                errors[name]
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300',
              )}
            />
            {errors[name] && (
              <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Создание...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to={ROUTES.LOGIN} className="text-indigo-600 hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}