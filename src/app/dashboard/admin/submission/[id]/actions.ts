'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SubmissionStatus } from '@/lib/types'

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  note?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: updateError } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', submissionId)

  if (updateError) throw updateError

  if (note?.trim()) {
    const { error: noteError } = await supabase
      .from('submission_notes')
      .insert({
        submission_id: submissionId,
        admin_id: user.id,
        note: note.trim(),
      })

    if (noteError) throw noteError
  }

  // Bust the cache for both admin and user views of this submission
  revalidatePath(`/dashboard/admin/submission/${submissionId}`)
  revalidatePath(`/dashboard/submission/${submissionId}`)
}

export async function addSubmissionNote(submissionId: string, note: string) {
  const supabase = await createClient()

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

  revalidatePath(`/dashboard/admin/submission/${submissionId}`)
  revalidatePath(`/dashboard/submission/${submissionId}`)
}
