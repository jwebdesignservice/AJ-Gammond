import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, User } from 'lucide-react'
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

      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{siteRecord.profiles?.name || siteRecord.customer}</p>
          <p className="text-sm text-gray-600">{siteRecord.profiles?.email}</p>
        </div>
      </div>

      {/* PDF-capturable content */}
      <div id="pdf-content" className="space-y-5">
        {/* Job Details */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Job Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {siteRecord.customer && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                <p className="text-gray-900 font-medium">{siteRecord.customer}</p>
              </div>
            )}
            {siteRecord.machine_type && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Machine Type</p>
                <p className="text-gray-900 font-medium">{siteRecord.machine_type}</p>
              </div>
            )}
            {siteRecord.site_address && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Site Address</p>
                <p className="text-gray-900 font-medium">{siteRecord.site_address}</p>
              </div>
            )}
            {siteRecord.machine_code && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Machine Code</p>
                <p className="text-gray-900 font-medium">{siteRecord.machine_code}</p>
              </div>
            )}
            {siteRecord.capacity && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacity</p>
                <p className="text-gray-900 font-medium">{siteRecord.capacity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Work Records Table */}
        {siteRecord.rows && siteRecord.rows.length > 0 && (
          <div className="card overflow-hidden">
            <h3 className="font-bold text-gray-900 mb-4">Work Records</h3>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-2">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Description</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Width</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Depth</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Length</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Shift</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Hrs</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-2">Picks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {siteRecord.rows.map((row: SiteRecordRow, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{row.date || '—'}</td>
                      <td className="px-3 py-3 text-gray-700">{row.description || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{row.width || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{row.depth || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{row.length || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 text-center">{row.shift || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{row.hrs || '—'}</td>
                      <td className="px-5 py-3 text-gray-700 text-right">{row.picks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials */}
        {siteRecord.materials && siteRecord.materials.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">Materials</h3>
            <div className="flex flex-wrap gap-2">
              {siteRecord.materials.map((code) => (
                <span key={code} className="bg-[#1B4332] text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sign-off */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Sign-off</h3>
          <div className="grid grid-cols-2 gap-4">
            {siteRecord.works_agreed_by && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Works Agreed By</p>
                <p className="text-gray-900 font-medium">{siteRecord.works_agreed_by}</p>
              </div>
            )}
            {siteRecord.signed_in_presence_of && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signed in Presence Of</p>
                <p className="text-gray-900 font-medium">{siteRecord.signed_in_presence_of}</p>
              </div>
            )}
            {siteRecord.ajg_rep_signature && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AJG Representative Signature</p>
                <p className="text-gray-900 font-serif italic text-lg">{siteRecord.ajg_rep_signature}</p>
              </div>
            )}
          </div>
        </div>
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
