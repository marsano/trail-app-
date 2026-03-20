/** Monday = 0 … Sunday = 6 (European week) */
export function weekdayMonday0(d: Date): number {
  const js = d.getDay()
  return (js + 6) % 7
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type CalendarCell = {
  dateStr: string | null
  inMonth: boolean
  dayNum: number | null
}

/** monthIndex: 0 = January */
export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[][] {
  const first = new Date(year, monthIndex, 1)
  const pad = weekdayMonday0(first)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()

  const cells: CalendarCell[] = []
  for (let i = 0; i < pad; i++) {
    cells.push({ dateStr: null, inMonth: false, dayNum: null })
  }
  for (let day = 1; day <= lastDay; day++) {
    const dt = new Date(year, monthIndex, day)
    cells.push({
      dateStr: toISODate(dt),
      inMonth: true,
      dayNum: day,
    })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateStr: null, inMonth: false, dayNum: null })
  }

  const rows: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}

export const CALENDAR_MONTHS: { year: number; monthIndex: number; label: string }[] =
  [
    { year: 2026, monthIndex: 3, label: 'Avril 2026' },
    { year: 2026, monthIndex: 4, label: 'Mai 2026' },
    { year: 2026, monthIndex: 5, label: 'Juin 2026' },
  ]

export const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
