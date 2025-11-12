'use client'
import { formatTime, isSameDay } from '@/lib/utils'
import type { Event } from '@/types'

interface DayViewProps {
  events: Event[]
  date: Date
  onEventClick?: (event: Event) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({ events, date, onEventClick }: DayViewProps) {
  // Normalize the view date to start of day in local timezone
  const viewDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // Calculate day boundaries: start of day and start of next day
  const dayStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate())
  const dayEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 1)
  
  const dayEvents = events.filter((e) => {
    const eventStart = new Date(e.startsAtUtc)
    const eventEnd = new Date(e.endsAtUtc)
    // Event overlaps with day if: event starts before day ends AND event ends after day starts
    const overlaps = eventStart < dayEnd && eventEnd > dayStart
    
    return overlaps
  })
  

  const getEventPosition = (event: Event) => {
    const start = new Date(event.startsAtUtc)
    const end = new Date(event.endsAtUtc)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const minutesInDay = 24 * 60
    const top = (startMinutes / minutesInDay) * 100
    const height = ((endMinutes - startMinutes) / minutesInDay) * 100
    return { top: `${top}%`, height: `${Math.max(height, 0.5)}%` }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative min-h-[1200px]">
        {/* Hour markers */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border"
            style={{ top: `${(hour / 24) * 100}%` }}
          >
            <div className="absolute left-0 w-16 text-xs text-muted-foreground px-2 -mt-2">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          </div>
        ))}

        {/* Events */}
        {dayEvents.map((event) => {
          const pos = getEventPosition(event)
          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="absolute left-20 right-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:opacity-80 transition-opacity border-l-2 flex flex-col justify-start min-h-[3rem] overflow-hidden"
              style={{
                top: pos.top,
                height: pos.height,
                backgroundColor: `${event.calendar?.color || '#3b82f6'}20`,
                borderLeftColor: event.calendar?.color || '#3b82f6',
              }}
            >
              <div className="font-semibold leading-tight break-words">{event.title}</div>
              {!event.allDay && (
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {formatTime(new Date(event.startsAtUtc))} - {formatTime(new Date(event.endsAtUtc))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

