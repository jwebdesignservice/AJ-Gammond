import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DustCollectorsChecklistPage() {
  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link
          href="/dashboard"
          className="w-9 h-9 bg-white rounded-[3px] border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-[#1B4332]">AJ Gammond Ltd</span> Daily Checklist — Dust Collectors
          </h1>
          <p className="text-gray-500 text-sm mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
