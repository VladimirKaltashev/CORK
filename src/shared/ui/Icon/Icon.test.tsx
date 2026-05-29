import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CategoryIcon } from './Icon'
import type { AchievementCategory } from '@/shared/types'

vi.mock('./categoryIcons', () => ({
  CATEGORY_ICON: {
    olympiad: ({ className }: { className?: string }) => <svg className={className} data-testid="olympiad" />,
    academic: ({ className }: { className?: string }) => <svg className={className} data-testid="academic" />,
    it: ({ className }: { className?: string }) => <svg className={className} data-testid="it" />,
    creative: ({ className }: { className?: string }) => <svg className={className} data-testid="creative" />,
    sport: ({ className }: { className?: string }) => <svg className={className} data-testid="sport" />,
    movies: ({ className }: { className?: string }) => <svg className={className} data-testid="movies" />,
    games: ({ className }: { className?: string }) => <svg className={className} data-testid="games" />,
    other: ({ className }: { className?: string }) => <svg className={className} data-testid="other" />,
  },
}))

describe('CategoryIcon', () => {
  const categories: AchievementCategory[] = ['olympiad', 'academic', 'it', 'creative', 'sport', 'movies', 'games', 'other']

  it('renders all category icons', () => {
    categories.forEach((cat) => {
      const { container } = render(<CategoryIcon category={cat} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<CategoryIcon category="sport" className="w-8 h-8" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('w-8')).toBe(true)
    expect(svg?.classList.contains('h-8')).toBe(true)
  })
})
