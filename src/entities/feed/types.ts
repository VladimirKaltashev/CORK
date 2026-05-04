export interface Author {
  id: string
  name: string
  role: string
}

export interface Comment {
  id: string
  author: Author
  content: string
  createdAt: string
}

export interface Session {
  id: string
  title: string
  subject: string
  date: string
  hours: number
  olympiadId?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  place: number
  olympiadName: string
}

export interface Post {
  id: string
  content: string
  likes: string[]
  comments: Comment[]
}

export type FilterType = 'all' | 'session' | 'achievement' | 'post'

export type FeedItem =
  | { id: string; type: 'session'; createdAt: string; author: Author; data: Session }
  | { id: string; type: 'achievement'; createdAt: string; author: Author; data: Achievement }
  | { id: string; type: 'post'; createdAt: string; author: Author; data: Post }
