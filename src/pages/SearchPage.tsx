import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TextInput } from '@primer/react'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useDebounce } from '@/shared/hooks'

interface UserResult {
  id: string
  name: string
  avatar: string | null
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function FriendButton({ targetId }: { targetId: string }) {
  const { getRelationship, sendRequest, acceptRequest, removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)

  const rel = getRelationship(targetId)

  if (!rel) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await sendRequest(targetId) }
          catch { /* shown by store */ }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Добавить'}
      </button>
    )
  }

  if (rel.direction === 'outgoing' && rel.record.status === 'pending') {
    return <span className="text-xs text-gray-400">Запрос отправлен</span>
  }

  if (rel.direction === 'incoming' && rel.record.status === 'pending') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await acceptRequest(rel.record.id) }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Принять'}
      </button>
    )
  }

  if (rel.record.status === 'accepted') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await removeRecord(rel.record.id) }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Удалить'}
      </button>
    )
  }

  return null
}

export function SearchPage() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim() || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }
    setIsSearching(true)
    supabase
      .from('profiles')
      .select('id, name, avatar')
      .ilike('name', `%${debouncedQuery.trim()}%`)
      .neq('id', user.id)
      .limit(20)
      .then(({ data, error }) => {
        if (error) { showToast('error', 'Ошибка поиска') }
        else { setResults((data ?? []).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar ?? null }))) }
        setIsSearching(false)
      })
  }, [debouncedQuery, user])

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Поиск пользователей</h1>

      <TextInput
        block
        placeholder="Введите имя..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-5"
      />

      {isSearching && (
        <div className="py-4 text-center text-sm text-gray-500">Поиск...</div>
      )}

      {!isSearching && query.trim() && results.length === 0 && (
        <div className="py-4 text-center text-sm text-gray-500">Никого не найдено</div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 border border-gray-300 rounded-md bg-white p-3">
              <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 truncate">{u.name}</span>
              </Link>
              <FriendButton targetId={u.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
