import type { FeedItem } from '@/entities/feed/types'

const ADMIN = { id: '100', name: 'Алина Смирнова', role: 'admin' }
const TEACHER = { id: '101', name: 'Борис Козлов', role: 'teacher' }
const USER = { id: '1', name: 'Иван Петров', role: 'user' }

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'f1', type: 'post', createdAt: daysAgo(0), author: USER,
    data: { id: 'p1', content: 'Решил сегодня 15 задач по комбинаторике — наконец-то понял принцип Дирихле 🎯', likes: ['100'], comments: [] },
  },
  {
    id: 'f2', type: 'session', createdAt: daysAgo(0), author: USER,
    data: { id: 's1', title: 'Тренировка: Комбинаторика', subject: 'Математика', date: dateStr(0), hours: 3 },
  },
  {
    id: 'f3', type: 'achievement', createdAt: daysAgo(1), author: USER,
    data: { id: 'a1', title: 'Победитель регионального этапа', description: 'Первое место по математике среди 9-11 классов', place: 1, olympiadName: 'ВсОШ 2026' },
  },
  {
    id: 'f4', type: 'post', createdAt: daysAgo(1), author: TEACHER,
    data: { id: 'p2', content: 'Опубликован разбор задач регионального этапа. Ссылка в профиле.', likes: ['1', '100'], comments: [
      { id: 'c1', author: USER, content: 'Спасибо большое!', createdAt: daysAgo(1) },
    ]},
  },
  {
    id: 'f5', type: 'session', createdAt: daysAgo(2), author: USER,
    data: { id: 's2', title: 'Разбор олимпиадных задач', subject: 'Физика', date: dateStr(2), hours: 2 },
  },
  {
    id: 'f6', type: 'achievement', createdAt: daysAgo(3), author: TEACHER,
    data: { id: 'a2', title: 'Призёр муниципального этапа', description: 'Второе место по физике', place: 2, olympiadName: 'ВсОШ 2026' },
  },
  {
    id: 'f7', type: 'post', createdAt: daysAgo(3), author: ADMIN,
    data: { id: 'p3', content: 'Напоминаем: регистрация на школьный этап ВсОШ открыта до 15 мая!', likes: ['1', '101'], comments: [] },
  },
  {
    id: 'f8', type: 'session', createdAt: daysAgo(4), author: USER,
    data: { id: 's3', title: 'Геометрия: метод координат', subject: 'Математика', date: dateStr(4), hours: 4 },
  },
  {
    id: 'f9', type: 'session', createdAt: daysAgo(5), author: TEACHER,
    data: { id: 's4', title: 'Механика: законы Ньютона', subject: 'Физика', date: dateStr(5), hours: 2 },
  },
  {
    id: 'f10', type: 'post', createdAt: daysAgo(6), author: USER,
    data: { id: 'p4', content: 'Прошёл пробный вариант заключительного этапа. Результат: 72/100. Есть куда расти!', likes: [], comments: [] },
  },
  {
    id: 'f11', type: 'achievement', createdAt: daysAgo(7), author: USER,
    data: { id: 'a3', title: 'Победитель школьного этапа', description: 'Третье место по информатике', place: 3, olympiadName: 'ВсОШ 2026' },
  },
  {
    id: 'f12', type: 'session', createdAt: daysAgo(7), author: USER,
    data: { id: 's5', title: 'Алгоритмы: динамическое программирование', subject: 'Информатика', date: dateStr(7), hours: 5 },
  },
  {
    id: 'f13', type: 'post', createdAt: daysAgo(8), author: TEACHER,
    data: { id: 'p5', content: 'Собрали подборку задач для самостоятельной работы перед заключительным этапом.', likes: ['1'], comments: [
      { id: 'c2', author: USER, content: 'Очень пригодится!', createdAt: daysAgo(8) },
      { id: 'c3', author: ADMIN, content: 'Добавим в расписание подготовки.', createdAt: daysAgo(7) },
    ]},
  },
  {
    id: 'f14', type: 'session', createdAt: daysAgo(10), author: USER,
    data: { id: 's6', title: 'Тренировка: Теория чисел', subject: 'Математика', date: dateStr(10), hours: 3 },
  },
  {
    id: 'f15', type: 'achievement', createdAt: daysAgo(12), author: USER,
    data: { id: 'a4', title: 'Диплом II степени', description: 'Второе место на городской олимпиаде по математике', place: 2, olympiadName: 'Городская олимпиада 2026' },
  },
  {
    id: 'f16', type: 'session', createdAt: daysAgo(14), author: TEACHER,
    data: { id: 's7', title: 'Задачи на неравенства', subject: 'Математика', date: dateStr(14), hours: 2 },
  },
  {
    id: 'f17', type: 'post', createdAt: daysAgo(15), author: ADMIN,
    data: { id: 'p6', content: 'Поздравляем всех призёров и победителей регионального этапа!', likes: ['1', '101', '100'], comments: [] },
  },
  {
    id: 'f18', type: 'session', createdAt: daysAgo(16), author: USER,
    data: { id: 's8', title: 'Оптика и волновые явления', subject: 'Физика', date: dateStr(16), hours: 3 },
  },
  {
    id: 'f19', type: 'session', createdAt: daysAgo(18), author: USER,
    data: { id: 's9', title: 'Сортировки и структуры данных', subject: 'Информатика', date: dateStr(18), hours: 4 },
  },
  {
    id: 'f20', type: 'achievement', createdAt: daysAgo(20), author: TEACHER,
    data: { id: 'a5', title: 'Победитель олимпиады "Курчатов"', description: 'Первое место по физике', place: 1, olympiadName: 'Курчатов 2025' },
  },
  {
    id: 'f21', type: 'post', createdAt: daysAgo(21), author: USER,
    data: { id: 'p7', content: 'Написал шпаргалку по тригонометрическим тождествам. Кому нужна — пишите.', likes: ['101'], comments: [] },
  },
  {
    id: 'f22', type: 'session', createdAt: daysAgo(25), author: USER,
    data: { id: 's10', title: 'Графы: обходы и кратчайшие пути', subject: 'Информатика', date: dateStr(25), hours: 6 },
  },
  {
    id: 'f23', type: 'session', createdAt: daysAgo(30), author: USER,
    data: { id: 's11', title: 'Вероятность и статистика', subject: 'Математика', date: dateStr(30), hours: 2 },
  },
  {
    id: 'f24', type: 'achievement', createdAt: daysAgo(35), author: USER,
    data: { id: 'a6', title: 'Призёр олимпиады МФТИ', description: 'Третье место по математике', place: 3, olympiadName: 'МФТИ Олимп 2025' },
  },
  {
    id: 'f25', type: 'session', createdAt: daysAgo(40), author: TEACHER,
    data: { id: 's12', title: 'Термодинамика: первое начало', subject: 'Физика', date: dateStr(40), hours: 3 },
  },
]
