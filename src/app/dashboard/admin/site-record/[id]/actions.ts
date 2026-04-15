'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SubmissionStatus } from '@/lib/types'

export async function updateSiteRecordStatus(
  recordId: string,
  status: SubmissionStatus,
  note?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: updateError } = await supabase
    .from('site_records')
    .update({ status })
    .eq('id', recordId)

  if (updateError) throw updateError

  if (note?.trim()) {
    const { error: noteError } = await supabase
      .from('submission_notes')
      .insert({
        submission_id: recordId,
        admin_id: user.id,
        note: note.trim(),
      })

    if (noteError) throw noteError
  }

  revalidatePath(`/dashboard/admin/site-record/${recordId}`)
  revalidatePath(`/dashboard/site-record/${recordId}`)
}

export async function addSiteRecordNote(recordId: string, note: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: noteError } = await supabase
    .from('submission_notes')
    .insert({
      submission_id: recordId,
      admin_id: user.id,
      note: note.trim(),
    })

  if (noteError) throw noteError

  revalidatePath(`/dashboard/admin/site-record/${recordId}`)
  revalidatePath(`/dashboard/site-record/${recordId}`)
}
