import { test, expect } from '@playwright/test'

test('smoke: login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/CORK/)
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Пароль')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
})

test('smoke: home redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL(/.*login/)
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible()
})
