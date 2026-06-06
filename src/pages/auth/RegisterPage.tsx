import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { registerSchema, type RegisterFormData } from '@/shared/schemas/auth'
import { showToast } from '@/shared/lib/toast'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

const FIELDS = [
  { name: 'name',            label: 'Имя',               type: 'text',     autoComplete: 'name' },
  { name: 'email',           label: 'Email',             type: 'email',    autoComplete: 'email' },
  { name: 'password',        label: 'Пароль',            type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Повторите пароль',  type: 'password', autoComplete: 'new-password' },
] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.name, data.email, data.password)
      showToast('success', 'Аккаунт создан!')
      navigate('/feed', { replace: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка регистрации'
      showToast('error', msg)
    }
  }

  const inputBase = 'w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--cork-brand)]'
  const inputStyle = { background: 'var(--cork-surface)', color: 'var(--cork-text)' }

  return (
    <div className="mx-auto mt-12 w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold" style={{ color: 'var(--cork-text)' }}>Регистрация</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <div key={name}>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--cork-text-dim)' }}>{label}</label>
            <input
              {...register(name)}
              type={type}
              autoComplete={autoComplete}
              className={cn(
                inputBase,
                errors[name]
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300',
              )}
              style={inputStyle}
            />
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="cork-btn-primary mt-2"
        >
          {isSubmitting ? 'Создание...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--cork-text-dim)' }}>
        Уже есть аккаунт?{' '}
        <Link to={ROUTES.LOGIN} className="cork-link">
          Войти
        </Link>
      </p>
    </div>
  )
}
