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

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#1B4332] text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

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
    <div className="space-y-2.5">
      {/* Date filters */}
      <div className="flex gap-2 flex-wrap">
        {dateFilters.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={activeDate === f.value}
            onClick={() => setParam('filter', f.value)}
          />
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={activeType === f.value}
            onClick={() => setParam('type', f.value)}
          />
        ))}
      </div>
    </div>
  )
}
