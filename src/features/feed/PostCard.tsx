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

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          {author.name[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{author.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{date}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.content}</p>

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <button
          type="button"
          onClick={handleLike}
          disabled={!user}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            isLiked
              ? 'text-rose-500 dark:text-rose-400'
              : 'text-gray-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400',
            !user && 'cursor-default opacity-50',
          )}
        >
          {isLiked ? '❤️' : '🤍'}
          <span>{data.likes.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors dark:text-gray-500 dark:hover:text-indigo-400"
        >
          💬 <span>{data.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2">
          {data.comments.map((c) => (
            <div key={c.id} className="flex gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">{c.author.name}:</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{c.content}</span>
            </div>
          ))}

          {user && (
            <div className="flex gap-2 pt-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComment() }}
                placeholder="Написать комментарий..."
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={isCommenting || !commentText.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
