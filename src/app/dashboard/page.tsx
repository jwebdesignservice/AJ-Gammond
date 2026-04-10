import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, ChevronRight, ClipboardCheck } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import DateFilter from '@/components/DateFilter'
import { Submission } from '@/lib/types'
import { Suspense } from 'react'

function getDateRange(filter: string): { from: string; to: string } | null {
  const now = new Date()
  if (filter === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (filter === 'week') {
    const start = new Date(now)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return { from: start.toISOString(), to: now.toISOString() }
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString(), to: now.toISOString() }
  }
  return null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const range = getDateRange(filter)
  if (range) {
    query = query.gte('created_at', range.from).lte('created_at', range.to)
  }

  const { data: submissions } = await query

  const filterLabel: Record<string, string> = {
    all: 'all time',
    today: 'today',
    week: 'this week',
    month: 'this month',
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          View and track all your submitted daily checklists
        </p>
      </div>

      {/* New checklist CTA */}
      <Link
        href="/dashboard/new"
        className="flex items-center gap-4 bg-[#1B4332] text-white rounded-2xl p-5 shadow-md hover:bg-[#2D6A4F] transition-colors"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base">Submit Today&apos;s Checklist</p>
          <p className="text-green-200 text-sm">Complete your daily safety &amp; machine checks</p>
        </div>
        <Plus className="w-5 h-5 flex-shrink-0" />
      </Link>

      {/* Filters */}
      <Suspense>
        <DateFilter />
      </Suspense>

      {/* Submissions list */}
      {!submissions || submissions.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            No submissions {filter !== 'all' ? `for ${filterLabel[filter]}` : 'yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {filter !== 'all'
              ? 'Try selecting a different date range above.'
              : 'Your submitted checklists will appear here after you complete your first one.'}
          </p>
          {filter === 'all' && (
            <Link href="/dashboard/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Submit First Checklist
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium px-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}{' '}
            {filter !== 'all' && `· ${filterLabel[filter]}`}
          </p>
          {submissions.map((submission: Submission) => (
            <Link
              key={submission.id}
              href={`/dashboard/submission/${submission.id}`}
              className="card-hover flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {new Date(submission.created_at).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(submission.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {submission.name ? ` · ${submission.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={submission.status} />
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
