'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SubmissionStatus } from '@/lib/types'

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: updateError } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', submissionId)

  if (updateError) throw updateError

  revalidatePath(`/dashboard/admin/submission/${submissionId}`)
  revalidatePath(`/dashboard/submission/${submissionId}`)
}
