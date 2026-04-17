export type CheckValue = 'yes' | 'no' | null

// Legacy type kept for reading old Supabase records
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface CheckItem {
  id: string
  label: string
  value?: CheckValue                             // current: single day check
  values?: Record<DayOfWeek, CheckValue>         // legacy: old multi-day submissions
}

export type MachineType = 'Trencher' | 'Rocksaw' | 'Rock Hawg'
export type MachineCode = '030' | '066' | '1405' | '1408' | '1409' | '1421' | '1427' | '1428' | '1431' | '2401'

export interface FormData {
  date?: string
  contractor: string
  siteAddress: string
  machineType: MachineType | ''
  machineCode: MachineCode | ''
  siteInduction: CheckItem[]
  machineChecks: CheckItem[]
  comment: string
  name: string
  signature: string
}

export interface SiteRecordRow {
  date: string
  description: string
  width: string
  depth: string
  length: string
  shift: 'Day' | 'Night' | ''
  hrs: string
  picks: string
}

export interface SiteRecord {
  id: string
  user_id: string
  created_at: string
  status: SubmissionStatus
  customer: string
  machine_type: string
  site_address: string
  machine_code: string
  rows: SiteRecordRow[]
  materials?: string[]
  works_agreed_by: string
  capacity: string
  /** Name of the person in whose presence the AJG rep signed */
  signed_in_presence_of: string
  /** Hand-drawn signature of the person in whose presence the AJG rep signed */
  signed_in_presence_of_signature?: string | null
  /** Printed name of the AJG rep */
  ajg_rep_name?: string | null
  /** Hand-drawn signature of the AJG rep */
  ajg_rep_signature: string
  /** Legacy — no longer used but kept to avoid breaking historic records. */
  onsite_signature?: string | null
  onsite_signed_at?: string | null
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
  /** In-person client signature captured by an admin from the admin panel. */
  onsite_signature?: string | null
  onsite_signed_at?: string | null
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
