import { describe, expect, it } from 'vitest'
import { applyToggleLocally, computeBudgetDelta } from './store'
import { REACTION_COST, type ReactionAggregate } from './types'

const empty: ReactionAggregate = { crowns: 0, clowns: 0, myKind: null }

describe('applyToggleLocally', () => {
  it('ставит корону на пустую агрегацию', () => {
    expect(applyToggleLocally(empty, 'crown')).toEqual({ crowns: 1, clowns: 0, myKind: 'crown' })
  })

  it('ставит клоуна на пустую агрегацию', () => {
    expect(applyToggleLocally(empty, 'clown')).toEqual({ crowns: 0, clowns: 1, myKind: 'clown' })
  })

  it('повторное нажатие на тот же тип снимает реакцию', () => {
    const after = applyToggleLocally({ crowns: 3, clowns: 1, myKind: 'crown' }, 'crown')
    expect(after).toEqual({ crowns: 2, clowns: 1, myKind: null })
  })

  it('повторное нажатие на клоуна снимает клоуна', () => {
    const after = applyToggleLocally({ crowns: 0, clowns: 5, myKind: 'clown' }, 'clown')
    expect(after).toEqual({ crowns: 0, clowns: 4, myKind: null })
  })

  it('переключение с короны на клоуна', () => {
    const after = applyToggleLocally({ crowns: 2, clowns: 0, myKind: 'crown' }, 'clown')
    expect(after).toEqual({ crowns: 1, clowns: 1, myKind: 'clown' })
  })

  it('переключение с клоуна на корону', () => {
    const after = applyToggleLocally({ crowns: 1, clowns: 3, myKind: 'clown' }, 'crown')
    expect(after).toEqual({ crowns: 2, clowns: 2, myKind: 'crown' })
  })

  it('не трогает чужие реакции при постановке своей', () => {
    const prev: ReactionAggregate = { crowns: 5, clowns: 2, myKind: null }
    const after = applyToggleLocally(prev, 'crown')
    expect(after.crowns).toBe(6)
    expect(after.clowns).toBe(2)
  })
})

describe('computeBudgetDelta', () => {
  it('новая корона списывает 1', () => {
    expect(computeBudgetDelta(null, 'crown')).toBe(-REACTION_COST.crown)
  })

  it('новый клоун списывает 2', () => {
    expect(computeBudgetDelta(null, 'clown')).toBe(-REACTION_COST.clown)
  })

  it('повторное нажатие на корону возвращает 1 (откат)', () => {
    expect(computeBudgetDelta('crown', 'crown')).toBe(REACTION_COST.crown)
  })

  it('повторное нажатие на клоуна возвращает 2', () => {
    expect(computeBudgetDelta('clown', 'clown')).toBe(REACTION_COST.clown)
  })

  it('смена корона→клоун: возврат 1, списание 2 = -1', () => {
    expect(computeBudgetDelta('crown', 'clown')).toBe(REACTION_COST.crown - REACTION_COST.clown)
  })

  it('смена клоун→корона: возврат 2, списание 1 = +1', () => {
    expect(computeBudgetDelta('clown', 'crown')).toBe(REACTION_COST.clown - REACTION_COST.crown)
  })
})

describe('REACTION_COST', () => {
  it('крона = 1, клоун = 2', () => {
    expect(REACTION_COST.crown).toBe(1)
    expect(REACTION_COST.clown).toBe(2)
  })
})
