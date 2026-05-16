import { CATEGORY_ICON } from './categoryIcons'
import type { AchievementCategory } from '@/shared/types'

interface CategoryIconProps {
  category: AchievementCategory
  className?: string
}

export function CategoryIcon({ category, className = 'w-5 h-5' }: CategoryIconProps) {
  const Component = CATEGORY_ICON[category]
  return <Component className={className} />
}
