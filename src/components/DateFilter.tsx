'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

export default function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('filter') ?? 'all'

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            active === f.value
              ? 'bg-[#1B4332] text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
