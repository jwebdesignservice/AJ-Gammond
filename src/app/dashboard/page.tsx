import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, ChevronRight, ClipboardCheck, ClipboardList } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import DateFilter from '@/components/DateFilter'
import { Submission, SiteRecord } from '@/lib/types'
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
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
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

type CombinedEntry =
  | { type: 'checklist'; data: Submission }
  | { type: 'site_record'; data: SiteRecord }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const range = getDateRange(filter)

  // Fetch checklists
  let checklistQuery = supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  if (range) {
    checklistQuery = checklistQuery.gte('created_at', range.from).lte('created_at', range.to)
  }

  // Fetch site records
  let siteRecordQuery = supabase
    .from('site_records')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  if (range) {
    siteRecordQuery = siteRecordQuery.gte('created_at', range.from).lte('created_at', range.to)
  }

  const [{ data: submissions }, { data: siteRecords }] = await Promise.all([
    checklistQuery,
    siteRecordQuery,
  ])

  // Combine and sort by date
  const combined: CombinedEntry[] = [
    ...(submissions || []).map((s: Submission) => ({ type: 'checklist' as const, data: s })),
    ...(siteRecords || []).map((r: SiteRecord) => ({ type: 'site_record' as const, data: r })),
  ].sort((a, b) =>
    new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )

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
          Submit and track your daily checklists and site record sheets
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/new"
          className="flex items-center gap-4 bg-[#1B4332] text-white rounded-2xl p-5 shadow-md hover:bg-[#2D6A4F] transition-colors"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">Daily Checklist</p>
            <p className="text-green-200 text-sm">Safety &amp; machine checks</p>
          </div>
          <Plus className="w-5 h-5 flex-shrink-0" />
        </Link>

        <Link
          href="/dashboard/site-record"
          className="flex items-center gap-4 bg-[#1B4332] text-white rounded-2xl p-5 shadow-md hover:bg-[#2D6A4F] transition-colors"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">Site Record Sheet</p>
            <p className="text-green-200 text-sm">Work records &amp; measurements</p>
          </div>
          <Plus className="w-5 h-5 flex-shrink-0" />
        </Link>
      </div>

      {/* Filters */}
      <Suspense>
        <DateFilter />
      </Suspense>

      {/* Combined submissions list */}
      {combined.length === 0 ? (
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
              : 'Your submitted forms will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium px-1">
            {combined.length} submission{combined.length !== 1 ? 's' : ''}{' '}
            {filter !== 'all' && `· ${filterLabel[filter]}`}
          </p>
          {combined.map((entry) => {
            const isChecklist = entry.type === 'checklist'
            const href = isChecklist
              ? `/dashboard/submission/${entry.data.id}`
              : `/dashboard/site-record/${entry.data.id}`

            return (
              <Link
                key={`${entry.type}-${entry.data.id}`}
                href={href}
                className="card-hover flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {isChecklist
                    ? <ClipboardCheck className="w-5 h-5 text-gray-500" />
                    : <ClipboardList className="w-5 h-5 text-gray-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {isChecklist ? 'Checklist' : 'Site Record'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(entry.data.created_at).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(entry.data.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {!isChecklist && (entry.data as SiteRecord).customer
                      ? ` · ${(entry.data as SiteRecord).customer}`
                      : isChecklist && (entry.data as Submission).name
                      ? ` · ${(entry.data as Submission).name}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={entry.data.status} />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
