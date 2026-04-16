'use client'

import { CheckItem, CheckValue, DayOfWeek } from '@/lib/types'
import { Check, X } from 'lucide-react'

interface ChecklistGridProps {
  title: string
  items: CheckItem[]
  onUpdate?: (itemId: string, value: CheckValue) => void
  readOnly?: boolean
  showValidation?: boolean
}

// Cycle: empty → yes → no → empty
function cycleValue(current: CheckValue): CheckValue {
  if (current === null) return 'yes'
  if (current === 'yes') return 'no'
  return null
}

// For legacy multi-day submissions: pick the most recently filled day value
function legacyValue(values: Record<DayOfWeek, CheckValue>): CheckValue {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  for (const day of [...days].reverse()) {
    if (values[day] !== null) return values[day]
  }
  return null
}

export default function ChecklistGrid({ title, items, onUpdate, readOnly = false, showValidation = false }: ChecklistGridProps) {
  const unansweredCount = showValidation ? items.filter(i => i.value === null || i.value === undefined).length : 0

  return (
    <div className={`card ${showValidation && unansweredCount > 0 ? 'border-red-200' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        {showValidation && unansweredCount > 0 && (
          <span className="text-xs font-semibold text-red-500">{unansweredCount} unanswered</span>
        )}
      </div>

      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pb-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">Check Item</span>
          <span className="text-sm font-medium text-gray-500 w-20 text-center">Status</span>
        </div>

        {items.map((item) => {
          // Support both new (value) and legacy (values) formats
          const currentValue: CheckValue =
            item.value !== undefined
              ? item.value
              : item.values
              ? legacyValue(item.values)
              : null

          const isUnanswered = showValidation && (currentValue === null || currentValue === undefined)

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between px-3 py-2 rounded-[3px] transition-colors ${isUnanswered ? 'bg-red-50' : 'hover:bg-gray-50'}`}
            >
              <span className="text-sm text-gray-700 flex-1 pr-4">{item.label}</span>

              <button
                type="button"
                onClick={() => !readOnly && onUpdate?.(item.id, cycleValue(currentValue))}
                disabled={readOnly}
                aria-label={`${item.label}: ${currentValue ?? 'not checked'}`}
                className={`w-20 h-10 rounded-[3px] flex items-center justify-center gap-1.5 text-sm font-medium transition-all touch-manipulation flex-shrink-0 ${
                  readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'
                } ${
                  currentValue === 'yes'
                    ? 'bg-green-500 text-white'
                    : currentValue === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {currentValue === 'yes' && <><Check className="w-4 h-4" /> Yes</>}
                {currentValue === 'no' && <><X className="w-4 h-4" /> No</>}
                {currentValue === null && <span>—</span>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
