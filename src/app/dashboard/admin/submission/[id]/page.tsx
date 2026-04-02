import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Image as ImageIcon, User } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import ChecklistGrid from '@/components/ChecklistGrid'
import { FormData, SubmissionNote } from '@/lib/types'
import AdminActions from './AdminActions'

export default async function AdminSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Get submission with user info
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (email, name)
    `)
    .eq('id', id)
    .single()

  if (!submission) {
    notFound()
  }

  // Get notes
  const { data: notes } = await supabase
    .from('submission_notes')
    .select(`
      *,
      admin:admin_id (email)
    `)
    .eq('submission_id', id)
    .order('created_at', { ascending: false })

  const formData = submission.form_data as FormData

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Review Submission</h1>
          <p className="text-sm text-gray-600">
            {new Date(submission.created_at).toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{submission.profiles?.name || submission.name}</p>
          <p className="text-sm text-gray-600">{submission.profiles?.email}</p>
        </div>
      </div>

      <ChecklistGrid
        title="Site Induction & Safety"
        items={formData.siteInduction}
        onUpdate={() => {}}
        readOnly
      />

      <ChecklistGrid
        title="Machine Daily Checks"
        items={formData.machineChecks}
        onUpdate={() => {}}
        readOnly
      />

      <div className="card space-y-4">
        <h3 className="font-semibold text-lg text-gray-900">Additional Information</h3>
        
        {formData.comment && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Comment / Fault Description</p>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-[4px]">{formData.comment}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Name</p>
            <p className="text-gray-900">{submission.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Signature</p>
            <p className="text-gray-900 font-serif italic text-lg">{submission.signature}</p>
          </div>
        </div>
      </div>

      {submission.media_urls && submission.media_urls.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Attachments ({submission.media_urls.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {submission.media_urls.map((url: string, index: number) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square bg-gray-100 rounded-[4px] overflow-hidden hover:opacity-90 transition-opacity"
              >
                {url.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      <AdminActions submissionId={id} currentStatus={submission.status} />

      {notes && notes.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notes History
          </h3>
          <div className="space-y-3">
            {notes.map((note: SubmissionNote & { admin?: { email: string } }) => (
              <div key={note.id} className="bg-gray-50 p-3 rounded-[4px]">
                <p className="text-gray-700">{note.note}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {note.admin?.email} • {new Date(note.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
