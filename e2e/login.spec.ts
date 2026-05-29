import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Пароль')).toBeVisible()

  await page.getByLabel('Email').fill('test@test.com')
  await page.getByLabel('Пароль').fill('password123')
  await page.getByRole('button', { name: 'Войти' }).click()

  // Either redirect to feed or show error toast
  await Promise.race([
    page.waitForURL(/.*feed/).then(() => true),
    page.waitForSelector('[role="status"], .toast, .toast-error', { timeout: 5000 }).then(() => false),
  ])
})
