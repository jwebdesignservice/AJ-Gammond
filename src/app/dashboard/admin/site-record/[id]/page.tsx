import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { SiteRecord, SiteRecordRow, SubmissionNote } from '@/lib/types'
import AdminActions from './AdminActions'
import DownloadPdfButton from '@/components/DownloadPdfButton'

export default async function AdminSiteRecordPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: record } = await supabase
    .from('site_records')
    .select('*, profiles:user_id (email, name)')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const siteRecord = record as SiteRecord & { profiles?: { email: string; name: string } }

  const { data: notes } = await supabase
    .from('submission_notes')
    .select('*, admin:admin_id (email)')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })

  const submittedDate = new Date(siteRecord.created_at).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const submittedTime = new Date(siteRecord.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Review Site Record</h1>
          <p className="text-sm text-gray-600">
            {submittedDate} at {submittedTime}
          </p>
        </div>
        <DownloadPdfButton contentId="pdf-content" filename={`site-record-${siteRecord.customer || id}`} />
        <StatusBadge status={siteRecord.status} />
      </div>

      <div id="pdf-content" className="bg-white p-6 border border-gray-200 rounded-[3px]">
        {/* PDF Header */}
        <div className="border-b-2 border-[#1B4332] pb-4 mb-6">
          <h2 className="text-xl font-bold text-[#1B4332] uppercase tracking-wide">Site Record Report</h2>
          <p className="text-sm text-gray-500 mt-1">Reference: {id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Submission Info */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide">Submission Details</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted By</p>
              <p className="text-gray-900 font-medium mt-0.5">{siteRecord.profiles?.name || siteRecord.customer}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-gray-900 mt-0.5">{siteRecord.profiles?.email || '—'}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Submitted</p>
              <p className="text-gray-900 mt-0.5">{submittedDate}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
              <p className="text-gray-900 mt-0.5">{submittedTime}</p>
            </div>
            <div className="px-4 py-3" />
            <div className="px-4 py-3" />
          </div>
        </div>

        {/* Section 1: Job Details */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 1 — Job Details</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="text-gray-900 font-medium mt-0.5">{siteRecord.customer || '—'}</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Machine Type</p>
              <p className="text-gray-900 font-medium mt-0.5">{siteRecord.machine_type || '—'}</p>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Site Address</p>
            <p className="text-gray-900 font-medium mt-0.5">{siteRecord.site_address || '—'}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Machine Code</p>
              <p className="text-gray-900 font-medium mt-0.5">{siteRecord.machine_code || '—'}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</p>
              <p className="text-gray-900 font-medium mt-0.5">{siteRecord.capacity || '—'}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Work Records Table */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 2 — Work Records</h3>
          </div>
          {siteRecord.rows && siteRecord.rows.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-4 py-2">Date</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Description</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Width</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Depth</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Length</th>
                  <th className="text-center text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Shift</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-3 py-2">Hours</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide px-4 py-2">Picks</th>
                </tr>
              </thead>
              <tbody>
                {siteRecord.rows.map((row: SiteRecordRow, i: number) => (
                  <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-medium">{row.date || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700">{row.description || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-right">{row.width || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-right">{row.depth || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-right">{row.length || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-center">{row.shift || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-right">{row.hrs || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700 text-right">{row.picks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3">
              <p className="text-gray-400 italic">No work records entered</p>
            </div>
          )}
        </div>

        {/* Section 3: Materials */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 3 — Materials Used</h3>
          </div>
          <div className="px-4 py-3">
            {siteRecord.materials && siteRecord.materials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {siteRecord.materials.map((code) => (
                  <span key={code} className="bg-[#1B4332] text-white text-sm font-semibold px-3 py-1.5 rounded">
                    {code}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No materials recorded</p>
            )}
          </div>
        </div>

        {/* Section 4: Sign-off */}
        <div className="border border-gray-200 rounded mb-6">
          <div className="bg-[#1B4332] px-4 py-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Section 4 — Sign-off Declaration</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 mb-4">I confirm that all information recorded above is accurate and complete to the best of my knowledge.</p>
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="pr-4 border-b border-gray-200 pb-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Works Agreed By</p>
                <p className="text-gray-900 font-medium mt-0.5">{siteRecord.works_agreed_by || '—'}</p>
              </div>
              <div className="pl-4 border-b border-gray-200 pb-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed in Presence Of</p>
                <p className="text-gray-900 font-medium mt-0.5">{siteRecord.signed_in_presence_of || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AJG Representative Signature</p>
              <p className="text-gray-900 font-serif italic text-lg border-b border-gray-300 pb-1 mt-0.5 inline-block min-w-[200px]">
                {siteRecord.ajg_rep_signature || '—'}
              </p>
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
        <DownloadPdfButton contentId="pdf-content" filename={`site-record-${siteRecord.customer || id}`} fullWidth />
      </div>

      <AdminActions recordId={id} currentStatus={siteRecord.status} />

      {notes && notes.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notes History
          </h3>
          <div className="space-y-3">
            {notes.map((note: SubmissionNote & { admin?: { email: string } }) => (
              <div key={note.id} className="bg-gray-50 p-3 rounded-[3px]">
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
