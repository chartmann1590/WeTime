'use client'
import { addDays, formatTime, isSameDay, getStartOfDay } from '@/lib/utils'
import type { Event } from '@/types'

interface WeekViewProps {
  events: Event[]
  weekStart: Date
  onEventClick?: (event: Event) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function WeekView({ events, weekStart, onEventClick }: WeekViewProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEventsForDay = (day: Date) => {
    // Normalize the day to start of day in local timezone
    const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    // Calculate day boundaries: start of day and start of next day
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
    const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() + 1)
    
    return events.filter((e) => {
      const eventStart = new Date(e.startsAtUtc)
      const eventEnd = new Date(e.endsAtUtc)
      // Event overlaps with day if: event starts before day ends AND event ends after day starts
      const overlaps = eventStart < dayEnd && eventEnd > dayStart
      return overlaps
    })
  }

  const getEventPosition = (event: Event, dayIndex: number) => {
    const start = new Date(event.startsAtUtc)
    const end = new Date(event.endsAtUtc)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const top = (startMinutes / 60) * 100
    const height = ((endMinutes - startMinutes) / 60) * 100
    const left = `${(dayIndex / 7) * 100}%`
    const width = `${(1 / 7) * 100}%`
    return { top: `${top}%`, height: `${Math.max(height, 2)}%`, left, width }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-background z-10">
        {weekDays.map((day, idx) => (
          <div key={idx} className="p-2 text-center border-r border-border last:border-r-0">
            <div className="text-xs text-muted-foreground">{DAYS[day.getDay()]}</div>
            <div className="text-lg font-semibold">{day.getDate()}</div>
          </div>
        ))}
      </div>
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

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className="absolute border-r border-border last:border-r-0"
            style={{
              left: `${(dayIndex / 7) * 100}%`,
              width: `${(1 / 7) * 100}%`,
              height: '100%',
            }}
          />

        ))}

        {/* Events */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day)
          return dayEvents.map((event) => {
            const pos = getEventPosition(event, dayIndex)
            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="absolute rounded-md p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity border-l-2"
                style={{
                  top: pos.top,
                  height: pos.height,
                  left: pos.left,
                  width: pos.width,
                  backgroundColor: `${event.calendar?.color || '#3b82f6'}20`,
                  borderLeftColor: event.calendar?.color || '#3b82f6',
                }}
              >
                <div className="font-medium truncate">{event.title}</div>
                {!event.allDay && (
                  <div className="text-muted-foreground text-[10px]">
                    {formatTime(new Date(event.startsAtUtc))}
                  </div>
                )}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}

