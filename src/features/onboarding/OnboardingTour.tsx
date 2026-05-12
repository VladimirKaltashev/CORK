import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { useOnboardingStore } from './store'
import { onboardingSteps } from './steps'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 8
const TOOLTIP_WIDTH = 320
const TOOLTIP_HEIGHT_ESTIMATE = 200

function getTargetRect(selector: string | null): Rect | null {
  if (!selector) return null
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export function OnboardingTour() {
  const { isActive, step, next, prev, finish } = useOnboardingStore()
  const [rect, setRect] = useState<Rect | null>(null)
  const current = onboardingSteps[step]
  const isLast = step === onboardingSteps.length - 1

  useLayoutEffect(() => {
    if (!isActive) return
    const update = () => setRect(getTargetRect(current.target))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isActive, current.target])

  if (!isActive) return null

  const tooltipStyle: CSSProperties = (() => {
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const spaceBelow = window.innerHeight - (rect.top + rect.height)
    const goesBelow = spaceBelow > TOOLTIP_HEIGHT_ESTIMATE + 24
    const top = goesBelow
      ? rect.top + rect.height + PAD + 12
      : Math.max(12, rect.top - TOOLTIP_HEIGHT_ESTIMATE - 12)
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - TOOLTIP_WIDTH - 12,
    )
    return { top, left }
  })()

  return (
    <>
      {rect ? (
        <>
          <div
            className="fixed inset-x-0 top-0 bg-black/60 z-[1000]"
            style={{ height: Math.max(0, rect.top - PAD) }}
          />
          <div
            className="fixed inset-x-0 bottom-0 bg-black/60 z-[1000]"
            style={{ top: rect.top + rect.height + PAD }}
          />
          <div
            className="fixed left-0 bg-black/60 z-[1000]"
            style={{
              top: rect.top - PAD,
              height: rect.height + PAD * 2,
              width: Math.max(0, rect.left - PAD),
            }}
          />
          <div
            className="fixed right-0 bg-black/60 z-[1000]"
            style={{
              top: rect.top - PAD,
              height: rect.height + PAD * 2,
              left: rect.left + rect.width + PAD,
            }}
          />
          <div
            className="fixed rounded-md pointer-events-none z-[1001]"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.9), 0 0 0 4px rgba(255, 255, 255, 0.4)',
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/60 z-[1000]" />
      )}

      <div
        className="fixed z-[1002] w-80 max-w-[calc(100vw-24px)] rounded-lg bg-white shadow-2xl p-4"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {step + 1} / {onboardingSteps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Пропустить
          </button>
        </div>
        <h3 className="text-base font-semibold text-gray-900">{current.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{current.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={prev}
            className="text-sm px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={isLast ? finish : next}
            className="text-sm px-4 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            {isLast ? 'Готово' : 'Дальше'}
          </button>
        </div>
      </div>
    </>
  )
}

export function OnboardingAutoStart() {
  const { isActive, start, shouldShow } = useOnboardingStore()

  useEffect(() => {
    if (isActive) return
    if (!shouldShow()) return
    const t = setTimeout(() => start(), 500)
    return () => clearTimeout(t)
  }, [isActive, start, shouldShow])

  return null
}
