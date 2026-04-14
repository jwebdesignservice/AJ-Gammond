import { SubmissionStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: SubmissionStatus
}

const statusConfig: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  approved: {
    label: 'Accepted',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  needs_review: {
    label: 'Needs Review',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg ${config.className}`}>
      {config.label}
    </span>
  )
}
