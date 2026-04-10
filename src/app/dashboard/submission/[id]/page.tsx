import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, ImageIcon, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Submission, SubmissionNote, FormData, CheckItem, DayOfWeek, CheckValue } from '@/lib/types'

// Resolve a CheckItem's value for display (handles both new and legacy formats)
function resolveValue(item: CheckItem): CheckValue {
  if (item.value !== undefined) return item.value ?? null
  if (item.values) {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    for (const day of [...days].reverse()) {
      if (item.values[day] !== null) return item.values[day]
    }
  }
  return null
}

function ChecklistReadOnly({ title, items }: { title: string; items: CheckItem[] }) {
  return (
    <div className="card">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-1">
        {items.map((item) => {
          const value = resolveValue(item)
          return (
            <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <span className="text-sm text-gray-700 flex-1 pr-4">{item.label}</span>
              <div className="flex-shrink-0">
                {value === 'yes' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5" /> Yes
                  </span>
                )}
                {value === 'no' && (
                  <span className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                    <XCircle className="w-5 h-5" /> No
                  </span>
                )}
                {value === null && (
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    <MinusCircle className="w-4 h-4" /> —
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (!submission) notFound()

  const { data: notes } = await supabase
    .from('submission_notes')
    .select(`*, profiles:admin_id (email)`)
    .eq('submission_id', id)
    .order('created_at', { ascending: false })

  const formData = submission.form_data as FormData

  const submittedDate = new Date(submission.created_at).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const submittedTime = new Date(submission.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{submittedDate}</h1>
          <p className="text-sm text-gray-500">Submitted at {submittedTime} by {submission.name}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {/* Checklists */}
      <ChecklistReadOnly title="Site Induction & Safety" items={formData.siteInduction} />
      <ChecklistReadOnly title="Machine Daily Checks" items={formData.machineChecks} />

      {/* Additional info */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">Additional Information</h3>

        {formData.comment ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Comment / Fault Description
            </p>
            <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm leading-relaxed">
              {formData.comment}
            </p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">No faults or comments reported</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</p>
            <p className="text-gray-900 font-medium">{submission.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signature</p>
            <p className="text-gray-900 font-serif italic text-lg">{submission.signature}</p>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {submission.media_urls && submission.media_urls.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            Attachments ({submission.media_urls.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {submission.media_urls.map((url: string, index: number) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square bg-gray-100 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
              >
                {url.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      {notes && notes.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            Admin Notes
          </h3>
          <div className="space-y-3">
            {notes.map((note: SubmissionNote & { profiles?: { email: string } }) => (
              <div key={note.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-800 text-sm leading-relaxed">{note.note}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {note.profiles?.email} &middot;{' '}
                  {new Date(note.created_at).toLocaleDateString('en-GB', {
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
