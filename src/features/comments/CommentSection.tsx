import { useState, useEffect } from 'react'
import { useCommentsStore } from '@/entities/comments'
import { useAuthStore } from '@/entities/auth'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Comment, CommentSide } from '@/shared/types'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

const SIDE_META: Record<CommentSide, { label: string; emoji: string; color: string }> = {
  crown:   { label: 'За корону', emoji: '👑', color: 'var(--cork-king)' },
  clown:   { label: 'За клоуна', emoji: '🤡', color: 'var(--cork-clown)' },
  neutral: { label: 'Нейтрально', emoji: '⚖️', color: 'var(--cork-text-mute)' },
}

function SideBadge({ side }: { side: CommentSide }) {
  const meta = SIDE_META[side]
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: meta.color }}>
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  )
}

function CommentItem({ comment, isOwn, onDelete }: { comment: Comment; isOwn: boolean; onDelete: () => void }) {
  const time = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })
  return (
    <div className="flex gap-2 py-2" style={{ borderBottom: '1px solid var(--cork-border-light)' }}>
      {comment.userAvatar ? (
        <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 object-cover flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border-light)' }} />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', background: 'var(--cork-surface-3)', color: 'var(--cork-brand)' }}>
          {getInitials(comment.userName ?? '')}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: 'var(--cork-text)' }}>{comment.userName}</span>
          <SideBadge side={comment.side} />
          <span className="text-[10px]" style={{ color: 'var(--cork-text-mute)' }}>{time}</span>
        </div>
        <p className="text-sm mt-0.5" style={{ color: 'var(--cork-text-dim)' }}>{comment.body}</p>
        {isOwn && (
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] mt-1"
            style={{ color: 'var(--cork-clown)' }}
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  )
}

interface CommentSectionProps {
  achievementId: string
  currentUserReaction?: 'crown' | 'clown' | null
}

export function CommentSection({ achievementId, currentUserReaction }: CommentSectionProps) {
  const { user } = useAuthStore()
  const { byAchievement, loading, loadComments, addComment, deleteComment, getCount } = useCommentsStore()
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const derivedSide: CommentSide =
    currentUserReaction === 'crown' ? 'crown'
    : currentUserReaction === 'clown' ? 'clown'
    : 'neutral'

  const comments = byAchievement[achievementId] ?? []
  const isLoading = loading[achievementId] ?? false
  const count = getCount(achievementId)

  useEffect(() => {
    if (expanded && comments.length === 0 && !isLoading) {
      loadComments(achievementId)
    }
  }, [expanded, achievementId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!text.trim() || !user) return
    setSubmitting(true)
    await addComment(achievementId, text, derivedSide)
    setText('')
    setSubmitting(false)
  }

  const positionLabel =
    derivedSide === 'crown' ? '👑 За корону'
    : derivedSide === 'clown' ? '🤡 За клоуна'
    : '⚖️ Нейтрально'

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="cork-btn-ghost text-sm px-2 py-1"
        style={{ letterSpacing: '0.02em', textTransform: 'none' }}
      >
        <span>💬</span>
        {count === 0 ? (
          <span>Нет аргументов</span>
        ) : (
          <>
            <span>Аргументы</span>
            <span className="ml-1 text-xs font-semibold" style={{ color: 'var(--cork-brand)' }}>{count}</span>
          </>
        )}
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--cork-border-light)' }}>
          {/* Comment list */}
          {isLoading && comments.length === 0 ? (
            <div className="text-sm py-2" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm py-2" style={{ color: 'var(--cork-text-mute)' }}>
              Нет аргументов. Будь первым.
            </div>
          ) : (
            <div>
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isOwn={c.userId === user?.id}
                  onDelete={() => deleteComment(achievementId, c.id)}
                />
              ))}
            </div>
          )}

          {/* Add form */}
          {user && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--cork-border-light)' }}>
              {/* Position indicator */}
              <div className="mb-2 text-xs font-semibold" style={{ color: 'var(--cork-text-dim)' }}>
                Твоя позиция: <span style={{ color: SIDE_META[derivedSide].color }}>{positionLabel}</span>
                {derivedSide === 'neutral' && (
                  <span className="block mt-0.5 font-normal" style={{ color: 'var(--cork-text-mute)' }}>
                    Чтобы спорить за корону или клоуна — сначала вынеси вердикт.
                  </span>
                )}
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                rows={2}
                placeholder="Добавь аргумент. Почему корона, клоун или спорно?"
                className="w-full resize-none rounded px-2 py-1 text-sm outline-none"
                style={{ border: '1px solid var(--cork-border)', background: 'var(--cork-surface-2)', color: 'var(--cork-text)' }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>
                  {500 - text.length}
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!text.trim() || submitting}
                  className="cork-btn cork-btn-primary text-sm px-3 py-1"
                  style={{ letterSpacing: '0.02em', textTransform: 'none' }}
                >
                  {submitting ? 'Отправка...' : 'Ответить'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
