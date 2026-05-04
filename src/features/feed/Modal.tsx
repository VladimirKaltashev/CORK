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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800',
          'max-h-[90vh] overflow-y-auto',
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
