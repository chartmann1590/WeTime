'use client'
import { addDays, getMonthStart, getDaysInMonth, isSameDay, formatDate } from '@/lib/utils'
import type { Event } from '@/types'

interface MonthViewProps {
  events: Event[]
  month: Date
  onEventClick?: (event: Event) => void
  onDayClick?: (date: Date) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ events, month, onEventClick, onDayClick }: MonthViewProps) {
  const monthStart = getMonthStart(month)
  const daysInMonth = getDaysInMonth(month)
  const startDay = monthStart.getDay()
  const weeks = Math.ceil((startDay + daysInMonth) / 7)

  const getEventsForDay = (date: Date) => {
    // Normalize the date to start of day in local timezone
    const dateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    return events.filter((e) => {
      const eventDate = new Date(e.startsAtUtc)
      // Normalize event date to start of day in local timezone
      const eventLocalDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      return eventLocalDate.getTime() === dateDate.getTime()
    })
  }

  const today = new Date()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-background z-10">
        {DAYS.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const date = addDays(monthStart, i - startDay)
          const isCurrentMonth = date.getMonth() === month.getMonth()
          const isToday = isSameDay(date, today)
          const dayEvents = isCurrentMonth ? getEventsForDay(date) : []

          return (
            <div
              key={i}
              onClick={() => onDayClick?.(date)}
              className={`min-h-[100px] border-r border-b border-border p-1 cursor-pointer hover:bg-accent/50 transition-colors ${
                !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`text-sm mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${event.calendar?.color || '#3b82f6'}20`,
                      color: event.calendar?.color || '#3b82f6',
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

