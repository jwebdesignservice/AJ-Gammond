import { SubmissionStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: SubmissionStatus
}

const statusConfig: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
  needs_review: {
    label: 'Needs Review',
    className: 'bg-blue-100 text-blue-800',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-[4px] ${config.className}`}>
      {config.label}
    </span>
  )
}
