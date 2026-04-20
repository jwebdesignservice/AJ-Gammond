import { CheckItem } from './types'

// ─── Site Induction & Safety ───────────────────────────────────────────────
// Edit the `label` strings below to change checklist items.
// Add or remove objects to add/remove checklist rows.

export const siteInductionItems: CheckItem[] = [
  { id: 'inducted',       label: 'Have you been inducted?',                              value: null },
  { id: 'rams',           label: 'Have RAMS been Briefed & Understood?',                 value: null },
  { id: 'permit',         label: 'Have you been issued a permit to dig?',                value: null },
  { id: 'briefing',       label: 'Have you received a start of shift briefing?',         value: null },
  { id: 'safe_area',      label: 'Is the work area safe to work?',                       value: null },
  { id: 'hazards',        label: 'Have you walked route to identify Hazards?',           value: null },
  { id: 'ppe',            label: 'Have you Correct PPE?',                                value: null },
  { id: 'ppe_inspected',  label: 'I confirm that all relevant PPE has been inspected',   value: null },
  { id: 'daily_checks',   label: 'I confirm all Daily checks have been made',            value: null },
]

// ─── Machine Daily Checks ──────────────────────────────────────────────────
// Edit the `label` strings below to change checklist items.

export const machineCheckItems: CheckItem[] = [
  { id: 'engine_oil',      label: 'Engine oil levels',                          value: null },
  { id: 'coolant',         label: 'Coolant Levels',                             value: null },
  { id: 'hydraulic_oil',   label: 'Hydraulic Oil Levels',                       value: null },
  { id: 'air_filters',     label: 'Air Filters',                                value: null },
  { id: 'emergency_stops', label: 'Emergency Stops',                            value: null },
  { id: 'fan_belts',       label: 'Fan - Alternator Belts Tension',             value: null },
  { id: 'track_tension',   label: 'Track tension',                              value: null },
  { id: 'digging_chain',   label: 'Digging Chain - Tension, Plates',            value: null },
  { id: 'wheel_segments',  label: 'Wheel - Segments',                           value: null },
  { id: 'grease_points',   label: 'Grease Points',                              value: null },
  { id: 'picks_blocks',    label: 'Picks / Blocks',                             value: null },
  { id: 'cab_dashboard',   label: 'Cab Dashboard - Gauges, Dials, Controls',   value: null },
  { id: 'hydraulic_rams',  label: 'Hydraulic Rams',                             value: null },
  { id: 'engine_cover',    label: 'Engine cover and guards',                    value: null },
  { id: 'camera_system',   label: 'Camera system',                              value: null },
  { id: 'leakages',        label: 'Visual inspection for leakages',             value: null },
  { id: 'lighting',        label: 'Lighting',                                   value: null },
  { id: 'gps',             label: 'GPS (if fitted)',                            value: null },
]
