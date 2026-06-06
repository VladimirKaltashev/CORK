import type { ChallengeSubmission } from '@/shared/types'

interface SubmissionCardProps {
  submission: ChallengeSubmission
  onDelete?: (id: string) => void
  isAdmin?: boolean
}

export function SubmissionCard({ submission, onDelete, isAdmin }: SubmissionCardProps) {
  return (
    <div className="cork-card" style={{ padding: '12px' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: 'var(--cork-text)' }}>{submission.userName ?? 'Аноним'}</span>
          <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>
            {new Date(submission.submittedAt).toLocaleDateString('ru')}
          </span>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(submission.id)}
            className="text-sm hover:underline"
            style={{ color: 'var(--cork-clown)' }}
          >
            Удалить
          </button>
        )}
      </div>

      <p className="mt-1 text-sm" style={{ color: 'var(--cork-text)' }}>{submission.description}</p>

      {submission.value !== null && submission.value !== undefined && (
        <span className="inline-block mt-1 text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--cork-king)' }}>
          +{submission.value}
        </span>
      )}

      {submission.proofValue && (
        <div className="mt-2">
          {submission.proofType === 'photo' ? (
            <img
              src={submission.proofValue}
              alt="Доказательство"
              className="max-w-xs max-h-32 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <a
              href={submission.proofValue}
              target="_blank"
              rel="noopener noreferrer"
              className="cork-link text-sm"
            >
              Ссылка на доказательство
            </a>
          )}
        </div>
      )}
    </div>
  )
}
