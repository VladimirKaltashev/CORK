export const MOCK_USERS = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    password: 'password123',
  },
] as const

export function generateMockToken(userId: string) {
  return `mock-token-${userId}-${Date.now()}`
}
