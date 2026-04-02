import { CheckItem, DayOfWeek } from './types'

const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const emptyValues = (): Record<DayOfWeek, null> => ({
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
})

export const siteInductionItems: CheckItem[] = [
  { id: 'inducted', label: 'Have you been inducted?', values: emptyValues() },
  { id: 'rams', label: 'Have RAMS been Briefed & Understood?', values: emptyValues() },
  { id: 'permit', label: 'Have you been issued a permit to dig?', values: emptyValues() },
  { id: 'briefing', label: 'Have you received a start of shift briefing?', values: emptyValues() },
  { id: 'safe_area', label: 'Is the work area safe to work?', values: emptyValues() },
  { id: 'hazards', label: 'Have you walked route to identify Hazards?', values: emptyValues() },
  { id: 'ppe', label: 'Have you Correct PPE?', values: emptyValues() },
  { id: 'ppe_inspected', label: 'I confirm that all relevant PPE has been inspected', values: emptyValues() },
  { id: 'daily_checks', label: 'I confirm all Daily checks have been made', values: emptyValues() },
]

export const machineCheckItems: CheckItem[] = [
  { id: 'engine_oil', label: 'Engine oil levels', values: emptyValues() },
  { id: 'coolant', label: 'Coolant Levels', values: emptyValues() },
  { id: 'hydraulic_oil', label: 'Hydraulic Oil Levels', values: emptyValues() },
  { id: 'air_filters', label: 'Air Filters', values: emptyValues() },
  { id: 'emergency_stops', label: 'Emergency Stops', values: emptyValues() },
  { id: 'fan_belts', label: 'Fan Belts tension', values: emptyValues() },
  { id: 'track_tension', label: 'Track tension', values: emptyValues() },
  { id: 'digging_chain', label: 'Digging Chain - Tension, Plates', values: emptyValues() },
  { id: 'grease_points', label: 'Grease Points', values: emptyValues() },
  { id: 'picks_blocks', label: 'Picks / Blocks', values: emptyValues() },
  { id: 'cab_dashboard', label: 'Cab Dashboard - Gauges, Dials, Controls', values: emptyValues() },
  { id: 'hydraulic_rams', label: 'Hydraulic Rams', values: emptyValues() },
  { id: 'engine_cover', label: 'Engine cover and guards', values: emptyValues() },
  { id: 'camera_system', label: 'Camera system', values: emptyValues() },
  { id: 'leakages', label: 'Visual inspection for leakages', values: emptyValues() },
  { id: 'lighting', label: 'Lighting', values: emptyValues() },
  { id: 'gps', label: 'GPS (if fitted)', values: emptyValues() },
]

export const dayLabels: Record<DayOfWeek, string> = {
  mon: 'M',
  tue: 'T',
  wed: 'W',
  thu: 'T',
  fri: 'F',
  sat: 'S',
  sun: 'S',
}

export { days }
