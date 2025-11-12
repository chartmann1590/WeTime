'use client'
import { formatDateTime, isSameDay } from '@/lib/utils'
import type { Event } from '@/types'

interface AgendaViewProps {
  events: Event[]
  currentDate: Date
}

export function AgendaView({ events, currentDate }: AgendaViewProps) {
  const sorted = [...events].sort((a, b) => new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime())
  const grouped = sorted.reduce((acc, event) => {
    const date = new Date(event.startsAtUtc)
    const key = date.toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey)
        const isToday = isSameDay(date, currentDate)
        return (
          <div key={dateKey} className="space-y-2">
            <div className={`sticky top-0 z-10 bg-background py-2 ${isToday ? 'text-primary font-semibold' : ''}`}>
              <h3 className="text-sm uppercase tracking-wide">
                {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-border">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  style={{ borderLeftColor: event.calendar?.color || '#3b82f6' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(new Date(event.startsAtUtc))}
                        {!event.allDay && ` - ${formatDateTime(new Date(event.endsAtUtc))}`}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                      style={{ backgroundColor: event.calendar?.color || '#3b82f6' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No events scheduled</p>
        </div>
      )}
    </div>
  )
}

