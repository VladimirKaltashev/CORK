import type { Role } from '@/entities/auth'

const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  moderator: 2,
  teacher: 2,
  user: 1,
}

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole]
}
