import { describe, it, expect, beforeEach } from 'vitest'
import { useChallengesStore } from '@/entities/challenges'

beforeEach(() => {
  useChallengesStore.getState().reset()
})

describe('ChallengesStore (integration)', () => {
  it('loads challenges from MSW', async () => {
    await useChallengesStore.getState().loadChallenges()
    const { challenges } = useChallengesStore.getState()
    expect(challenges.length).toBeGreaterThan(0)
    expect(challenges.some((c) => c.status === 'active')).toBe(true)
  })

  it('loads active challenge', async () => {
    await useChallengesStore.getState().loadActiveChallenge()
    const { activeChallenge } = useChallengesStore.getState()
    expect(activeChallenge).not.toBeNull()
    expect(activeChallenge?.status).toBe('active')
  })

  it('loads challenge details', async () => {
    const store = useChallengesStore.getState()
    await store.loadChallenges()
    const { challenges } = useChallengesStore.getState()
    expect(challenges.length).toBeGreaterThan(0)
    const first = challenges[0]
    await store.loadChallenge(first.id)
    const { currentChallenge } = useChallengesStore.getState()
    expect(currentChallenge).not.toBeNull()
    expect(currentChallenge?.id).toBe(first.id)
  })

  it('loads submissions for a challenge', async () => {
    const store = useChallengesStore.getState()
    await store.loadChallenges()
    const active = store.challenges.find((c) => c.status === 'active')
    if (!active) return
    await store.loadSubmissions(active.id)
    const { submissions } = useChallengesStore.getState()
    expect(submissions.length).toBeGreaterThan(0)
  })

  it('loads leaderboard for a challenge', async () => {
    const store = useChallengesStore.getState()
    await store.loadChallenges()
    const active = store.challenges.find((c) => c.status === 'active')
    if (!active) return
    await store.loadLeaderboard(active.id)
    const { leaderboard } = useChallengesStore.getState()
    expect(leaderboard.length).toBeGreaterThan(0)
    // Should be sorted by totalProgress descending
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i - 1].totalProgress).toBeGreaterThanOrEqual(leaderboard[i].totalProgress)
    }
  })

  it('submits progress and updates leaderboard', async () => {
    const store = useChallengesStore.getState()
    await store.loadChallenges()
    const active = store.challenges.find((c) => c.status === 'active')
    if (!active) return

    await store.loadSubmissions(active.id)
    const beforeCount = store.submissions.length

    await store.submitProgress(active.id, {
      proofType: 'text',
      proofValue: 'Тестовый сабмит',
      value: 42,
      description: 'Тест',
    })

    await store.loadSubmissions(active.id)
    const afterCount = useChallengesStore.getState().submissions.length
    expect(afterCount).toBe(beforeCount + 1)
  })

  it('resets state', async () => {
    await useChallengesStore.getState().loadChallenges()
    useChallengesStore.getState().reset()
    const { challenges, activeChallenge } = useChallengesStore.getState()
    expect(challenges).toEqual([])
    expect(activeChallenge).toBeNull()
  })
})
