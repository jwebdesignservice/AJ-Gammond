'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SignaturePad from './SignaturePad'
import { CheckCircle2, Loader2, Pen } from 'lucide-react'

/**
 * Admin-side in-person signature capture.
 *
 * Lives inside both admin submission + admin site-record detail pages. The
 * admin hands the device to the client, who signs the pad. On save it
 * persists to the `onsite_signature` column (data URL) + timestamp, and
 * the parent view re-renders to show the captured signature as an `<img>`
 * on the page + PDF.
 *
 * Table is either `submissions` or `site_records` — configured via the
 * `table` prop.
 */

interface Props {
  recordId: string
  table: 'submissions' | 'site_records'
  /** Existing captured signature if the client already signed. */
  initialSignature?: string | null
  initialSignedAt?: string | null
}

export default function OnsiteSignatureCapture({
  recordId,
  table,
  initialSignature,
  initialSignedAt,
}: Props) {
  const supabase = createClient()
  const [signature, setSignature]     = useState(initialSignature ?? '')
  const [saving, setSaving]           = useState(false)
  const [savedAt, setSavedAt]         = useState(initialSignedAt ?? null)
  const [error, setError]             = useState('')
  const [editing, setEditing]         = useState(!initialSignature)

  const save = async () => {
    if (!signature) {
      setError('Please sign before saving.')
      return
    }
    setSaving(true)
    setError('')
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from(table)
      .update({ onsite_signature: signature, onsite_signed_at: now })
      .eq('id', recordId)

    setSaving(false)
    if (err) {
      setError(err.message || 'Failed to save signature.')
      return
    }
    setSavedAt(now)
    setEditing(false)
  }

  const clear = () => {
    setSignature('')
  }

  const reopen = () => {
    setSignature('')
    setEditing(true)
  }

  return (
    <div className="border border-gray-200 rounded mb-6">
      <div className="bg-[#1B4332] px-4 py-2 flex items-center gap-2">
        <Pen className="w-4 h-4 text-white" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Client Signature</h3>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm text-gray-700 mb-3">
          Hand the device to the client to sign. Their signature will be saved to the record and included on the PDF.
        </p>

        {!editing && signature ? (
          <div className="space-y-3">
            <img
              src={signature}
              alt="In-person client signature"
              className="border-b border-gray-300 pb-1 max-h-24 max-w-[360px]"
            />
            {savedAt && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Signed {new Date(savedAt).toLocaleString('en-GB')}
              </p>
            )}
            <button
              type="button"
              onClick={reopen}
              className="text-xs font-semibold text-[#1B4332] hover:text-[#0F2A20] underline"
            >
              Re-sign
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <SignaturePad
              value={signature}
              onChange={setSignature}
              height={180}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !signature}
                className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2 rounded-[3px] text-sm font-semibold hover:bg-[#0F2A20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                ) : (
                  <>Save signature</>
                )}
              </button>
              {signature && (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
