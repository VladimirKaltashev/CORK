import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFriendsStore, type FriendRecord } from '@/entities/friends'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function RequestRow({ record }: { record: FriendRecord }) {
  const { acceptRequest, removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 border border-gray-300 rounded-md bg-white p-3">
      <Link to={`/profile/${record.profile.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        {record.profile.avatar ? (
          <img src={record.profile.avatar} alt={record.profile.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {getInitials(record.profile.name)}
          </div>
        )}
        <span className="text-sm font-medium text-gray-900 truncate">{record.profile.name}</span>
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
          className="text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
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
          className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          Отклонить
        </button>
      </div>
    </div>
  )
}

export function FriendRequestsPage() {
  const { incoming, isLoading } = useFriendsStore()
  const pendingRequests = incoming.filter((r) => r.status === 'pending')

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Входящие заявки
        {pendingRequests.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold w-5 h-5">
            {pendingRequests.length}
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Загрузка...</div>
      ) : pendingRequests.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-md py-8 text-center">
          <span className="text-sm text-gray-500">Новых заявок нет</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingRequests.map((r) => <RequestRow key={r.id} record={r} />)}
        </div>
      )}
    </div>
  )
}
