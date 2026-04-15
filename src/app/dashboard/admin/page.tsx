import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, Search, ClipboardCheck, FileText } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { SubmissionStatus } from '@/lib/types'
import AdminFilters from './AdminFilters'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; from?: string; to?: string; type?: string }>
}

type UnifiedItem = {
  id: string
  type: 'checklist' | 'site_record'
  name: string
  email: string
  userName: string
  status: SubmissionStatus
  created_at: string
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Build submissions query
  let subQuery = supabase
    .from('submissions')
    .select('id, name, status, created_at, profiles:user_id (email, name)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    subQuery = subQuery.eq('status', params.status)
  }
  if (params.from) subQuery = subQuery.gte('created_at', params.from)
  if (params.to) subQuery = subQuery.lte('created_at', params.to + 'T23:59:59')

  // Build site records query
  let srQuery = supabase
    .from('site_records')
    .select('id, customer, status, created_at, profiles:user_id (email, name)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    srQuery = srQuery.eq('status', params.status)
  }
  if (params.from) srQuery = srQuery.gte('created_at', params.from)
  if (params.to) srQuery = srQuery.lte('created_at', params.to + 'T23:59:59')

  const [{ data: submissions }, { data: siteRecords }] = await Promise.all([
    subQuery,
    srQuery,
  ])

  // Unify into a single list
  const items: UnifiedItem[] = []

  type PartialRow = { id: string; name?: string; customer?: string; status: SubmissionStatus; created_at: string; profiles: { email: string; name: string }[] }

  if (params.type !== 'site_record') {
    ;((submissions || []) as PartialRow[]).forEach((s) => {
      items.push({
        id: s.id,
        type: 'checklist',
        name: s.name || 'Untitled',
        email: s.profiles?.[0]?.email || '',
        userName: s.profiles?.[0]?.name || '',
        status: s.status,
        created_at: s.created_at,
      })
    })
  }

  if (params.type !== 'checklist') {
    ;((siteRecords || []) as PartialRow[]).forEach((r) => {
      items.push({
        id: r.id,
        type: 'site_record',
        name: r.customer || 'Untitled',
        email: r.profiles?.[0]?.email || '',
        userName: r.profiles?.[0]?.name || '',
        status: r.status,
        created_at: r.created_at,
      })
    })
  }

  // Sort combined list by date
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Search filter
  let filtered = items
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.userName.toLowerCase().includes(q)
    )
  }

  // Stats
  const pending = items.filter((i) => i.status === 'pending').length
  const approved = items.filter((i) => i.status === 'approved').length
  const rejected = items.filter((i) => i.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-[#1B4332]" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-green-600">{approved}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-red-600">{rejected}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected</p>
        </div>
      </div>

      <AdminFilters />

      <div className="text-sm text-gray-600">
        Showing {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={
                item.type === 'checklist'
                  ? `/dashboard/admin/submission/${item.id}`
                  : `/dashboard/admin/site-record/${item.id}`
              }
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'checklist'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type === 'checklist' ? (
                      <ClipboardCheck className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.email || 'Unknown user'}
                      <span className="text-gray-400 mx-1">·</span>
                      <span className="text-gray-400">
                        {item.type === 'checklist' ? 'Checklist' : 'Site Record'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
