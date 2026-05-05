import { http, HttpResponse } from 'msw'
import type { GlobalFeedEvent, LeaderboardEntry, Task, TaskComment, StudySession, UserStudyStatus, Subject, TaskPriority, Checkpoint, Achievement, AchievementCategory } from '@/shared/types'

// ── In-Memory DB ──
const getDb = () => {
  if (!(window as unknown as Record<string, unknown>).__APP_DB__) {
    (window as unknown as Record<string, unknown>).__APP_DB__ = {
      users: [
        { id: '1', name: 'Admin', email: 'admin@test.com', password: '123456', role: 'admin' },
        { id: '2', name: 'User', email: 'user@test.com', password: '123456', role: 'user' },
      ],
      sessions: [],
      posts: [],
      achievements: [],
      groups: [],
      tasks: [] as Task[],
      plannerSessions: [] as StudySession[],
      taskComments: {} as Record<string, TaskComment[]>,
      userStatuses: {} as Record<string, UserStudyStatus>,
      profileAchievements: [] as Achievement[],
    }
  }
  const db = (window as unknown as Record<string, unknown>).__APP_DB__ as Record<string, unknown>
  if (!db.tasks) db.tasks = []
  if (!db.plannerSessions) db.plannerSessions = []
  if (!db.taskComments) db.taskComments = {}
  if (!db.userStatuses) db.userStatuses = {}
  if (!db.profileAchievements) db.profileAchievements = []

  const profAch = db.profileAchievements as Achievement[]
  if (profAch.length === 0) {
    profAch.push(
      { id: 'a1', userId: '1', category: 'olympiad' as AchievementCategory, title: 'Победитель ВсОШ по математике', year: 2024, createdAt: new Date(2024, 10, 15).toISOString() },
      { id: 'a2', userId: '1', category: 'it' as AchievementCategory, title: 'Победитель хакатона HackRU', year: 2024, createdAt: new Date(2024, 8, 20).toISOString() },
      { id: 'a3', userId: '2', category: 'sport' as AchievementCategory, title: 'КМС по шахматам', year: 2023, createdAt: new Date(2023, 5, 10).toISOString() },
    )
  }

  // Seed default tasks once
  const tasks = db.tasks as Task[]
  if (tasks.length === 0) {
    const now = new Date()
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
    const in3 = new Date(now); in3.setDate(now.getDate() + 3)
    const overdue = new Date(now); overdue.setDate(now.getDate() - 2)
    const in7 = new Date(now); in7.setDate(now.getDate() + 7)
    tasks.push(
      { id: 't1', userId: '1', title: 'Решить задачи по геометрии', priority: 'high' as TaskPriority, deadline: tomorrow.toISOString(), subject: 'math' as Subject, completed: false, createdAt: now.toISOString(), commentsCount: 0 },
      { id: 't2', userId: '1', title: 'Прочитать параграф по физике', priority: 'medium' as TaskPriority, deadline: in3.toISOString(), subject: 'physics' as Subject, completed: false, createdAt: now.toISOString(), commentsCount: 0 },
      { id: 't3', userId: '1', title: 'Написать эссе по биологии', priority: 'low' as TaskPriority, deadline: overdue.toISOString(), subject: 'biology' as Subject, completed: true, createdAt: now.toISOString(), commentsCount: 2 },
      { id: 't4', userId: '1', title: 'Подготовить конспект по информатике', priority: 'medium' as TaskPriority, deadline: in7.toISOString(), subject: 'informatics' as Subject, completed: false, createdAt: now.toISOString(), commentsCount: 0 },
    )
    const tc = db.taskComments as Record<string, TaskComment[]>
    tc['t3'] = [
      { id: 'c1', taskId: 't3', text: 'Начал работу над черновиком', createdAt: new Date(now.getTime() - 3600000).toISOString(), userId: '1', userName: 'Admin' },
      { id: 'c2', taskId: 't3', text: 'Завершил первую часть', createdAt: now.toISOString(), userId: '1', userName: 'Admin' },
    ]
  }

  const plannerSessions = db.plannerSessions as StudySession[]
  if (plannerSessions.length === 0) {
    const base = new Date()
    const yesterday = new Date(base); yesterday.setDate(base.getDate() - 1)
    const twoDaysAgo = new Date(base); twoDaysAgo.setDate(base.getDate() - 2)
    plannerSessions.push(
      { id: 's1', userId: '1', subject: 'math' as Subject, durationSeconds: 3600, checkpoints: [] as Checkpoint[], report: 'Хорошая сессия', completedAt: yesterday.toISOString() },
      { id: 's2', userId: '1', subject: 'physics' as Subject, durationSeconds: 5400, checkpoints: [] as Checkpoint[], report: 'Изучил волновую оптику', completedAt: twoDaysAgo.toISOString() },
    )
  }

  return db
}

const getUserId = (request: Request) => {
  const auth = request.headers.get('Authorization') ?? ''
  return auth.startsWith('Bearer mock-token-') ? auth.replace('Bearer mock-token-', '') : '1'
}

export const handlers = [
  // ── Auth: Register ──
  http.post('/api/auth/register', async ({ request }) => {
    const db = getDb()
    const body = await request.json() as { name: string; email: string; password: string }
    const users = db.users as Array<{ id: string; name: string; email: string; password: string; role: string }>
    if (users.find((u) => u.email === body.email)) {
      return new HttpResponse(JSON.stringify({ message: 'Email занят' }), { status: 409 })
    }
    const newUser = { id: crypto.randomUUID(), name: body.name, email: body.email, password: body.password, role: 'user' as const, createdAt: new Date().toISOString() }
    users.push(newUser)
    return new HttpResponse(JSON.stringify({ token: `mock-token-${newUser.id}`, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }),

  // ── Auth: Login ──
  http.post('/api/auth/login', async ({ request }) => {
    const db = getDb()
    const body = await request.json() as { email: string; password: string }
    const users = db.users as Array<{ id: string; name: string; email: string; password: string; role: string }>
    const user = users.find((u) => u.email === body.email && u.password === body.password)
    if (!user) return new HttpResponse(JSON.stringify({ message: 'Неверный email или пароль' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    return new HttpResponse(JSON.stringify({ token: `mock-token-${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), { headers: { 'Content-Type': 'application/json' } })
  }),

  // ── Profile ──
  http.get('/api/profile/:id', ({ params }) => {
    const db = getDb()
    const users = db.users as Array<Record<string, unknown>>
    const user = users.find((u) => u.id === params.id)
    if (!user) return new HttpResponse(null, { status: 404 })
    const sessions = db.sessions as Array<Record<string, unknown>>
    const userSessions = sessions.filter((s) => s.authorId === user.id)
    const totalHours = userSessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0) / 60
    return new HttpResponse(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, goal: user.goal || 'Подготовиться к ВсОШ', avatar: user.avatar || null, stats: { totalSessions: userSessions.length, totalHours: Math.round(totalHours * 10) / 10, streak: user.streak || 0, achievements: user.achievementsCount || 0 }, sessions: userSessions, achievements: user.achievements || [] }), { headers: { 'Content-Type': 'application/json' } })
  }),

  // ── Sessions (Create) ──
  http.post('/api/sessions', async ({ request }) => {
    const db = getDb()
    const body = await request.json() as Record<string, unknown>
    const sessions = db.sessions as Array<Record<string, unknown>>
    const newSession = { id: crypto.randomUUID(), authorId: body.authorId || '1', title: body.title, subject: body.subject, date: body.date, durationMinutes: body.durationMinutes, createdAt: new Date().toISOString() }
    sessions.push(newSession)
    return new HttpResponse(JSON.stringify(newSession), { status: 201 })
  }),

  // ── Feed (Generic) ──
  http.get('/api/feed', ({ request }) => {
    const db = getDb()
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')
    interface DbItem { type: string; createdAt?: string; [key: string]: unknown }
    const sessions = db.sessions as Array<DbItem>
    const posts = db.posts as Array<DbItem>
    const allItems = [
      ...sessions.map((s): DbItem => ({ ...s, type: 'session' })),
      ...posts.map((p): DbItem => ({ ...p, type: 'post' })),
    ].sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
    const start = (page - 1) * limit
    return new HttpResponse(JSON.stringify({ data: allItems.slice(start, start + limit), hasMore: start + limit < allItems.length, total: allItems.length }), { headers: { 'Content-Type': 'application/json' } })
  }),

  // ── Posts (Create) ──
  http.post('/api/posts', async ({ request }) => {
    const db = getDb()
    const body = await request.json() as Record<string, unknown>
    const posts = db.posts as Array<Record<string, unknown>>
    const newPost = { id: crypto.randomUUID(), authorId: body.authorId || '1', content: body.content, createdAt: new Date().toISOString(), likes: [], comments: [] }
    posts.push(newPost)
    return new HttpResponse(JSON.stringify(newPost), { status: 201 })
  }),

  // ── Dashboard Stats ──
  http.get('/dashboard/stats', async () => {
    await new Promise((r) => setTimeout(r, 200))
    return HttpResponse.json({ totalSessions: 24, totalHours: 87, weekSessions: 5, weekHours: 12, currentStreak: 7, maxStreak: 14, goalProgress: 65, goalDescription: '100 часов по математике' })
  }),

  // ── Global Feed ──
  http.get('/feed/global', async ({ request }) => {
    await new Promise((r) => setTimeout(r, 300))
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const mockEvents: GlobalFeedEvent[] = [
      { id: '1', type: 'achievement_earned', userId: 'u1', userName: 'Алексей', data: { title: 'Победитель ВсОШ', description: 'Занял 1 место по экономике' }, createdAt: new Date().toISOString() },
      { id: '2', type: 'session_completed', userId: 'u2', userName: 'Мария', data: { title: 'Марафон бота', description: 'Завершила 50-часовую сессию' }, createdAt: new Date().toISOString() },
      { id: '3', type: 'milestone_reached', userId: 'u3', userName: 'Дмитрий', data: { title: '1000 часов', description: 'Достиг отметки в 1000 часов подготовки' }, createdAt: new Date().toISOString() },
    ]
    const start = (page - 1) * limit
    return HttpResponse.json({ items: mockEvents.slice(start, start + limit), total: mockEvents.length, page, hasMore: start + limit < mockEvents.length })
  }),

  // ── Leaderboard ──
  http.get('/leaderboard', async ({ request }) => {
    await new Promise((r) => setTimeout(r, 250))
    const url = new URL(request.url)
    const entries: LeaderboardEntry[] = [
      { rank: 1, userId: 'u1', userName: 'Иван Петров', score: 120, displayScore: '120ч', sessionsCount: 45, change: 'up' },
      { rank: 2, userId: 'u2', userName: 'Анна Сидорова', score: 115, displayScore: '115ч', sessionsCount: 40, change: 'same' },
      { rank: 3, userId: 'u3', userName: 'Петр Иванов', score: 98, displayScore: '98ч', sessionsCount: 35, change: 'down' },
      { rank: 4, userId: 'u4', userName: 'Елена Смирнова', score: 85, displayScore: '85ч', sessionsCount: 30, change: 'up' },
      { rank: 5, userId: 'u5', userName: 'Дмитрий Козлов', score: 72, displayScore: '72ч', sessionsCount: 25, change: 'same' },
    ]
    return HttpResponse.json({ entries, total: 50, subject: url.searchParams.get('subject'), period: url.searchParams.get('period') })
  }),

  // ── Achievement Verify ──
  http.post('/achievements/:id/verify', async ({ params, request }) => {
    await new Promise((r) => setTimeout(r, 300))
    const body = await request.json() as { verified: boolean }
    return HttpResponse.json({ success: true, achievement: { id: params.id, verified: body.verified ? 'verified' : 'rejected' } })
  }),

  // ── User Achievements ──
  http.get('/user/:id/achievements', async ({ params }) => {
    await new Promise((r) => setTimeout(r, 200))
    return HttpResponse.json({ achievements: [
      { id: '1', userId: params.id, title: 'Победитель ВсОШ', badge: 'gold', verified: 'verified', earnedAt: '2024-03-10', description: '1 место' },
      { id: '2', userId: params.id, title: '100 часов практики', badge: 'silver', verified: 'pending', earnedAt: '2024-04-01', description: 'Набрал 100 часов' },
    ] })
  }),

  // ── Extended Profile ──
  http.get('/profile/extended/:id', async () => {
    await new Promise((r) => setTimeout(r, 200))
    return HttpResponse.json({ userId: '1', bio: 'Увлекаюсь математикой и экономикой', socialLinks: { telegram: '@user', github: 'user' }, favoriteSubjects: ['math', 'physics'], monthlyGoal: { subject: 'math', targetHours: 50, currentHours: 32 } })
  }),

  // ── Planner: GET tasks ──
  http.get('http://127.0.0.1:8000/planner/tasks', ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const tasks = (db.tasks as Task[]).filter((t) => t.userId === userId || t.userId === '1')
    return HttpResponse.json({ tasks })
  }),

  // ── Planner: POST task ──
  http.post('http://127.0.0.1:8000/planner/tasks', async ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const body = await request.json() as Omit<Task, 'id' | 'userId' | 'createdAt' | 'commentsCount'>
    const users = db.users as Array<{ id: string; name: string }>
    const user = users.find((u) => u.id === userId)
    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: user?.id ?? '1',
      title: body.title,
      priority: body.priority,
      deadline: body.deadline,
      subject: body.subject,
      description: body.description,
      completed: false,
      createdAt: new Date().toISOString(),
      commentsCount: 0,
    };
    (db.tasks as Task[]).push(newTask)
    return new HttpResponse(JSON.stringify(newTask), { status: 201 })
  }),

  // ── Planner: PATCH task ──
  http.patch('http://127.0.0.1:8000/planner/tasks/:id', async ({ params, request }) => {
    const db = getDb()
    const body = await request.json() as Partial<Task>
    const tasks = db.tasks as Task[]
    const idx = tasks.findIndex((t) => t.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    tasks[idx] = { ...tasks[idx], ...body }
    return HttpResponse.json(tasks[idx])
  }),

  // ── Planner: GET task comments ──
  http.get('http://127.0.0.1:8000/planner/tasks/:id/comments', ({ params }) => {
    const db = getDb()
    const comments = (db.taskComments as Record<string, TaskComment[]>)[String(params.id)] ?? []
    return HttpResponse.json({ comments })
  }),

  // ── Planner: POST task comment ──
  http.post('http://127.0.0.1:8000/planner/tasks/:id/comments', async ({ params, request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const body = await request.json() as { text: string }
    const users = db.users as Array<{ id: string; name: string }>
    const user = users.find((u) => u.id === userId)
    const comment: TaskComment = {
      id: crypto.randomUUID(),
      taskId: String(params.id),
      text: body.text,
      createdAt: new Date().toISOString(),
      userId: user?.id ?? '1',
      userName: user?.name ?? 'User',
    }
    const tc = db.taskComments as Record<string, TaskComment[]>
    if (!tc[String(params.id)]) tc[String(params.id)] = []
    tc[String(params.id)].push(comment)
    // Update commentsCount
    const tasks = db.tasks as Task[]
    const task = tasks.find((t) => t.id === params.id)
    if (task) task.commentsCount = (task.commentsCount ?? 0) + 1
    return new HttpResponse(JSON.stringify(comment), { status: 201 })
  }),

  // ── Planner: POST session (complete timer) ──
  http.post('http://127.0.0.1:8000/planner/sessions', async ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const body = await request.json() as Omit<StudySession, 'id' | 'userId'>
    const session: StudySession = {
      id: crypto.randomUUID(),
      userId,
      subject: body.subject,
      durationSeconds: body.durationSeconds,
      checkpoints: body.checkpoints,
      report: body.report,
      completedAt: body.completedAt,
    };
    (db.plannerSessions as StudySession[]).push(session)
    return new HttpResponse(JSON.stringify(session), { status: 201 })
  }),

  // ── Planner: GET sessions ──
  http.get('http://127.0.0.1:8000/planner/sessions', ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const sessions = (db.plannerSessions as StudySession[]).filter((s) => s.userId === userId || s.userId === '1')
    return HttpResponse.json({ sessions })
  }),

  // ── User status: GET ──
  http.get('http://127.0.0.1:8000/user/:id/status', ({ params }) => {
    const db = getDb()
    const statuses = db.userStatuses as Record<string, UserStudyStatus>
    const status: UserStudyStatus = statuses[String(params.id)] ?? { status: 'online' }
    return HttpResponse.json(status)
  }),

  // ── User status: POST (update own status) ──
  http.post('http://127.0.0.1:8000/user/status', async ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const body = await request.json() as UserStudyStatus
    const statuses = db.userStatuses as Record<string, UserStudyStatus>
    statuses[userId] = body
    return HttpResponse.json(body)
  }),

  // ── Profile Achievements: GET /achievements/user/:userId ──
  http.get('http://127.0.0.1:8000/achievements/user/:userId', ({ params }) => {
    const db = getDb()
    const userId = String(params.userId)
    const all = db.profileAchievements as Achievement[]
    const result = all.filter((a) => a.userId === userId)
    return HttpResponse.json({ achievements: result })
  }),

  // ── Profile Achievements: POST /achievements ──
  http.post('http://127.0.0.1:8000/achievements', async ({ request }) => {
    const db = getDb()
    const userId = getUserId(request)
    const body = await request.json() as Omit<Achievement, 'id' | 'userId' | 'createdAt'>
    const newAch: Achievement = {
      id: crypto.randomUUID(),
      userId,
      category: body.category,
      title: body.title,
      year: body.year,
      proofImage: body.proofImage,
      createdAt: new Date().toISOString(),
    };
    (db.profileAchievements as Achievement[]).push(newAch)
    return new HttpResponse(JSON.stringify(newAch), { status: 201 })
  }),
]
