import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api } from './api'
import { useAuthStore } from '@/entities/auth'
import { showToast } from './toast'

vi.mock('@/entities/auth', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: null, logout: vi.fn() })),
  },
}))

vi.mock('./toast', () => ({
  showToast: vi.fn(),
  useToastStore: { getState: vi.fn(), setState: vi.fn() },
}))

describe('api interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('api instance has correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('http://127.0.0.1:8000')
  })

  it('request interceptor adds token when present', async () => {
    const mockGetState = vi.fn().mockReturnValue({ token: 'test-token', logout: vi.fn() })
    useAuthStore.getState = mockGetState
    const req = { headers: {} } as never
    const result = await api.interceptors.request.handlers[0].fulfilled(req)
    expect(result.headers.Authorization).toBe('Bearer test-token')
  })

  it('request interceptor skips token when absent', async () => {
    const mockGetState = vi.fn().mockReturnValue({ token: null, logout: vi.fn() })
    useAuthStore.getState = mockGetState
    const req = { headers: {} } as never
    const result = await api.interceptors.request.handlers[0].fulfilled(req)
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('response interceptor passes through success', async () => {
    const response = { data: 'ok' } as never
    const result = await api.interceptors.response.handlers[0].fulfilled(response)
    expect(result).toBe(response)
  })

  it('response interceptor handles 401', async () => {
    const mockLogout = vi.fn()
    useAuthStore.getState = vi.fn().mockReturnValue({ token: 'old', logout: mockLogout })
    const error = { isAxiosError: true, response: { status: 401, data: { message: 'Unauthorized' } } }
    await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
    expect(mockLogout).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('error', 'Сессия истекла')
  })

  it('response interceptor handles axios error with message', async () => {
    const error = { isAxiosError: true, response: { status: 500, data: { message: 'Server error' } } }
    await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
    expect(showToast).toHaveBeenCalledWith('error', 'Server error')
  })

  it('response interceptor handles generic error', async () => {
    const error = { isAxiosError: true, response: {} }
    await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
    expect(showToast).toHaveBeenCalledWith('error', 'Произошла ошибка')
  })

  it('response interceptor handles non-axios error', async () => {
    const error = new Error('network failure')
    await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
    expect(showToast).toHaveBeenCalledWith('error', 'Произошла ошибка')
  })
})
