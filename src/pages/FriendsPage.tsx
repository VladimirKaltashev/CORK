import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFriendsStore, type FriendRecord } from '@/entities/friends'

type Tab = 'friends' | 'requests'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return avatar ? (
    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {getInitials(name)}
    </div>
  )
}

function FriendRow({ record }: { record: FriendRecord }) {
  const { removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 border border-gray-300 rounded-md bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <Link to={`/profile/${record.profile.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={record.profile.name} avatar={record.profile.avatar} />
        <span className="text-sm font-medium text-gray-900 truncate dark:text-white">{record.profile.name}</span>
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await removeRecord(record.id) }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors flex-shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
    <div className="flex items-center justify-between gap-3 border border-gray-300 rounded-md bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <Link to={`/profile/${record.profile.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={record.profile.name} avatar={record.profile.avatar} />
        <span className="text-sm font-medium text-gray-900 truncate dark:text-white">{record.profile.name}</span>
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
          className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-400"
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
          className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
      <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Друзья</h1>

      <div className="flex border-b border-gray-200 mb-4 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'friends'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Мои друзья
          {friends.length > 0 && (
            <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({friends.length})</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'requests'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Входящие заявки
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold w-4 h-4">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md py-8 text-center dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Друзей пока нет. Найдите людей через поиск на ленте!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((r) => <FriendRow key={r.id} record={r} />)}
          </div>
        )
      ) : (
        pendingRequests.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md py-8 text-center dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Новых заявок нет</span>
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
