'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubmissionStatus } from '@/lib/types'
import { Check, X, MessageSquare, AlertCircle, Loader2 } from 'lucide-react'
import { updateSiteRecordStatus, addSiteRecordNote } from './actions'

interface AdminActionsProps {
  recordId: string
  currentStatus: SubmissionStatus
}

export default function AdminActions({ recordId, currentStatus }: AdminActionsProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleStatusUpdate = async (status: SubmissionStatus, includeNote: boolean) => {
    setError('')
    setLoading(true)

    try {
      await updateSiteRecordStatus(recordId, status, includeNote ? note : undefined)
      if (includeNote && note.trim()) setNote('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNoteOnly = async () => {
    if (!note.trim()) return

    setError('')
    setLoading(true)

    try {
      await addSiteRecordNote(recordId, note)
      setNote('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">Admin Actions</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-[3px] text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input min-h-[80px] resize-y"
          placeholder="Add feedback or notes..."
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusUpdate('approved', true)}
          disabled={loading || currentStatus === 'approved'}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve
        </button>

        <button
          onClick={() => handleStatusUpdate('rejected', true)}
          disabled={loading || currentStatus === 'rejected'}
          className="btn-danger flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Reject
        </button>

        <button
          onClick={() => handleStatusUpdate('needs_review', true)}
          disabled={loading || currentStatus === 'needs_review'}
          className="btn-secondary flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
          Request Changes
        </button>

        <button
          onClick={handleAddNoteOnly}
          disabled={loading || !note.trim()}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Add Note Only
        </button>
      </div>
    </div>
  )
}
