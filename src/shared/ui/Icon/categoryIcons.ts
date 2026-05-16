import {
  BooksIcon,
  ClapperboardIcon,
  CupIcon,
  FootballIcon,
  JoystickIcon,
  PaletteIcon,
  ShineIcon,
} from './icons'
import type { AchievementCategory } from '@/shared/types'

type IconComponent = typeof CupIcon

export const CATEGORY_ICON: Record<AchievementCategory, IconComponent> = {
  olympiad: CupIcon,
  academic: BooksIcon,
  it: JoystickIcon,
  creative: PaletteIcon,
  sport: FootballIcon,
  movies: ClapperboardIcon,
  games: JoystickIcon,
  other: ShineIcon,
}
