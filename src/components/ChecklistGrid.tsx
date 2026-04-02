'use client'

import { CheckItem, DayOfWeek, CheckValue } from '@/lib/types'
import { days, dayLabels } from '@/lib/form-data'
import { Check, X } from 'lucide-react'

interface ChecklistGridProps {
  title: string
  items: CheckItem[]
  onUpdate: (itemId: string, day: DayOfWeek, value: CheckValue) => void
  readOnly?: boolean
}

export default function ChecklistGrid({ title, items, onUpdate, readOnly = false }: ChecklistGridProps) {
  const cycleValue = (current: CheckValue): CheckValue => {
    if (current === null) return 'yes'
    if (current === 'yes') return 'no'
    return null
  }

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold text-lg text-gray-900 mb-4">{title}</h3>
      
      <table className="w-full min-w-[500px]">
        <thead>
          <tr>
            <th className="text-left text-sm font-medium text-gray-600 pb-3 pr-4">Check</th>
            {days.map((day) => (
              <th key={day} className="text-center text-sm font-medium text-gray-600 pb-3 w-12">
                {dayLabels[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-gray-100">
              <td className="py-3 pr-4 text-sm text-gray-700">{item.label}</td>
              {days.map((day) => (
                <td key={day} className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => !readOnly && onUpdate(item.id, day, cycleValue(item.values[day]))}
                    disabled={readOnly}
                    className={`w-10 h-10 rounded-[4px] flex items-center justify-center transition-all touch-manipulation ${
                      readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'
                    } ${
                      item.values[day] === 'yes'
                        ? 'bg-green-500 text-white'
                        : item.values[day] === 'no'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {item.values[day] === 'yes' && <Check className="w-5 h-5" />}
                    {item.values[day] === 'no' && <X className="w-5 h-5" />}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
