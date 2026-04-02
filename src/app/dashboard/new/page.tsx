'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { siteInductionItems, machineCheckItems } from '@/lib/form-data'
import { CheckItem, DayOfWeek, CheckValue, FormData } from '@/lib/types'
import ChecklistGrid from '@/components/ChecklistGrid'
import { Loader2, Upload, X, Camera } from 'lucide-react'

export default function NewChecklistPage() {
  const [siteItems, setSiteItems] = useState<CheckItem[]>(
    JSON.parse(JSON.stringify(siteInductionItems))
  )
  const [machineItems, setMachineItems] = useState<CheckItem[]>(
    JSON.parse(JSON.stringify(machineCheckItems))
  )
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [signature, setSignature] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const updateSiteItem = (itemId: string, day: DayOfWeek, value: CheckValue) => {
    setSiteItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, values: { ...item.values, [day]: value } }
          : item
      )
    )
  }

  const updateMachineItem = (itemId: string, day: DayOfWeek, value: CheckValue) => {
    setMachineItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, values: { ...item.values, [day]: value } }
          : item
      )
    )
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
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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

      // Create form data
      const formData: FormData = {
        siteInduction: siteItems,
        machineChecks: machineItems,
        comment,
        name,
        signature,
      }

      // Insert submission
      const { error: insertError } = await supabase.from('submissions').insert({
        user_id: user.id,
        status: 'pending',
        form_data: formData,
        comment,
        name,
        signature,
        media_urls: mediaUrls,
      })

      if (insertError) throw insertError

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Safety Checklist</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-[4px] text-sm">
            {error}
          </div>
        )}

        <ChecklistGrid
          title="Site Induction & Safety"
          items={siteItems}
          onUpdate={updateSiteItem}
        />

        <ChecklistGrid
          title="Machine Daily Checks"
          items={machineItems}
          onUpdate={updateMachineItem}
        />

        <div className="card space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Additional Information</h3>
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comment / Fault Description
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="Describe any faults or issues..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                Signature (Type your name)
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
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Attachments</h3>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photo/Video
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.capture = 'environment'
                  fileInputRef.current.click()
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-[4px]"
                >
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center text-lg py-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Checklist'}
        </button>
      </form>
    </div>
  )
}
