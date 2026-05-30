import type { ChallengeSubmission } from '@/shared/types'

interface SubmissionCardProps {
  submission: ChallengeSubmission
  onDelete?: (id: string) => void
  isAdmin?: boolean
}

export function SubmissionCard({ submission, onDelete, isAdmin }: SubmissionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{submission.userName ?? 'Аноним'}</span>
          <span className="text-xs text-gray-500">
            {new Date(submission.submittedAt).toLocaleDateString('ru')}
          </span>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(submission.id)}
            className="text-red-500 text-sm hover:text-red-700"
          >
            Удалить
          </button>
        )}
      </div>

      <p className="mt-1 text-sm">{submission.description}</p>

      {submission.value !== null && submission.value !== undefined && (
        <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
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
              className="text-blue-500 text-sm underline"
            >
              Ссылка на доказательство
            </a>
          )}
        </div>
      )}
    </div>
  )
}
