import { SubmissionStatus } from '@/lib/types'
import { AlertCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: SubmissionStatus
}

const statusConfig: Record<SubmissionStatus, { label: string; className: string; icon?: boolean }> = {
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  approved: {
    label: 'Accepted',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  rejected: {
    label: 'Needs Reviewing',
    className: 'bg-red-50 text-red-700 border border-red-200',
    icon: true,
  },
  needs_review: {
    label: 'Needs Reviewing',
    className: 'bg-red-50 text-red-700 border border-red-200',
    icon: true,
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[3px] ${config.className}`}>
      {config.icon && <AlertCircle className="w-3 h-3" />}
      {config.label}
    </span>
  )
}
