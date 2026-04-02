'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SubmissionStatus } from '@/lib/types'
import { Check, X, MessageSquare, AlertCircle, Loader2 } from 'lucide-react'

interface AdminActionsProps {
  submissionId: string
  currentStatus: SubmissionStatus
}

export default function AdminActions({ submissionId, currentStatus }: AdminActionsProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (status: SubmissionStatus, addNote?: boolean) => {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update status
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', submissionId)

      if (updateError) throw updateError

      // Add note if provided
      if (addNote && note.trim()) {
        const { error: noteError } = await supabase
          .from('submission_notes')
          .insert({
            submission_id: submissionId,
            admin_id: user.id,
            note: note.trim(),
          })

        if (noteError) throw noteError
        setNote('')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const addNoteOnly = async () => {
    if (!note.trim()) return
    
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: noteError } = await supabase
        .from('submission_notes')
        .insert({
          submission_id: submissionId,
          admin_id: user.id,
          note: note.trim(),
        })

      if (noteError) throw noteError
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
        <div className="bg-red-50 text-red-600 p-3 rounded-[4px] text-sm">
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
          placeholder="Add feedback or notes for the user..."
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateStatus('approved', true)}
          disabled={loading || currentStatus === 'approved'}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve
        </button>

        <button
          onClick={() => updateStatus('rejected', true)}
          disabled={loading || currentStatus === 'rejected'}
          className="btn-danger flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Reject
        </button>

        <button
          onClick={() => updateStatus('needs_review', true)}
          disabled={loading || currentStatus === 'needs_review'}
          className="btn-secondary flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
          Request Changes
        </button>

        <button
          onClick={addNoteOnly}
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
