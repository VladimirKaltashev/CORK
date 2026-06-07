import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFriendsStore, type FriendRecord } from '@/entities/friends'

type Tab = 'friends' | 'requests'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return avatar ? (
    <img
      src={avatar}
      alt={name}
      className="w-10 h-10 object-cover flex-shrink-0"
      style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border-light)' }}
    />
  ) : (
    <div
      className="cork-avatar"
      style={{ color: 'var(--cork-brand-ink)' }}
    >
      {getInitials(name)}
    </div>
  )
}

function FriendRow({ record }: { record: FriendRecord }) {
  const { removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)

  return (
    <div className="cork-user-card">
      <Link to={`/profile/${record.profile.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={record.profile.name} avatar={record.profile.avatar} />
        <span className="text-sm font-medium truncate" style={{ color: 'var(--cork-text)' }}>{record.profile.name}</span>
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await removeRecord(record.id) }
          finally { setBusy(false) }
        }}
        className="cork-btn cork-btn-ghost text-sm px-3 py-1 flex-shrink-0"
        style={{ letterSpacing: '0.02em', textTransform: 'none' }}
      >
        {busy ? '...' : 'Удалить'}
      </button>
    </div>
  )
}

function RequestRow({ record }: { record: FriendRecord }) {
  const { acceptRequest, removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)

  return (
    <div className="cork-user-card">
      <Link to={`/profile/${record.profile.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={record.profile.name} avatar={record.profile.avatar} />
        <span className="text-sm font-medium truncate" style={{ color: 'var(--cork-text)' }}>{record.profile.name}</span>
      </Link>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try { await acceptRequest(record.id) }
            finally { setBusy(false) }
          }}
          className="cork-btn cork-btn-primary text-sm px-3 py-1"
          style={{ letterSpacing: '0.02em', textTransform: 'none' }}
        >
          Принять
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try { await removeRecord(record.id) }
            finally { setBusy(false) }
          }}
          className="cork-btn cork-btn-ghost text-sm px-3 py-1"
          style={{ letterSpacing: '0.02em', textTransform: 'none' }}
        >
          Отклонить
        </button>
      </div>
    </div>
  )
}

export function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends')
  const { outgoing, incoming, isLoading } = useFriendsStore()

  const friends = [
    ...outgoing.filter((r) => r.status === 'accepted'),
    ...incoming.filter((r) => r.status === 'accepted'),
  ]
  const pendingRequests = incoming.filter((r) => r.status === 'pending')

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <h1 className="cork-head" style={{ marginBottom: '16px' }}>Друзья</h1>

      <div className="cork-tabs" style={{ marginBottom: '16px', borderBottom: '1px solid var(--cork-border-light)' }}>
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`cork-tab ${tab === 'friends' ? 'active' : ''}`}
        >
          Мои друзья
          {friends.length > 0 && (
            <span className="ml-1.5 text-xs" style={{ color: 'var(--cork-text-mute)' }}>({friends.length})</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`cork-tab relative ${tab === 'requests' ? 'active' : ''}`}
        >
          Входящие заявки
          {pendingRequests.length > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold w-4 h-4"
              style={{ background: 'var(--cork-clown)', color: '#fff' }}
            >
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <div className="cork-empty">
            Друзей пока нет. Найдите людей через поиск на ленте!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((r) => <FriendRow key={r.id} record={r} />)}
          </div>
        )
      ) : (
        pendingRequests.length === 0 ? (
          <div className="cork-empty">
            Новых заявок нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingRequests.map((r) => <RequestRow key={r.id} record={r} />)}
          </div>
        )
      )}
    </div>
  )
}
