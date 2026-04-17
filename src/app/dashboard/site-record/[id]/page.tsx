export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, MessageSquare } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { SiteRecord, SiteRecordRow, SubmissionNote } from '@/lib/types'

export default async function SiteRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('site_records')
    .select('*')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const siteRecord = record as SiteRecord

  const { data: notes } = await supabase
    .from('site_record_notes')
    .select('*, profiles:admin_id (email)')
    .eq('site_record_id', id)
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
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="w-9 h-9 bg-white rounded-[3px] border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">AJ Gammond Ltd — Site Record Sheet</p>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{submittedDate}</h1>
          <p className="text-sm text-gray-500">Submitted at {submittedTime}</p>
        </div>
        <StatusBadge status={siteRecord.status} />
      </div>

      {/* Edit & Resubmit CTA */}
      {(siteRecord.status === 'rejected' || siteRecord.status === 'needs_review') && (
        <Link
          href={`/dashboard/site-record/${id}/edit`}
          className="flex items-center gap-3 w-full bg-red-50 hover:bg-red-100 border border-red-200 rounded-[3px] p-4 transition-colors group"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">This submission needs changes</p>
            <p className="text-xs text-red-600 mt-0.5">Edit &amp; Resubmit</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-red-400 rotate-180 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

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
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Machine Code</p>
              <p className="text-gray-900 font-medium">{siteRecord.machine_code}</p>
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
              <span
                key={code}
                className="bg-[#1B4332] text-white text-sm font-semibold px-3 py-1.5 rounded-[3px] inline-flex items-center gap-1.5"
              >
                {code}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
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
          {siteRecord.capacity && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In the Capacity of</p>
              <p className="text-gray-900 font-medium">{siteRecord.capacity}</p>
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
              {siteRecord.ajg_rep_signature.startsWith('data:image') ? (
                <img
                  src={siteRecord.ajg_rep_signature}
                  alt="AJG Representative Signature"
                  className="max-h-20 max-w-[320px] border-b border-gray-300 pb-1"
                />
              ) : (
                <p className="text-gray-900 font-serif italic text-lg">{siteRecord.ajg_rep_signature}</p>
              )}
            </div>
          )}
          {siteRecord.onsite_signature && (
            <div className="col-span-2 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In-Person Client Signature</p>
              <img
                src={siteRecord.onsite_signature}
                alt="In-person client signature"
                className="max-h-20 max-w-[320px] border-b border-gray-300 pb-1"
              />
              {siteRecord.onsite_signed_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Signed on {new Date(siteRecord.onsite_signed_at).toLocaleString('en-GB')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Admin notes */}
      {notes && notes.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            Admin Notes
          </h3>
          <div className="space-y-3">
            {notes.map((note: SubmissionNote & { profiles?: { email: string } }) => (
              <div key={note.id} className="bg-gray-50 rounded-[3px] p-4 border border-gray-100">
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
