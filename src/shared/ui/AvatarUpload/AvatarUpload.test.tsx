import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarUpload } from './AvatarUpload'

describe('AvatarUpload', () => {
  it('renders avatar image when provided', () => {
    render(<AvatarUpload avatar="http://img" name="Test" onChange={vi.fn()} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renders initials when no avatar', () => {
    render(<AvatarUpload avatar={null} name="John Doe" onChange={vi.fn()} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders single initial for one word name', () => {
    render(<AvatarUpload avatar={null} name="John" onChange={vi.fn()} />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('does not render file input when not editable', () => {
    const { container } = render(<AvatarUpload avatar={null} name="Test" onChange={vi.fn()} editable={false} />)
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument()
  })
})
