import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { MemoryRouterProps } from 'react-router-dom'
import { render } from '@testing-library/react'

export function renderWithProviders(
  ui: ReactNode,
  options: { router?: MemoryRouterProps } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter {...(options.router || {})}>{children}</MemoryRouter>
  )
  return render(ui, { wrapper: Wrapper })
}
