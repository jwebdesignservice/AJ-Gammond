'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SubmissionStatus } from '@/lib/types'

export async function updateSiteRecordStatus(
  recordId: string,
  status: SubmissionStatus
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: updateError } = await supabase
    .from('site_records')
    .update({ status })
    .eq('id', recordId)

  if (updateError) throw updateError

  revalidatePath(`/dashboard/admin/site-record/${recordId}`)
  revalidatePath(`/dashboard/site-record/${recordId}`)
}
