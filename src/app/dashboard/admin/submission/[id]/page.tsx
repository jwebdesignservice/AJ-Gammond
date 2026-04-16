import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image as ImageIcon } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { FormData, CheckItem, CheckValue, DayOfWeek } from '@/lib/types'
import AdminActions from './AdminActions'
import DownloadPdfButton from '@/components/DownloadPdfButton'

function legacyValue(values: Record<DayOfWeek, CheckValue>): CheckValue {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  for (const day of [...days].reverse()) {
    if (values[day] !== null) return values[day]
  }
  return null
}

function resolveValue(item: CheckItem): CheckValue {
  if (item.value !== undefined) return item.value
  if (item.values) return legacyValue(item.values)
  return null
}

export default async function AdminSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900"><span className="text-[#1B4332]">AJ Gammond Ltd</span> Review Submission</h1>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {submittedDate} at {submittedTime}
            </p>
          </div>
        </div>
        <DownloadPdfButton contentId="pdf-content" filename={`checklist-${submission.name || id}`} fullWidth />
      </div>

      <div id="pdf-content" className="bg-white p-4 sm:p-6 border border-gray-200 rounded-[3px]">
        {/* PDF Header */}
        <div className="border-b-2 border-[#1B4332] pb-4 mb-6">
          <h2 className="text-xl font-bold text-[#1B4332] uppercase tracking-wide">AJ Gammond Ltd — Daily Checklist Report</h2>
          <p className="text-sm text-gray-500 mt-1">Reference: {id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Submission Info */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide">Submission Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted By</p>
              <p className="text-gray-900 font-medium mt-0.5">{submission.profiles?.name || submission.name}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-gray-900 mt-0.5 break-all">{submission.profiles?.email || '—'}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Submitted</p>
              <p className="text-gray-900 mt-0.5">{submittedDate}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
              <p className="text-gray-900 mt-0.5">{submittedTime}</p>
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide">Job Information</h3>
          </div>
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</p>
            <p className="text-gray-900 font-medium mt-0.5">{formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contractor</p>
              <p className="text-gray-900 font-medium mt-0.5">{formData.contractor || '—'}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Site Address</p>
              <p className="text-gray-900 font-medium mt-0.5">{formData.siteAddress || '—'}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Machine Type</p>
              <p className="text-gray-900 font-medium mt-0.5">{formData.machineType || '—'}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Machine Code</p>
              <p className="text-gray-900 font-medium mt-0.5">{formData.machineCode || '—'}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Site Induction & Safety */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 1 — Site Induction &amp; Safety</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Check Item</th>
                <th className="text-center px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {formData.siteInduction.map((item, i) => {
                const val = resolveValue(item)
                return (
                  <tr key={item.id} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2.5 text-gray-700">{item.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      {val === 'yes' && <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">YES</span>}
                      {val === 'no' && <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">NO</span>}
                      {val === null && <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Section 2: Machine Daily Checks */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 2 — Machine Daily Checks</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Check Item</th>
                <th className="text-center px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {formData.machineChecks.map((item, i) => {
                const val = resolveValue(item)
                return (
                  <tr key={item.id} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2.5 text-gray-700">{item.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      {val === 'yes' && <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded">YES</span>}
                      {val === 'no' && <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">NO</span>}
                      {val === null && <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Section 3: Comments & Faults */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 3 — Comments &amp; Faults</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comment / Fault Description</p>
            {formData.comment ? (
              <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">{formData.comment}</p>
            ) : (
              <p className="text-gray-400 italic">No comments or faults reported</p>
            )}
          </div>
        </div>

        {/* Section 4: Attachments */}
        {submission.media_urls && submission.media_urls.length > 0 && (
          <div className="border border-gray-200 rounded mb-6">
            <div className="bg-[#1B4332] px-4 py-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 4 — Attachments ({submission.media_urls.length})</h3>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {submission.media_urls.map((url: string, index: number) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square bg-gray-100 rounded overflow-hidden hover:opacity-90 transition-opacity border border-gray-200"
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

        {/* Sign-off */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Sign-off Declaration</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 mb-4">I confirm that all checks have been completed accurately and to the best of my knowledge.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-gray-900 font-medium mt-0.5">{submission.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signature</p>
                <p className="text-gray-900 font-serif italic text-lg border-b border-gray-300 pb-1 mt-0.5">{submission.signature}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#1B4332] pt-3">
          <p className="text-xs text-gray-400 text-center">
            Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — AJ Gammond Civils Ltd
          </p>
        </div>
      </div>

      {/* Bottom PDF button */}
      <div>
        <DownloadPdfButton contentId="pdf-content" filename={`checklist-${submission.name || id}`} fullWidth />
      </div>

      <AdminActions submissionId={id} currentStatus={submission.status} />
    </div>
  )
}
