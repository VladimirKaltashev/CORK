import axios from 'axios'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'

export { showToast }

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout()
        showToast('error', 'Сессия истекла')
        return Promise.reject(error)
      }
      const message =
        (error.response?.data as { message?: string })?.message ?? 'Произошла ошибка'
      showToast('error', message)
    } else {
      showToast('error', 'Произошла ошибка')
    }
    return Promise.reject(error)
  },
)
