'use client'

import { useState, useRef, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { siteInductionItems, machineCheckItems } from '@/lib/form-data'
import { CheckItem, CheckValue, FormData, MachineType, MachineCode, Submission } from '@/lib/types'
import ChecklistGrid from '@/components/ChecklistGrid'
import SignaturePad from '@/components/SignaturePad'
import { Loader2, Upload, X, Camera, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [initialLoading, setInitialLoading] = useState(true)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [siteItems, setSiteItems] = useState<CheckItem[]>([])
  const [machineItems, setMachineItems] = useState<CheckItem[]>([])
  const [date, setDate] = useState('')
  const [contractor, setContractor] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [machineType, setMachineType] = useState<MachineType | ''>('')
  const [machineCode, setMachineCode] = useState<MachineCode | ''>('')
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [signature, setSignature] = useState('')
  const [existingMedia, setExistingMedia] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadSubmission() {
      const { data, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        setError('Submission not found.')
        setInitialLoading(false)
        return
      }

      // Only allow editing rejected or needs_review submissions
      if (data.status !== 'rejected' && data.status !== 'needs_review') {
        window.location.href = `/dashboard/submission/${id}`
        return
      }

      const sub = data as Submission
      setSubmission(sub)

      const fd = sub.form_data as FormData
      setDate(fd.date ?? new Date().toISOString().split('T')[0])
      setContractor(fd.contractor ?? '')
      setSiteAddress(fd.siteAddress ?? '')
      setMachineType((fd.machineType as MachineType) || '')
      setMachineCode((fd.machineCode as MachineCode) || '')
      setComment(fd.comment ?? sub.comment ?? '')
      setName(fd.name ?? sub.name ?? '')
      setSignature(fd.signature ?? sub.signature ?? '')
      setExistingMedia(sub.media_urls ?? [])

      // Pre-fill site induction items from saved data
      const savedSite = fd.siteInduction ?? []
      const filledSite: CheckItem[] = JSON.parse(JSON.stringify(siteInductionItems)).map((item: CheckItem) => {
        const saved = savedSite.find((s: CheckItem) => s.id === item.id)
        if (saved) {
          return { ...item, value: saved.value ?? null }
        }
        return item
      })
      setSiteItems(filledSite)

      // Pre-fill machine check items from saved data
      const savedMachine = fd.machineChecks ?? []
      const filledMachine: CheckItem[] = JSON.parse(JSON.stringify(machineCheckItems)).map((item: CheckItem) => {
        const saved = savedMachine.find((s: CheckItem) => s.id === item.id)
        if (saved) {
          return { ...item, value: saved.value ?? null }
        }
        return item
      })
      setMachineItems(filledMachine)

      setInitialLoading(false)
    }

    loadSubmission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

  const removeExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index))
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

      // Upload new files
      const newMediaUrls: string[] = []
      for (const file of files) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName)

        newMediaUrls.push(publicUrl)
      }

      // Combine existing and new media
      const allMediaUrls = [...existingMedia, ...newMediaUrls]

      // Build form data
      const formData: FormData = {
        date,
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

      // Update existing submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'pending',
          form_data: formData,
          comment,
          name,
          signature,
          media_urls: allMediaUrls,
        })
        .eq('id', id)

      if (updateError) throw updateError

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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-2xl mx-auto pt-10 text-center">
        <p className="text-red-600">{error || 'Submission not found.'}</p>
        <Link href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Page header */}
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link
          href={`/dashboard/submission/${id}`}
          className="w-9 h-9 bg-white rounded-[3px] border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit &amp; Resubmit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Make your changes below and resubmit for review
          </p>
        </div>
      </div>

      {/* How to fill in instructions */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-[3px] p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How to complete this form</p>
          <p>Tap each check item to mark it as <strong>Yes</strong> (green) or <strong>No</strong> (red). Tap again to clear. Fill in your name and signature at the bottom, then press <strong>Resubmit Checklist</strong>.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-[3px] text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Job Details */}
        <div className="card space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Job Details</h3>
            <p className="text-gray-500 text-sm">Fill in site and machine information before starting</p>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
            />
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
                <option value="">Select machine type...</option>
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
                <option value="">Select machine code...</option>
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

            <SignaturePad
              value={signature}
              onChange={setSignature}
              label="Signature *"
              required
            />
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

          {/* Existing attachments */}
          {existingMedia.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Existing attachments</p>
              {existingMedia.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-[3px] border border-gray-100"
                >
                  <span className="text-sm text-gray-700 truncate">
                    {url.split('/').pop() || `Attachment ${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New attachments</p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-[3px] border border-gray-100"
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
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Resubmitting...</>
            : 'Resubmit Checklist'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your updated submission will be reviewed by an administrator
        </p>
      </form>
    </div>
  )
}
