import { useState } from 'react'

interface StylePreview {
  name: string
  className: string
  description: string
}

const STYLES: StylePreview[] = [
  {
    name: '1. Retro Wave',
    className: 'retrowave-section',
    description: 'Неоновый футуризм. Фиолетовый + розовый glow, 80-е эстетика, monospace шрифт.',
  },
  {
    name: '2. Volcanic',
    className: 'volcanic-section',
    description: 'Тёмно-красный + огонь. Градиент красный → оранжевый, агрессивный стиль.',
  },
  {
    name: '3. Abyssal',
    className: 'abyssal-section',
    description: 'Глубокий океан. Тёмно-синий + бирюзовый, glassmorphism, медузы.',
  },
  {
    name: '4. Matrix',
    className: 'matrix-section',
    description: 'Зелёный хакер. Чёрный + ядовито-зелёный, scanlines, глитч.',
  },
  {
    name: '5. Cherry Blossom',
    className: 'cherry-section',
    description: 'Розовая неоновая. Тёмно-фиолетовый + розовый, аниме-эстетика.',
  },
  {
    name: '6. Storm',
    className: 'storm-section',
    description: 'Штормовой серый + жёлтый. Молния, дождь, тревожно-крутой.',
  },
  {
    name: '7. Coral',
    className: 'coral-section',
    description: 'Коралловый + чёрный. Геометрия, треугольники, Among Us стиль.',
  },
  {
    name: '8. Cyber Grid',
    className: 'cyber-section',
    description: 'Бирюзовый + кибер. Сетка 3D, Tron, голографический.',
  },
  {
    name: '9. Blood Orange',
    className: 'blood-section',
    description: 'Оранжевый + кровавый. Красно-оранжевый градиент, Call of Duty.',
  },
  {
    name: '10. Midnight Gold',
    className: 'gold-section',
    description: 'Чёрный + золото + фиолетовый. Градиент золотой → фиолетовый, королевский.',
  },
]

function PreviewCard({ style }: { style: StylePreview }) {
  const [inputValue, setInputValue] = useState('')

  return (
    <section className={`preview-section ${style.className}`}>
      <h2 className="preview-title">{style.name}</h2>
      <p className="preview-text max-w-md text-center">{style.description}</p>

      <div className="preview-card">
        <h3 className="preview-heading">Card Component</h3>
        <span className="preview-badge">Active Status</span>
        <p className="preview-text">
          Это пример карточки с текстом. Здесь может быть описание достижения, челленджа или профиля.
        </p>
        <input
          type="text"
          className="preview-input"
          placeholder="Введите текст..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="button" className="preview-btn">
          Кнопка действия
        </button>
      </div>
    </section>
  )
}

export function DesignPreviewPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Выбор дизайн-концепции
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          10 ярких стилей. Выберите один — реализуем для всего приложения.
        </p>
      </div>

      <div className="flex flex-col gap-0">
        {STYLES.map((style) => (
          <PreviewCard key={style.className} style={style} />
        ))}
      </div>
    </div>
  )
}
