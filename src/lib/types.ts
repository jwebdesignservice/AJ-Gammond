export type CheckValue = 'yes' | 'no' | null

// Legacy type kept for reading old Supabase records
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface CheckItem {
  id: string
  label: string
  value?: CheckValue                             // current: single day check
  values?: Record<DayOfWeek, CheckValue>         // legacy: old multi-day submissions
}

export interface FormData {
  siteInduction: CheckItem[]
  machineChecks: CheckItem[]
  comment: string
  name: string
  signature: string
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_review'

export interface Submission {
  id: string
  user_id: string
  created_at: string
  status: SubmissionStatus
  form_data: FormData
  comment: string
  name: string
  signature: string
  media_urls: string[]
  user_email?: string
}

export interface SubmissionNote {
  id: string
  submission_id: string
  admin_id: string
  note: string
  created_at: string
  admin_email?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  created_at: string
}
