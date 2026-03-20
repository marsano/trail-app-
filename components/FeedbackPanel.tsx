'use client'

import { usePlanStore, getSessionState } from '@/lib/store'
import { Button } from '@/components/ui/button'

const RATINGS = [
  { v: 1 as const, emoji: '😵' },
  { v: 2 as const, emoji: '😓' },
  { v: 3 as const, emoji: '😐' },
  { v: 4 as const, emoji: '💪' },
  { v: 5 as const, emoji: '🔥' },
]

export function FeedbackPanel({ sessionId }: { sessionId: string }) {
  const sessionStates = usePlanStore((s) => s.sessionStates)
  const setRating = usePlanStore((s) => s.setRating)
  const setNote = usePlanStore((s) => s.setNote)
  const st = getSessionState(sessionStates, sessionId)

  return (
    <div className="mt-3 space-y-3 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
      <div>
        <p className="mb-2 font-mono text-xs text-[var(--text)]/70">Ressenti</p>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map(({ v, emoji }) => (
            <Button
              key={v}
              type="button"
              variant={st.rating === v ? 'primary' : 'ghost'}
              size="sm"
              className="min-h-[44px] min-w-[44px] text-lg"
              onClick={() => setRating(sessionId, v)}
              aria-label={`Note ${v}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label
          htmlFor={`note-${sessionId}`}
          className="mb-1 block font-mono text-xs text-[var(--text)]/70"
        >
          Notes
        </label>
        <textarea
          id={`note-${sessionId}`}
          rows={3}
          value={st.note}
          onChange={(e) => setNote(sessionId, e.target.value)}
          className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--green)]"
          placeholder="Commentaire libre…"
        />
      </div>
    </div>
  )
}
