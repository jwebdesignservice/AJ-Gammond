import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, Search } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Submission, SubmissionStatus } from '@/lib/types'
import AdminFilters from './AdminFilters'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; from?: string; to?: string }>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Build query
  let query = supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (email, name)
    `)
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.from) {
    query = query.gte('created_at', params.from)
  }

  if (params.to) {
    query = query.lte('created_at', params.to + 'T23:59:59')
  }

  const { data: submissions } = await query

  // Filter by search if provided
  let filteredSubmissions = submissions || []
  if (params.search) {
    const search = params.search.toLowerCase()
    filteredSubmissions = filteredSubmissions.filter((s: Submission & { profiles?: { email: string; name: string } }) =>
      s.name?.toLowerCase().includes(search) ||
      s.profiles?.email?.toLowerCase().includes(search) ||
      s.profiles?.name?.toLowerCase().includes(search)
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-[#1B4332]" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <AdminFilters />

      <div className="text-sm text-gray-600">
        Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission: Submission & { profiles?: { email: string; name: string } }) => (
            <Link
              key={submission.id}
              href={`/dashboard/admin/submission/${submission.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-gray-900">{submission.name}</p>
                  <p className="text-sm text-gray-600">
                    {submission.profiles?.email || 'Unknown user'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(submission.created_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <StatusBadge status={submission.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
