import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import { beforeAll, afterEach, afterAll } from 'vitest'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  // Reset in-memory DB to ensure isolation between tests
  if (typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>).__APP_DB__ = null
  }
})
afterAll(() => server.close())

export { server }
