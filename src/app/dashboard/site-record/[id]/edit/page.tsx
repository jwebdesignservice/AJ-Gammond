'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SiteRecord, SiteRecordRow } from '@/lib/types'
import { Loader2, Plus, Trash2, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SignaturePad from '@/components/SignaturePad'

const MATERIALS = [
  { code: 'A',     label: 'Asphalt' },
  { code: 'CON',   label: 'Concrete' },
  { code: 'R-CON', label: 'Reinforced Concrete' },
  { code: 'LMC',   label: 'Lean Mix Concrete' },
  { code: 'LS',    label: 'Limestone' },
  { code: 'SS',    label: 'Sandstone' },
  { code: 'RCK',   label: 'Rock' },
  { code: 'CH',    label: 'Chalk' },
]

const emptyRow = (): SiteRecordRow => ({
  date: '',
  description: '',
  width: '',
  depth: '',
  length: '',
  shift: '',
  hrs: '',
  picks: '',
})

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function EditSiteRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [initialLoading, setInitialLoading] = useState(true)
  const [record, setRecord]                 = useState<SiteRecord | null>(null)
  const [customer,       setCustomer]       = useState('')
  const [machineType,    setMachineType]    = useState('')
  const [siteAddress,    setSiteAddress]    = useState('')
  const [machineCode,    setMachineCode]    = useState('')
  const [rows,           setRows]           = useState<SiteRecordRow[]>([emptyRow()])
  const [worksAgreedBy,  setWorksAgreedBy]  = useState('')
  const [capacity,       setCapacity]       = useState('')
  const [signedPresence, setSignedPresence] = useState('')
  const [ajgRepSig,      setAjgRepSig]      = useState('')
  const [materials,      setMaterials]      = useState<string[]>([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    async function loadRecord() {
      const { data, error: fetchError } = await supabase
        .from('site_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        setError('Site record not found.')
        setInitialLoading(false)
        return
      }

      // Only allow editing rejected or needs_review submissions
      if (data.status !== 'rejected' && data.status !== 'needs_review') {
        window.location.href = `/dashboard/site-record/${id}`
        return
      }

      const sr = data as SiteRecord
      setRecord(sr)
      setCustomer(sr.customer ?? '')
      setMachineType(sr.machine_type ?? '')
      setSiteAddress(sr.site_address ?? '')
      setMachineCode(sr.machine_code ?? '')
      setRows(sr.rows && sr.rows.length > 0 ? sr.rows : [emptyRow()])
      setWorksAgreedBy(sr.works_agreed_by ?? '')
      setCapacity(sr.capacity ?? '')
      setSignedPresence(sr.signed_in_presence_of ?? '')
      setAjgRepSig(sr.ajg_rep_signature ?? '')
      setMaterials(sr.materials ?? [])

      setInitialLoading(false)
    }

    loadRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const toggleMaterial = (code: string) =>
    setMaterials(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )

  const updateRow = (i: number, field: keyof SiteRecordRow, value: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const addRow    = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!customer.trim() || !machineType.trim() || !siteAddress.trim() || !machineCode.trim()) {
      setError('Please complete all required fields — Customer, Machine Type, Site Address and Machine Code.')
      return
    }
    if (!worksAgreedBy.trim()) {
      setError('Works Agreed By is required.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('site_records')
        .update({
          status:                'pending',
          customer,
          machine_type:          machineType,
          site_address:          siteAddress,
          machine_code:          machineCode,
          rows,
          materials,
          works_agreed_by:       worksAgreedBy,
          capacity,
          signed_in_presence_of: signedPresence,
          ajg_rep_signature:     ajgRepSig,
        })
        .eq('id', id)

      if (updateError) throw updateError

      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Something went wrong. Please try again.')
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

  if (!record) {
    return (
      <div className="max-w-2xl mx-auto pt-10 text-center">
        <p className="text-red-600">{error || 'Site record not found.'}</p>
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
          href={`/dashboard/site-record/${id}`}
          className="w-9 h-9 bg-white rounded-[3px] border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit &amp; Resubmit</h1>
          <p className="text-gray-500 text-sm mt-1">Make your changes below and resubmit for review</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-[3px] p-4 mb-5">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Fill in the job details, add one entry per section of work, then sign off at the bottom.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-[3px] text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* ── Job Details ── */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900">Job Details</h3>

          <div>
            <FieldLabel required>Customer</FieldLabel>
            <input
              type="text"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="input"
              placeholder="Customer name"
            />
          </div>

          <div>
            <FieldLabel required>Site Address</FieldLabel>
            <input
              type="text"
              value={siteAddress}
              onChange={e => setSiteAddress(e.target.value)}
              className="input"
              placeholder="Full site address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Machine Type</FieldLabel>
              <select
                value={machineType}
                onChange={e => setMachineType(e.target.value)}
                className="input"
              >
                <option value="">Select…</option>
                {(['Trencher', 'Rocksaw', 'Rock Hawg'] as const).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required>Machine Code</FieldLabel>
              <select
                value={machineCode}
                onChange={e => setMachineCode(e.target.value)}
                className="input"
              >
                <option value="">Select…</option>
                {(['030', '066', '1405', '1408', '1409', '1421', '1427', '1428', '1431', '2401'] as const).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Work Entries ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Work Entries</h3>
              <p className="text-gray-500 text-xs mt-0.5">One entry per section of work</p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-[3px] p-4 bg-gray-50 space-y-3"
              >
                {/* Row header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Entry {i + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1"
                      aria-label="Remove entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Date */}
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <input
                    type="date"
                    value={row.date}
                    onChange={e => updateRow(i, 'date', e.target.value)}
                    className="input"
                  />
                </div>

                {/* Description */}
                <div>
                  <FieldLabel>Description of Works</FieldLabel>
                  <input
                    type="text"
                    value={row.description}
                    onChange={e => updateRow(i, 'description', e.target.value)}
                    className="input"
                    placeholder="e.g. Trenching along road verge"
                  />
                </div>

                {/* Measurements — 3 columns */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <FieldLabel>Width (MM)</FieldLabel>
                    <input
                      type="number"
                      value={row.width}
                      onChange={e => updateRow(i, 'width', e.target.value)}
                      className="input text-center px-2"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <FieldLabel>Depth (MM)</FieldLabel>
                    <input
                      type="number"
                      value={row.depth}
                      onChange={e => updateRow(i, 'depth', e.target.value)}
                      className="input text-center px-2"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <FieldLabel>Length (LM)</FieldLabel>
                    <input
                      type="number"
                      value={row.length}
                      onChange={e => updateRow(i, 'length', e.target.value)}
                      className="input text-center px-2"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Shift / HRS / Picks — 3 columns */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <FieldLabel>Shift</FieldLabel>
                    <select
                      value={row.shift}
                      onChange={e => updateRow(i, 'shift', e.target.value)}
                      className="input px-2"
                    >
                      <option value="">—</option>
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>HRS</FieldLabel>
                    <input
                      type="number"
                      value={row.hrs}
                      onChange={e => updateRow(i, 'hrs', e.target.value)}
                      className="input text-center px-2"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <FieldLabel>Picks Used</FieldLabel>
                    <input
                      type="number"
                      value={row.picks}
                      onChange={e => updateRow(i, 'picks', e.target.value)}
                      className="input text-center px-2"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 w-full border-2 border-dashed border-gray-200 rounded-[3px] py-3 text-sm font-medium text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add another entry
          </button>
        </div>

        {/* ── Materials ── */}
        <div className="card">
          <div className="mb-3">
            <h3 className="font-bold text-gray-900">Materials</h3>
            <p className="text-gray-500 text-xs mt-0.5">Tick all materials encountered on this job</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MATERIALS.map(m => {
              const ticked = materials.includes(m.code)
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => toggleMaterial(m.code)}
                  className={`flex items-center gap-2 rounded-[3px] px-3 py-2.5 text-left transition-colors border ${
                    ticked
                      ? 'bg-[#1B4332] border-[#1B4332] text-white'
                      : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`font-bold text-sm w-12 flex-shrink-0 ${ticked ? 'text-white' : 'text-[#1B4332]'}`}>
                    {m.code}
                  </span>
                  <span className="text-sm flex-1">{m.label}</span>
                  {ticked && (
                    <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          {materials.length > 0 && (
            <p className="text-xs text-[#1B4332] font-semibold mt-2.5">
              {materials.length} material{materials.length !== 1 ? 's' : ''} selected: {materials.join(', ')}
            </p>
          )}
        </div>

        {/* ── Sign-Off ── */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900">Sign-Off</h3>
            <p className="text-gray-500 text-sm mt-0.5">Confirm the information above is correct</p>
          </div>

          <div>
            <FieldLabel required>Works Agreed By</FieldLabel>
            <input
              type="text"
              value={worksAgreedBy}
              onChange={e => setWorksAgreedBy(e.target.value)}
              className="input font-serif italic"
              placeholder="Type name to sign"
            />
            <p className="text-xs text-gray-400 mt-1">Client representative</p>
          </div>

          <div>
            <FieldLabel>In the Capacity of</FieldLabel>
            <input
              type="text"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="input"
              placeholder="e.g. Site Manager"
            />
          </div>

          <SignaturePad
            value={signedPresence}
            onChange={setSignedPresence}
            label="Signed in Presence of AJG Representative"
          />

          <SignaturePad
            value={ajgRepSig}
            onChange={setAjgRepSig}
            label="Signed by AJG Representative"
          />

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3 leading-relaxed">
            By submitting this Site Record / Measure sheet you confirm that all the above information is correct.
            An invoice or application for payment will be produced and presented as per A J Gammond Ltd Terms &amp; Conditions.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center text-base py-4"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Resubmitting…</>
            : 'Resubmit Site Record'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Your updated submission will be reviewed by an administrator
        </p>
      </form>
    </div>
  )
}
