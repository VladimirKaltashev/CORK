import { claimTypeEmoji, claimTypeLabel, shouldShowClaimBadgeParts } from '../display'
import type { ClaimType } from '../types'

interface ClaimBadgeProps {
  type: ClaimType
  subjectName?: string
  thread?: string
  className?: string
}

export function ClaimBadge({ type, subjectName, thread, className }: ClaimBadgeProps) {
  if (!shouldShowClaimBadgeParts(type, subjectName, thread)) return null

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${className ?? ''}`} style={{ color: 'var(--cork-text-mute)' }}>
      <span>{claimTypeEmoji(type)} {claimTypeLabel(type)}</span>
      {subjectName && (
        <>
          <span>·</span>
          <span>о: {subjectName}</span>
        </>
      )}
      {thread && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ background: 'var(--cork-surface-2)', color: 'var(--cork-text-mute)' }}>
          # {thread}
        </span>
      )}
    </div>
  )
}
