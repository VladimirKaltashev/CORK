import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', './src/test/msw-setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/entities/**/*.{ts,tsx}',
        'src/shared/lib/**/*.{ts,tsx}',
        'src/shared/schemas/**/*.{ts,tsx}',
        'src/shared/hooks/**/*.{ts,tsx}',
        'src/features/reactions/*.{ts,tsx}',
        'src/features/planner/format.ts',
        'src/features/feed/useModal.ts',
        'src/features/onboarding/store.ts',
        'src/app/router/*.{ts,tsx}',
        'src/shared/ui/Toast/Toast.tsx',
        'src/shared/ui/Icon/Icon.tsx',
        'src/shared/ui/AvatarUpload/AvatarUpload.tsx',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/mocks/**', 'src/**/*.d.ts'],
    },
  },
})
