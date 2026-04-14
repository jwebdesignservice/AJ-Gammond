'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteRecordRow } from '@/lib/types'
import { Loader2, Plus, Trash2, Info } from 'lucide-react'

const MATERIALS = [
  { code: 'A',     label: 'Asphalt' },
  { code: 'CON',   label: 'Concrete' },
  { code: 'R-CON', label: 'Reinforced Concrete' },
  { code: 'LMC',   label: 'Lean Mix Concrete' },
  { code: 'LS',    label: 'Limestone' },
  { code: 'SS',    label: 'Sandstone' },
  { code: 'BAS',   label: 'Basalt' },
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

export default function SiteRecordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [customer,       setCustomer]       = useState('')
  const [machineType,    setMachineType]    = useState('')
  const [siteAddress,    setSiteAddress]    = useState('')
  const [machineCode,    setMachineCode]    = useState('')
  const [rows,           setRows]           = useState<SiteRecordRow[]>([emptyRow()])
  const [worksAgreedBy,  setWorksAgreedBy]  = useState('')
  const [capacity,       setCapacity]       = useState('')
  const [signedPresence, setSignedPresence] = useState('')
  const [ajgRepSig,      setAjgRepSig]      = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const updateRow = (i: number, field: keyof SiteRecordRow, value: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const addRow    = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!customer.trim() || !machineType.trim() || !siteAddress.trim() || !machineCode.trim()) {
      setError('Please complete all header fields — Customer, Machine Type, Site Address and Machine Code are required.')
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

      const { error: insertError } = await supabase
        .from('site_records')
        .insert({
          user_id:               user.id,
          status:                'pending',
          customer,
          machine_type:          machineType,
          site_address:          siteAddress,
          machine_code:          machineCode,
          rows,
          works_agreed_by:       worksAgreedBy,
          capacity,
          signed_in_presence_of: signedPresence,
          ajg_rep_signature:     ajgRepSig,
        })

      if (insertError) throw insertError

      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Page header */}
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Site Record Sheet</h1>
        <p className="text-gray-500 text-sm mt-1">
          Complete all sections below and submit when work is finished
        </p>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How to complete this form</p>
          <p>Fill in the header details, add one row per section of work, then sign off at the bottom and press <strong>Submit</strong>.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* ── Header details ── */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Job Details</h3>
            <p className="text-gray-500 text-sm">Fill in site and machine information</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                className="input"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Machine Type <span className="text-red-500">*</span>
              </label>
              <select
                value={machineType}
                onChange={e => setMachineType(e.target.value)}
                className="input"
              >
                <option value="">Select machine type…</option>
                {(['Trencher', 'Rocksaw', 'Rock Hawg'] as const).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Site Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={e => setSiteAddress(e.target.value)}
                className="input"
                placeholder="Full site address"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Machine Code <span className="text-red-500">*</span>
              </label>
              <select
                value={machineCode}
                onChange={e => setMachineCode(e.target.value)}
                className="input"
              >
                <option value="">Select machine code…</option>
                {(['030', '066', '1405', '1408', '1409', '1421', '1427', '1428', '1431', '2401'] as const).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Work record table ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Work Record</h3>
              <p className="text-gray-500 text-sm">Add one row per section of work carried out</p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="btn-secondary btn-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[720px] text-sm border-collapse">
              <thead>
                <tr className="bg-[#1B4332] text-white">
                  <th className="px-3 py-2.5 text-left font-semibold rounded-tl-lg w-[100px]">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Description of Works</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[80px]">Width<br />(MM)</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[80px]">Depth<br />(MM)</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[80px]">Length<br />(LM)</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[90px]">Day /<br />Night</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[65px]">HRS</th>
                  <th className="px-3 py-2.5 text-center font-semibold w-[70px]">Picks<br />Used</th>
                  <th className="px-3 py-2.5 rounded-tr-lg w-[40px]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => updateRow(i, 'date', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => updateRow(i, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="e.g. Trenching along road verge"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.width}
                        onChange={e => updateRow(i, 'width', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="—"
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.depth}
                        onChange={e => updateRow(i, 'depth', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="—"
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.length}
                        onChange={e => updateRow(i, 'length', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="—"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={row.shift}
                        onChange={e => updateRow(i, 'shift', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                      >
                        <option value="">—</option>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.hrs}
                        onChange={e => updateRow(i, 'hrs', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="—"
                        min="0"
                        step="0.5"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.picks}
                        onChange={e => updateRow(i, 'picks', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                        placeholder="—"
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          aria-label="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add another row
          </button>
        </div>

        {/* ── Materials code reference ── */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">Materials Code Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MATERIALS.map(m => (
              <div key={m.code} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-bold text-[#1B4332] text-sm min-w-[40px]">{m.code}</span>
                <span className="text-gray-600 text-sm">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sign-off ── */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Sign-Off</h3>
            <p className="text-gray-500 text-sm">All parties must sign to confirm the above information is correct</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Works Agreed By <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                In the Capacity of
              </label>
              <input
                type="text"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="input"
                placeholder="e.g. Site Manager"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Signed in the Presence of AJG Representative
              </label>
              <input
                type="text"
                value={signedPresence}
                onChange={e => setSignedPresence(e.target.value)}
                className="input font-serif italic"
                placeholder="Type name to sign"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Signed by AJG Representative
              </label>
              <input
                type="text"
                value={ajgRepSig}
                onChange={e => setAjgRepSig(e.target.value)}
                className="input font-serif italic"
                placeholder="Type name to sign"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            By submitting this Site Record / Measure sheet you agree that all the above information is correct and
            subsequently a Invoice / Application for payment will be produced and presented for payment as per
            A J Gammond Ltd Terms &amp; Conditions.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center text-lg py-4"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting…</>
            : 'Submit Site Record'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your submission will be reviewed by an administrator
        </p>
      </form>
    </div>
  )
}
