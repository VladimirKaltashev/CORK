import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Mock Supabase auth endpoints
  await page.route(/\/auth\/v1\//, async (route) => {
    const url = route.request().url()
    if (url.includes('grant_type=password')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh',
          user: {
            id: 'test-user',
            email: 'test@test.com',
            aud: 'authenticated',
            role: 'authenticated',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email' },
            user_metadata: { name: 'Test User' },
            created_at: new Date().toISOString(),
          },
        }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'test@test.com',
          aud: 'authenticated',
          role: 'authenticated',
        }),
      })
    }
  })

  // Mock Supabase profile query
  await page.route(/\/rest\/v1\/profiles/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'test-user', name: 'Test User', is_admin: false }]),
    })
  })
})

test.describe('Challenges', () => {
  test('challenges page loads and shows active challenge', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/challenges', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenges: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              title: 'На велике — больше всех!',
              description: 'Кто проедет больше километров на велосипеде за неделю?',
              category: 'sport',
              goalType: 'distance',
              unit: 'км',
              proofConfig: { fields: ['photo', 'value'], valueLabel: 'км', valueRequired: true },
              startsAt: '2026-05-27T00:00:00Z',
              endsAt: '2026-06-03T00:00:00Z',
              status: 'active',
              createdBy: 'admin-id',
              createdAt: '2026-05-20T00:00:00Z',
              participantCount: 20,
            },
            {
              id: '22222222-2222-2222-2222-222222222222',
              title: 'Кино-марафон',
              description: 'Посмотри как можно больше фильмов за неделю!',
              category: 'movies',
              goalType: 'count',
              unit: 'фильмов',
              proofConfig: { fields: ['text', 'url'], valueLabel: 'фильмов', valueRequired: false },
              startsAt: '2026-05-13T00:00:00Z',
              endsAt: '2026-05-20T00:00:00Z',
              status: 'completed',
              createdBy: 'admin-id',
              createdAt: '2026-05-05T00:00:00Z',
              participantCount: 35,
            },
          ],
        }),
      })
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Пароль').fill('password123')
    await page.getByRole('button', { name: 'Войти' }).click()

    await page.waitForURL(/.*feed/, { timeout: 5000 })

    await page.goto('/challenges')
    await expect(page.getByRole('heading', { name: 'Челленджи' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Активный челлендж' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'На велике — больше всех!' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'История' })).toBeVisible()
    await expect(page.getByText('Кино-марафон')).toBeVisible()
  })

  test('challenge detail page loads', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/challenges/11111111-1111-1111-1111-111111111111', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: {
            id: '11111111-1111-1111-1111-111111111111',
            title: 'На велике — больше всех!',
            description: 'Кто проедет больше километров на велосипеде за неделю?',
            category: 'sport',
            goalType: 'distance',
            unit: 'км',
            proofConfig: { fields: ['photo', 'value'], valueLabel: 'км', valueRequired: true },
            startsAt: '2026-05-27T00:00:00Z',
            endsAt: '2026-06-03T00:00:00Z',
            status: 'active',
            createdBy: 'admin-id',
            createdAt: '2026-05-20T00:00:00Z',
            participantCount: 20,
          },
        }),
      })
    })

    await page.route('http://127.0.0.1:8000/challenges/11111111-1111-1111-1111-111111111111/submissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          submissions: [
            {
              id: 'sub-1',
              challengeId: '11111111-1111-1111-1111-111111111111',
              userId: 'user-1',
              proofType: 'photo',
              proofValue: 'https://example.com/strava1.jpg',
              value: 45.2,
              description: 'Вчера вел 45 км по берегу',
              submittedAt: '2026-05-28T10:00:00Z',
              userName: 'Алексей Иванов',
            },
            {
              id: 'sub-2',
              challengeId: '11111111-1111-1111-1111-111111111111',
              userId: 'user-2',
              proofType: 'photo',
              proofValue: 'https://example.com/strava2.jpg',
              value: 67.5,
              description: 'Лучший заезд в сезоне',
              submittedAt: '2026-05-29T15:00:00Z',
              userName: 'Мария Петрова',
            },
          ],
        }),
      })
    })

    await page.route('http://127.0.0.1:8000/challenges/11111111-1111-1111-1111-111111111111/leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [
            { userId: 'user-2', userName: 'Мария Петрова', totalProgress: 67.5, submissionCount: 1 },
            { userId: 'user-1', userName: 'Алексей Иванов', totalProgress: 45.2, submissionCount: 1 },
          ],
        }),
      })
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Пароль').fill('password123')
    await page.getByRole('button', { name: 'Войти' }).click()

    await page.waitForURL(/.*feed/, { timeout: 5000 })

    await page.goto('/challenges/11111111-1111-1111-1111-111111111111')
    await expect(page.getByRole('heading', { name: 'На велике — больше всех!' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Лидерборд' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Мария Петрова' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Алексей Иванов' })).toBeVisible()
  })
})
