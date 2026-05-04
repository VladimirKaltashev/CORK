import type { Session, Achievement } from '@/entities/feed/types'

export interface ProfileStats {
  totalHours: number
  totalSessions: number
  streak: number
  achievementCount: number
}

export interface Profile {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  goal: string
  stats: ProfileStats
  sessions: Session[]
  achievements: Achievement[]
}

export interface SearchUser {
  id: string
  name: string
  role: string
  email: string
}
