'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { siteInductionItems, machineCheckItems } from '@/lib/form-data'
import { CheckItem, CheckValue, FormData, MachineType, MachineCode } from '@/lib/types'
import ChecklistGrid from '@/components/ChecklistGrid'
import { Loader2, Upload, X, Camera, Info } from 'lucide-react'

export default function NewChecklistPage() {
  const [siteItems, setSiteItems] = useState<CheckItem[]>(
    JSON.parse(JSON.stringify(siteInductionItems))
  )
  const [machineItems, setMachineItems] = useState<CheckItem[]>(
    JSON.parse(JSON.stringify(machineCheckItems))
  )
  const [contractor, setContractor] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [machineType, setMachineType] = useState<MachineType | ''>('')
  const [machineCode, setMachineCode] = useState<MachineCode | ''>('')
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [signature, setSignature] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const updateSiteItem = (itemId: string, value: CheckValue) => {
    setSiteItems((prev) =>
      prev.map((item) => item.id === itemId ? { ...item, value } : item)
    )
    if (value !== null) setError('')
  }

  const updateMachineItem = (itemId: string, value: CheckValue) => {
    setMachineItems((prev) =>
      prev.map((item) => item.id === itemId ? { ...item, value } : item)
    )
    if (value !== null) setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate job details
    if (!contractor.trim() || !siteAddress.trim() || !machineType || !machineCode) {
      setError('Please complete all job details — Contractor, Site Address, Machine Type and Machine Code are required.')
      return
    }

    // Validate all checklist items are answered
    const unanswered = [
      ...siteItems.filter(i => i.value === null || i.value === undefined),
      ...machineItems.filter(i => i.value === null || i.value === undefined),
    ]
    if (unanswered.length > 0) {
      setShowValidation(true)
      setError(`Please answer all checklist items — ${unanswered.length} item${unanswered.length !== 1 ? 's' : ''} still need a Yes or No answer.`)
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists — runs as SECURITY DEFINER to bypass RLS
      const { error: profileError } = await supabase.rpc('ensure_profile', {
        p_id: user.id,
        p_email: user.email ?? '',
        p_name: user.user_metadata?.name ?? name,
      })
      if (profileError) throw new Error('Profile error: ' + profileError.message)

      // Upload files
      const mediaUrls: string[] = []
      for (const file of files) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName)

        mediaUrls.push(publicUrl)
      }

      // Build form data
      const formData: FormData = {
        contractor,
        siteAddress,
        machineType: machineType as MachineType,
        machineCode: machineCode as MachineCode,
        siteInduction: siteItems,
        machineChecks: machineItems,
        comment,
        name,
        signature,
      }

      // Insert submission
      const { data: inserted, error: insertError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          status: 'pending',
          form_data: formData,
          comment,
          name,
          signature,
          media_urls: mediaUrls,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Send email notification (non-blocking)
      try {
        await fetch('/api/send-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: inserted?.id,
            name,
            contractor,
            siteAddress,
            machineType,
            machineCode,
            siteItems,
            machineItems,
            comment,
            submittedAt: new Date().toLocaleString('en-GB'),
          }),
        })
      } catch {
        // Email failure doesn't block submission
      }

      // Hard redirect ensures dashboard server component fetches fresh data
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        JSON.stringify(err) ??
        'Something went wrong. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Page header */}
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Safety Checklist</h1>
        <p className="text-gray-500 text-sm mt-1">
          Complete all sections below before starting work today
        </p>
      </div>

      {/* How to fill in instructions */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How to complete this form</p>
          <p>Tap each check item to mark it as <strong>Yes</strong> (green) or <strong>No</strong> (red). Tap again to clear. Fill in your name and signature at the bottom, then press <strong>Submit Checklist</strong>.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Job Details */}
        <div className="card space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Job Details</h3>
            <p className="text-gray-500 text-sm">Fill in site and machine information before starting</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contractor" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contractor <span className="text-red-500">*</span>
              </label>
              <input
                id="contractor"
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="input"
                placeholder="Company / contractor name"
                required
              />
            </div>

            <div>
              <label htmlFor="siteAddress" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Site Address <span className="text-red-500">*</span>
              </label>
              <input
                id="siteAddress"
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="input"
                placeholder="Full site address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="machineType" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Machine Type <span className="text-red-500">*</span>
              </label>
              <select
                id="machineType"
                value={machineType}
                onChange={(e) => setMachineType(e.target.value as MachineType)}
                className="input"
              >
                <option value="">Select machine type…</option>
                {(['Trencher', 'Rocksaw', 'Rock Hawg'] as MachineType[]).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="machineCode" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Machine Code <span className="text-red-500">*</span>
              </label>
              <select
                id="machineCode"
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value as MachineCode)}
                className="input"
              >
                <option value="">Select machine code…</option>
                {(['030', '066', '1405', '1408', '1409', '1421', '1427', '1428', '1431', '2401'] as MachineCode[]).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Checklist grids */}
        <ChecklistGrid
          title="Site Induction & Safety"
          items={siteItems}
          onUpdate={updateSiteItem}
          showValidation={showValidation}
        />

        <ChecklistGrid
          title="Machine Daily Checks"
          items={machineItems}
          onUpdate={updateMachineItem}
          showValidation={showValidation}
        />

        {/* Additional info */}
        <div className="card space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Additional Information</h3>
            <p className="text-gray-500 text-sm">Note any faults or issues found during checks</p>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Comment / Fault Description
              <span className="font-normal text-gray-400 ml-1">(optional)</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="e.g. Hydraulic oil level was low — topped up. Camera system intermittent."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="signature" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Signature <span className="text-red-500">*</span>
              </label>
              <input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="input font-serif italic"
                placeholder="Type your name to sign"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Type your name as your digital signature</p>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-1">Photo / Video Attachments</h3>
            <p className="text-gray-500 text-sm">Upload photos of any faults or damage found</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload from device
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.capture = 'environment'
                  fileInputRef.current.click()
                }
              }}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Take a photo
            </button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center text-lg py-4"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting…</>
            : 'Submit Checklist'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your submission will be reviewed by an administrator
        </p>
      </form>
    </div>
  )
}
