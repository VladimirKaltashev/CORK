export type Subject = 'math' | 'physics' | 'informatics' | 'chemistry' | 'biology';

export interface SubjectProgress {
  subject: Subject;
  displayName: string;
  hours: number;
  goal: number;
  sessionsCount: number;
  icon: string;
}

export interface DashboardStats {
  totalSessions: number;
  totalHours: number;
  weekSessions: number;
  weekHours: number;
  currentStreak: number;
  maxStreak: number;
  goalProgress: number;
  goalDescription: string;
}

export type BadgeType = 'gold' | 'silver' | 'bronze' | 'certificate' | 'participation';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface VerifiedAchievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  badge: BadgeType;
  subject?: Subject;
  verified: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  earnedAt: string;
  proofUrl?: string;
}

export type GlobalFeedEventType = 'achievement_earned' | 'achievement_verified' | 'session_completed' | 'milestone_reached';

export interface GlobalFeedEvent {
  id: string;
  type: GlobalFeedEventType;
  userId: string;
  userName: string;
  userAvatar?: string;
  data: {
    title: string;
    description: string;
    link?: string;
  };
  createdAt: string;
  likes?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  displayScore: string;
  sessionsCount: number;
  change?: 'up' | 'down' | 'same';
}

export interface LeaderboardQuery {
  subject: Subject;
  period: 'week' | 'month' | 'all';
  limit?: number;
}

export interface SocialLinks {
  telegram?: string;
  github?: string;
  vk?: string;
}

export interface ExtendedUserProfile {
  userId: string;
  bio?: string;
  socialLinks?: SocialLinks;
  favoriteSubjects: Subject[];
  monthlyGoal?: {
    subject: Subject;
    targetHours: number;
    currentHours: number;
  };
}

export type AchievementCategory = 'olympiad' | 'academic' | 'it' | 'creative' | 'sport' | 'movies' | 'games' | 'other'
export type AchievementStatus = 'pending' | 'verified' | 'rejected'
export type ProofType = 'photo' | 'url' | 'none'
export type ClaimAngle = 'king' | 'clown' | 'judge'

export interface Achievement {
  id: string
  userId: string
  category: AchievementCategory
  title: string
  description: string
  year: number
  proofType: ProofType
  proofValue?: string
  status: AchievementStatus
  claimAngle?: ClaimAngle
  rejectionReason?: string
  meta: Record<string, unknown>
  createdAt: string
}

export type CommentSide = 'crown' | 'clown' | 'neutral'

export interface Comment {
  id: string
  achievementId: string
  userId: string
  userName?: string
  userAvatar?: string | null
  body: string
  side: CommentSide
  createdAt: string
  updatedAt?: string
}

export type TaskPriority = 'high' | 'medium' | 'low'

export interface TaskComment {
  id: string
  taskId: string
  text: string
  createdAt: string
  userId: string
  userName: string
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: TaskPriority
  deadline: string
  subject?: Subject
  completed: boolean
  createdAt: string
  commentsCount?: number
}

export interface Checkpoint {
  id: string
  elapsedSeconds: number
  text: string
}

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface StudySession {
  id: string
  userId: string
  subject: Subject
  durationSeconds: number
  checkpoints: Checkpoint[]
  report: string
  completedAt: string
}

export type UserStatusType = 'online' | 'working' | 'offline'

export interface UserStudyStatus {
  status: UserStatusType
  subject?: Subject
  since?: string
}

// ─── Weekly Challenges ───

export type GoalType = 'distance' | 'count' | 'hours' | 'boolean'
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'cancelled'
export type ChallengeBadgeType = 'king_week' | 'clown_week' | 'king_month' | 'clown_month'

export interface ProofConfig {
  fields: ('photo' | 'url' | 'text' | 'value')[]
  valueLabel?: string
  valueRequired?: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: AchievementCategory | null
  goalType: GoalType
  unit: string | null
  proofConfig: ProofConfig
  startsAt: string
  endsAt: string
  status: ChallengeStatus
  createdBy: string
  createdAt: string
  // computed
  participantCount?: number
  myProgress?: number
  mySubmissions?: ChallengeSubmission[]
}

export interface ChallengeSubmission {
  id: string
  challengeId: string
  userId: string
  proofType: ProofType
  proofValue: string
  value: number | null
  description: string
  submittedAt: string
  // joined
  userName?: string
  userAvatar?: string
}

export interface ChallengeBadge {
  id: string
  userId: string
  type: ChallengeBadgeType
  label: string
  challengeId: string | null
  challengeTitle?: string
  awardedAt: string
}