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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-md p-4"
        style={{ background: 'var(--cork-surface)', border: '1px solid var(--cork-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--cork-text)' }}>Отклонить достижение</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--cork-text-mute)' }}>«{achievement.title}»</p>
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
    <div className="mx-auto max-w-3xl py-6 px-3" style={{ color: 'var(--cork-text)' }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--cork-text)' }}>Админ-панель</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--cork-border)' }}>
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
                ? 'border-[var(--cork-brand)] text-[var(--cork-brand)]'
                : 'border-transparent hover:text-[var(--cork-text)]'
            }`}
            style={activeTab === tab ? {} : { color: 'var(--cork-text-dim)' }}
          >
            {tab === 'achievements' ? 'Достижения' : 'Челленджи'}
          </button>
        ))}
      </div>

      {activeTab === 'achievements' ? (
        <>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cork-text)' }}>
            Модерация достижений
            {!isLoading && (
              <span className="text-base font-normal ml-2" style={{ color: 'var(--cork-text-mute)' }}>({pending.length} на проверке)</span>
            )}
          </h2>

          {isLoading ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
          ) : pending.length === 0 ? (
            <div className="cork-empty">
              <span className="text-sm">Нет достижений на проверке</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((ach) => (
                <div key={ach.id} className="cork-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: 'var(--cork-text-dim)' }}>
                          <CategoryIcon category={ach.category} className="w-5 h-5" />
                        </span>
                        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--cork-text-mute)' }}>{ach.category}</span>
                        <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>· {ach.year}</span>
                      </div>
                      <h2 className="text-base font-semibold" style={{ color: 'var(--cork-text)' }}>{ach.title}</h2>
                      <p className="text-sm mt-1" style={{ color: 'var(--cork-text-dim)' }}>{ach.description}</p>

                      {ach.proofType === 'url' && ach.proofValue && (
                        <a
                          href={ach.proofValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cork-link text-xs mt-2 inline-block"
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
                        <span className="mt-2 inline-block text-xs" style={{ color: 'var(--cork-text-mute)' }}>Доказательства нет</span>
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cork-text)' }}>Управление челленджами</h2>

          {isLoadingChallenges ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
          ) : (
            <>
              {/* Challenges list */}
              <div className="flex flex-col gap-3 mb-6">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`cork-card cursor-pointer transition ${
                      selectedChallenge === challenge.id ? 'ring-1' : ''
                    }`}
                    style={selectedChallenge === challenge.id ? { borderColor: 'var(--cork-brand)', boxShadow: '0 0 0 1px var(--cork-brand)' } : {}}
                    onClick={() => loadSubmissionsForChallenge(challenge.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--cork-text)' }}>{challenge.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--cork-text-dim)' }}>
                          {challenge.status} · {challenge.goalType} ·{' '}
                          {new Date(challenge.startsAt).toLocaleDateString('ru')} –{' '}
                          {new Date(challenge.endsAt).toLocaleDateString('ru')}
                        </p>
                      </div>
                      <span className="text-sm" style={{ color: 'var(--cork-text-mute)' }}>{challenge.category ?? 'Без категории'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submissions for selected challenge */}
              {selectedChallenge && (
                <div>
                  <h3 className="font-bold text-md mb-3" style={{ color: 'var(--cork-text)' }}>Сабмиты</h3>
                  {allSubmissions.length === 0 ? (
                    <p className="text-center py-4" style={{ color: 'var(--cork-text-dim)' }}>Нет сабмитов</p>
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
