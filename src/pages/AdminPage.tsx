import { useEffect, useState } from 'react'
import { Button, FormControl, Textarea } from '@primer/react'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { achievementToClaim, ClaimBadge } from '@/entities/claims'
import { CategoryIcon } from '@/shared/ui'
import type { Achievement } from '@/shared/types'

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
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--cork-text)' }}>Отклонить заявку</h2>
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
  const [pending, setPending] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<Achievement | null>(null)

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
      showToast('error', 'Не удалось загрузить заявки')
    } finally {
      setIsLoading(false)
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
    showToast('success', 'Заявка подтверждена')
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
    showToast('success', 'Заявка отклонена')
  }

  return (
    <div className="mx-auto max-w-3xl py-6 px-3" style={{ color: 'var(--cork-text)' }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--cork-text)' }}>Админ-панель</h1>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cork-text)' }}>
        Модерация заявок
        {!isLoading && (
          <span className="text-base font-normal ml-2" style={{ color: 'var(--cork-text-mute)' }}>({pending.length} на проверке)</span>
        )}
      </h2>

      {isLoading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
      ) : pending.length === 0 ? (
        <div className="cork-empty">
          <span className="text-sm">Нет заявок на проверке</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((ach) => {
            const claim = achievementToClaim(ach)
            return (
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
                  <ClaimBadge type={claim.type} subjectName={claim.subjectName} thread={claim.thread} className="mb-1" />
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
          )
          })}
        </div>
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