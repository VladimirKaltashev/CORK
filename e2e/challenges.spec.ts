import { test, expect } from '@playwright/test'

test.describe('Challenges', () => {
  test('challenges page loads and shows active challenge', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Пароль').fill('password123')
    await page.getByRole('button', { name: 'Войти' }).click()

    // Wait for login to complete or error
    await Promise.race([
      page.waitForURL(/.*feed/, { timeout: 5000 }).then(() => true),
      page.waitForSelector('[role="alert"], [role="status"]', { timeout: 5000 }).then(() => false),
    ])

    await page.goto('/challenges')
    await page.waitForSelector('text=Челленджи')

    // Check if active challenge or "no active challenge" message is shown
    const hasActive = await page.locator('text=Активный челлендж').isVisible()
    const hasNoActive = await page.locator('text=Сейчас нет активного челленджа').isVisible()
    expect(hasActive || hasNoActive).toBe(true)
  })

  test('challenge detail page loads', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Пароль').fill('password123')
    await page.getByRole('button', { name: 'Войти' }).click()

    await Promise.race([
      page.waitForURL(/.*feed/, { timeout: 5000 }).then(() => true),
      page.waitForSelector('[role="alert"], [role="status"]', { timeout: 5000 }).then(() => false),
    ])

    // Navigate to a challenge detail page
    await page.goto('/challenges/11111111-1111-1111-1111-111111111111')
    await page.waitForSelector('text=На велике — больше всех!')
    await page.waitForSelector('text=Лидерборд')
  })
})
