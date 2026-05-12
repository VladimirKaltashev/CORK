export interface OnboardingStep {
  target: string | null
  title: string
  description: string
}

export const onboardingSteps: OnboardingStep[] = [
  {
    target: null,
    title: 'Добро пожаловать! 👋',
    description:
      'Это соцсеть, где школьники делятся своими достижениями — олимпиадами, спортом, творчеством и не только. Покажу основное за полминуты.',
  },
  {
    target: '[data-onboard="feed"]',
    title: 'Лента',
    description:
      'Здесь видны достижения других ребят. Можно фильтровать по категориям и переключаться между всеми и только друзьями.',
  },
  {
    target: '[data-onboard="friends"]',
    title: 'Друзья и поиск',
    description:
      'Ищи людей и принимай заявки в друзья. Достижения друзей будут отдельной вкладкой в ленте.',
  },
  {
    target: '[data-onboard="profile"]',
    title: 'Твой профиль',
    description:
      'Через аватар попадаешь в свой профиль — там добавляются достижения, контакты и видна твоя страница.',
  },
]
