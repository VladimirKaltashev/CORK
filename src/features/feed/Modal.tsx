import { useEffect, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { useModal } from './useModal'

interface ModalProps {
  name: string
  title: string
  children: ReactNode
}

export function Modal({ name, title, children }: ModalProps) {
  const { current, close } = useModal()
  const isOpen = current === name

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={close}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl p-6 shadow-xl',
          'max-h-[90vh] overflow-y-auto',
        )}
        style={{ background: 'var(--cork-surface)', border: '1px solid var(--cork-border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--cork-text)' }}>{title}</h2>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 transition-colors"
            style={{ color: 'var(--cork-text-mute)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cork-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cork-text-mute)')}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
