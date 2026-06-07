import { describe, it, expect, beforeEach } from 'vitest'
import { useScoutStore } from './store'

describe('useScoutStore', () => {
  beforeEach(() => {
    useScoutStore.setState({ topScouts: [], scores: {}, loading: false })
  })

  it('initial state is empty', () => {
    const state = useScoutStore.getState()
    expect(state.topScouts).toEqual([])
    expect(state.scores).toEqual({})
    expect(state.loading).toBe(false)
  })

  it('setScore stores scout score for user', () => {
    useScoutStore.setState({
      scores: {
        'u1': {
          userId: 'u1',
          userName: 'Вася',
          avatar: null,
          submittedCount: 3,
          scoutScore: 42,
          crownsBrought: 5,
          clownsBrought: 2,
          commentsBrought: 8,
        },
      },
    })
    const s = useScoutStore.getState().scores['u1']
    expect(s).toBeDefined()
    expect(s!.scoutScore).toBe(42)
    expect(s!.submittedCount).toBe(3)
  })
})
