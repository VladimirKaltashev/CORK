import { useState } from 'react'
import { api } from '@/shared/lib/api'
import { useAuthStore } from '@/entities/auth'
import { useFeedStore } from '@/entities/feed'
import type { FeedItem } from '@/entities/feed/types'
import { cn } from '@/shared/lib/cn'

type Props = Extract<FeedItem, { type: 'post' }>

export function PostCard({ id, author, data, createdAt }: Props) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const { user } = useAuthStore()
  const { optimisticLike, revertLike, addComment } = useFeedStore()

  const date = new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const isLiked = user ? data.likes.includes(user.id) : false

  const handleLike = async () => {
    if (!user) return
    const prevLikes = [...data.likes]
    optimisticLike(id, user.id)
    try {
      await api.post(`/likes/${id}`)
    } catch {
      revertLike(id, prevLikes)
    }
  }

  const handleComment = async () => {
    if (!user || !commentText.trim()) return
    const comment = {
      id: crypto.randomUUID(),
      author: { id: user.id, name: user.name, role: user.role },
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    }
    addComment(id, comment)
    setCommentText('')
    setIsCommenting(true)
    try {
      await api.post('/comments', { postId: id, content: comment.content })
    } finally {
      setIsCommenting(false)
    }
  }

  const likeStyle = isLiked ? { color: '#f43f5e' } : { color: 'var(--cork-text-mute)' }

  return (
    <article className="cork-card" style={{ padding: '16px' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'var(--cork-brand-2)', color: 'var(--cork-text)' }}>
          {author.name[0]}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--cork-text)' }}>{author.name}</p>
          <p className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{date}</p>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--cork-text)' }}>{data.content}</p>

      <div className="mt-3 flex items-center gap-4 border-t pt-3" style={{ borderColor: 'var(--cork-border-light)' }}>
        <button
          type="button"
          onClick={handleLike}
          disabled={!user}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            !user && 'cursor-default opacity-50',
          )}
          style={likeStyle}
        >
          {isLiked ? '❤️' : '🤍'}
          <span>{data.likes.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--cork-text-mute)' }}
        >
          💬 <span>{data.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2">
          {data.comments.map((c) => (
            <div key={c.id} className="flex gap-2 rounded-lg p-2" style={{ background: 'var(--cork-surface-2)' }}>
              <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--cork-text-dim)' }}>{c.author.name}:</span>
              <span className="text-xs" style={{ color: 'var(--cork-text-dim)' }}>{c.content}</span>
            </div>
          ))}

          {user && (
            <div className="flex gap-2 pt-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComment() }}
                placeholder="Написать комментарий..."
                className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-[var(--cork-brand)]"
                style={{ background: 'var(--cork-surface-2)', color: 'var(--cork-text)', borderColor: 'var(--cork-border)' }}
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={isCommenting || !commentText.trim()}
                className="cork-btn-primary text-xs px-3 py-1.5"
              >
                Отправить
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
