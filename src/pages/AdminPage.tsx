import { useEffect, useState } from 'react'
import { Button, FormControl, Textarea } from '@primer/react'
import { api } from '@/shared/lib/api'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { CategoryIcon } from '@/shared/ui'
import { useChallengesStore } from '@/entities/challenges'
import { SubmissionCard } from '@/features/challenges'
import type { Achievement, Challenge, ChallengeSubmission } from '@/shared/types'

function RejectModal({
  achievement,
  onConfirm,
  onClose,
}: {
  achievement: Achievement
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Укажите причину отклонения'); return }
    setLoading(true)
    try {
      await onConfirm(reason.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-md border border-gray-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Отклонить достижение</h2>
        <p className="text-sm text-gray-500 mb-4">«{achievement.title}»</p>
        <form onSubmit={handleSubmit}>
          <FormControl required>
            <FormControl.Label>Причина отклонения</FormControl.Label>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError('') }}
              rows={3}
              placeholder="Укажите причину..."
              className="w-full"
              validationStatus={error ? 'error' : undefined}
            />
            {error && <FormControl.Validation variant="error">{error}</FormControl.Validation>}
          </FormControl>
          <div className="flex gap-2 mt-4">
            <Button type="button" onClick={onClose} className="flex-1">Отмена</Button>
            <Button type="submit" variant="danger" disabled={loading} className="flex-1">
              {loading ? 'Отклонение...' : 'Отклонить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'achievements' | 'challenges'>('achievements')
  const [pending, setPending] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<Achievement | null>(null)

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [allSubmissions, setAllSubmissions] = useState<ChallengeSubmission[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false)

  const { deleteSubmission } = useChallengesStore()

  const loadPending = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      setPending(
        (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          category: row.category,
          title: row.title,
          description: row.description,
          year: row.year,
          proofType: row.proof_type,
          proofValue: row.proof_value ?? undefined,
          status: row.status,
          rejectionReason: row.rejection_reason ?? undefined,
          meta: row.meta ?? {},
          createdAt: row.created_at,
        }))
      )
    } catch {
      showToast('error', 'Не удалось загрузить достижения')
    } finally {
      setIsLoading(false)
    }
  }

  const loadChallenges = async () => {
    setIsLoadingChallenges(true)
    try {
      const response = await api.get<{ challenges: Challenge[] }>('/challenges')
      setChallenges(response.data.challenges)
    } catch {
      showToast('error', 'Не удалось загрузить челленджи')
    } finally {
      setIsLoadingChallenges(false)
    }
  }

  const loadSubmissionsForChallenge = async (challengeId: string) => {
    try {
      const response = await api.get<{ submissions: ChallengeSubmission[] }>(`/challenges/${challengeId}/submissions/all`)
      setAllSubmissions(response.data.submissions)
      setSelectedChallenge(challengeId)
    } catch {
      showToast('error', 'Не удалось загрузить сабмиты')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPending()
  }, [])

  const handleVerify = async (id: string) => {
    const { error } = await supabase
      .from('achievements')
      .update({ status: 'verified' })
      .eq('id', id)
    if (error) {
      showToast('error', 'Не удалось подтвердить')
      return
    }
    setPending((prev) => prev.filter((a) => a.id !== id))
    showToast('success', 'Достижение подтверждено')
  }

  const handleReject = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('achievements')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
    if (error) {
      showToast('error', 'Не удалось отклонить')
      return
    }
    setPending((prev) => prev.filter((a) => a.id !== id))
    setRejectTarget(null)
    showToast('success', 'Достижение отклонено')
  }

  return (
    <div className="mx-auto max-w-3xl py-6 px-3 dark:text-white">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Админ-панель</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['achievements', 'challenges'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'challenges') loadChallenges()
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'achievements' ? 'Достижения' : 'Челленджи'}
          </button>
        ))}
      </div>

      {activeTab === 'achievements' ? (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">
            Модерация достижений
            {!isLoading && (
              <span className="text-base font-normal text-gray-400 ml-2">({pending.length} на проверке)</span>
            )}
          </h2>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Загрузка...</div>
          ) : pending.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-md py-10 text-center dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Нет достижений на проверке</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((ach) => (
                <div key={ach.id} className="border border-gray-300 rounded-md bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryIcon category={ach.category} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="text-xs text-gray-400 uppercase tracking-wide dark:text-gray-400">{ach.category}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-400">· {ach.year}</span>
                      </div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{ach.title}</h2>
                      <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">{ach.description}</p>

                      {ach.proofType === 'url' && ach.proofValue && (
                        <a
                          href={ach.proofValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Доказательство (ссылка) →
                        </a>
                      )}
                      {ach.proofType === 'photo' && ach.proofValue && (
                        <img
                          src={ach.proofValue}
                          alt="Доказательство"
                          className="mt-2 h-28 w-auto rounded object-cover"
                        />
                      )}
                      {ach.proofType === 'none' && (
                        <span className="mt-2 inline-block text-xs text-gray-400 dark:text-gray-500">Доказательства нет</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button variant="primary" onClick={() => handleVerify(ach.id)}>
                        Подтвердить
                      </Button>
                      <Button variant="danger" onClick={() => setRejectTarget(ach)}>
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Управление челленджами</h2>

          {isLoadingChallenges ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>
          ) : (
            <>
              {/* Challenges list */}
              <div className="flex flex-col gap-3 mb-6">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`border rounded-md bg-white p-4 cursor-pointer transition dark:bg-gray-800 ${
                      selectedChallenge === challenge.id
                        ? 'border-indigo-500 ring-1 ring-indigo-500'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'
                    }`}
                    onClick={() => loadSubmissionsForChallenge(challenge.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold dark:text-white">{challenge.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {challenge.status} · {challenge.goalType} ·{' '}
                          {new Date(challenge.startsAt).toLocaleDateString('ru')} –{' '}
                          {new Date(challenge.endsAt).toLocaleDateString('ru')}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400 dark:text-gray-500">{challenge.category ?? 'Без категории'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submissions for selected challenge */}
              {selectedChallenge && (
                <div>
                  <h3 className="font-bold text-md mb-3 dark:text-white">Сабмиты</h3>
                  {allSubmissions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 dark:text-gray-400">Нет сабмитов</p>
                  ) : (
                    <div className="space-y-3">
                      {allSubmissions.map((sub) => (
                        <SubmissionCard
                          key={sub.id}
                          submission={sub}
                          isAdmin
                          onDelete={async (id) => {
                            await deleteSubmission(id)
                            await loadSubmissionsForChallenge(selectedChallenge)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {rejectTarget && (
        <RejectModal
          achievement={rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
