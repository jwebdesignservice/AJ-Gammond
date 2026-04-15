'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const dateFilters = [
  { label: 'All Time', value: 'all' },
  { label: 'Today',    value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const typeFilters = [
  { label: 'All',          value: 'all' },
  { label: 'Checklists',   value: 'checklist' },
  { label: 'Site Records', value: 'site_record' },
]

export default function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeDate = searchParams.get('filter') ?? 'all'
  const activeType = searchParams.get('type') ?? 'all'

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-3 space-y-2.5">
      {/* Date row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-8 flex-shrink-0">Date</span>
        <div className="flex gap-1.5 flex-wrap">
          {dateFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setParam('filter', f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeDate === f.value
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mx-1" />

      {/* Type row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-8 flex-shrink-0">Type</span>
        <div className="flex gap-1.5 flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setParam('type', f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeType === f.value
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
