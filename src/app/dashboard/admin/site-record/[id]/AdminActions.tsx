'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubmissionStatus } from '@/lib/types'
import { Check, X, Loader2 } from 'lucide-react'
import { updateSiteRecordStatus } from './actions'

interface AdminActionsProps {
  recordId: string
  currentStatus: SubmissionStatus
}

export default function AdminActions({ recordId, currentStatus }: AdminActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleStatusUpdate = async (status: SubmissionStatus) => {
    setError('')
    setLoading(true)

    try {
      await updateSiteRecordStatus(recordId, status)
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusUpdate('approved')}
          disabled={loading || currentStatus === 'approved'}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve
        </button>

        <button
          onClick={() => handleStatusUpdate('rejected')}
          disabled={loading || currentStatus === 'rejected'}
          className="btn-danger flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Reject
        </button>
      </div>
    </div>
  )
}
