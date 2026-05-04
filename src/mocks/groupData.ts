import type { Group } from '@/entities/group/types'

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Математики ВсОШ',
    description: 'Группа для подготовки к всероссийской олимпиаде по математике',
    subject: 'Математика',
    memberCount: 42,
    isSubscribed: false,
    createdAt: '2025-09-01T00:00:00.000Z',
  },
  {
    id: 'g2',
    name: 'Физика — от школьника к призёру',
    description: 'Делимся разборами задач, конспектами и советами по олимпиадной физике',
    subject: 'Физика',
    memberCount: 27,
    isSubscribed: true,
    createdAt: '2025-10-15T00:00:00.000Z',
  },
  {
    id: 'g3',
    name: 'Информатика ICPC',
    description: 'Алгоритмы, структуры данных и подготовка к олимпиадному программированию',
    subject: 'Информатика',
    memberCount: 61,
    isSubscribed: false,
    createdAt: '2025-08-20T00:00:00.000Z',
  },
  {
    id: 'g4',
    name: 'Химия — региональный этап',
    description: 'Задачи, теория и практика олимпиадной химии',
    subject: 'Химия',
    memberCount: 18,
    isSubscribed: false,
    createdAt: '2025-11-01T00:00:00.000Z',
  },
  {
    id: 'g5',
    name: 'Биология и экология',
    description: 'Подготовка к олимпиадам по биологии и экологии всех уровней',
    subject: 'Биология',
    memberCount: 33,
    isSubscribed: true,
    createdAt: '2025-09-10T00:00:00.000Z',
  },
]
