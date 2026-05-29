import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastContainer } from './Toast'
import { useToastStore } from '@/shared/lib/toast'

describe('ToastContainer', () => {
  it('renders empty when no toasts', () => {
    useToastStore.setState({ toasts: [] })
    render(<ToastContainer />)
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })

  it('renders toasts', () => {
    useToastStore.setState({
      toasts: [
        { id: '1', type: 'success', message: 'Done' },
        { id: '2', type: 'error', message: 'Fail' },
      ],
    })
    render(<ToastContainer />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Fail')).toBeInTheDocument()
  })

  it('closes toast on click', () => {
    useToastStore.setState({
      toasts: [{ id: '1', type: 'info', message: 'Hello' }],
    })
    render(<ToastContainer />)
    const closeBtn = screen.getByLabelText('Закрыть')
    closeBtn.click()
    expect(useToastStore.getState().toasts.length).toBe(0)
  })
})
