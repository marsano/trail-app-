'use client'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { PLAN, type Session } from '@/lib/plan'
import { resolveSessionDate } from '@/lib/plan-helpers'
import { usePlanStore } from '@/lib/store'
import { TypeBadge } from '@/components/TypeBadge'
import { Button } from '@/components/ui/button'
import {
  buildMonthGrid,
  CALENDAR_MONTHS,
  WEEK_DAYS,
} from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

const PREFIX_SESSION = 'session:'
const PREFIX_DAY = 'day:'

function DraggableSession({
  session,
  locked,
}: {
  session: Session
  locked: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${PREFIX_SESSION}${session.id}`,
      disabled: locked,
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-1 flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono text-[10px] text-[var(--text)] sm:text-xs',
        locked && 'opacity-60',
        isDragging && 'z-50 opacity-90 ring-1 ring-[var(--green)]'
      )}
    >
      {!locked ? (
        <button
          type="button"
          className="touch-none p-0.5 text-zinc-500 hover:text-[var(--text)]"
          aria-label="Déplacer"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      ) : null}
      <TypeBadge type={session.type} className="!text-[9px] sm:!text-[10px]" />
      {session.km != null ? (
        <span className="text-zinc-500">{session.km}k</span>
      ) : null}
    </div>
  )
}

function DroppableDay({
  dateStr,
  sessions,
  dateOverrides,
}: {
  dateStr: string
  sessions: Session[]
  dateOverrides: Record<string, string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${PREFIX_DAY}${dateStr}` })
  const resetSessionDate = usePlanStore((s) => s.resetSessionDate)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[88px] border-r border-b border-[var(--border)] bg-[var(--surface)]/40 p-1 sm:min-h-[100px] sm:p-2',
        isOver && 'bg-[var(--green)]/10 ring-1 ring-[var(--green)]/40'
      )}
    >
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-zinc-500 sm:text-xs">
        <span>{dateStr.slice(8)}</span>
      </div>
      <div className="max-h-[140px] space-y-1 overflow-y-auto">
        {sessions.map((s) => {
          const locked = s.type === 'RACE' || s.isEvent === true
          const original = s.date
          const moved = dateOverrides[s.id] != null
          return (
            <div key={s.id}>
              <DraggableSession session={s} locked={locked} />
              {moved ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 py-0 font-mono text-[9px]"
                  onClick={() => resetSessionDate(s.id)}
                >
                  Réinit. ({original})
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function sessionsForDay(
  dateStr: string,
  overrides: Record<string, string>
): Session[] {
  return PLAN.filter((s) => resolveSessionDate(s, overrides) === dateStr)
}

export function CalendarView() {
  const dateOverrides = usePlanStore((s) => s.dateOverrides)
  const moveSession = usePlanStore((s) => s.moveSession)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const aid = String(active.id)
    const oid = String(over.id)
    if (!aid.startsWith(PREFIX_SESSION) || !oid.startsWith(PREFIX_DAY)) return
    const sessionId = aid.slice(PREFIX_SESSION.length)
    const newDate = oid.slice(PREFIX_DAY.length)
    const session = PLAN.find((s) => s.id === sessionId)
    if (!session) return
    if (session.type === 'RACE' || session.isEvent) return
    moveSession(sessionId, newDate)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-10">
        {CALENDAR_MONTHS.map(({ year, monthIndex, label }) => {
          const grid = buildMonthGrid(year, monthIndex)
          return (
            <div key={label}>
              <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--text)]">
                {label}
              </h2>
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-7 border-l border-t border-[var(--border)]">
                    {WEEK_DAYS.map((d) => (
                      <div
                        key={d}
                        className="border-r border-b border-[var(--border)] bg-[var(--bg)] px-1 py-2 text-center font-mono text-[10px] font-semibold uppercase text-zinc-500 sm:text-xs"
                      >
                        {d}
                      </div>
                    ))}
                    {grid.flatMap((row, ri) =>
                      row.map((cell, ci) =>
                        cell.dateStr ? (
                          <DroppableDay
                            key={`${cell.dateStr}-${ri}-${ci}`}
                            dateStr={cell.dateStr}
                            sessions={sessionsForDay(
                              cell.dateStr,
                              dateOverrides
                            )}
                            dateOverrides={dateOverrides}
                          />
                        ) : (
                          <div
                            key={`empty-${ri}-${ci}`}
                            className="border-r border-b border-[var(--border)] bg-[var(--bg)]/50"
                          />
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
