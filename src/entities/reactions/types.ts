export type ReactionKind = 'crown' | 'clown'

export const REACTION_COST: Record<ReactionKind, number> = {
  crown: 1,
  clown: 2,
}

export interface ReactionAggregate {
  crowns: number
  clowns: number
  myKind: ReactionKind | null
}
