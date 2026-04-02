import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Submission } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <Link href="/dashboard/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Checklist
        </Link>
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No submissions yet</p>
          <Link href="/dashboard/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Submit Your First Checklist
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission: Submission) => (
            <Link
              key={submission.id}
              href={`/dashboard/submission/${submission.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(submission.created_at).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted by {submission.name}
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
