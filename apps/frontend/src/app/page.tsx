'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AgendaView } from '@/components/calendar/agenda-view'
import { DayView } from '@/components/calendar/day-view'
import { WeekView } from '@/components/calendar/week-view'
import { MonthView } from '@/components/calendar/month-view'
import { EventEditor } from '@/components/event-editor'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { addDays, addWeeks, addMonths, getWeekStart, getMonthStart } from '@/lib/utils'
import { Calendar, Settings, Plus, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import type { Event, Calendar as CalendarType } from '@/types'

type View = 'agenda' | 'day' | '3day' | 'week' | 'month'

export default function Home() {
  const router = useRouter()
  const { logout } = useAuth()
  const [view, setView] = useState<View>('agenda')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [calendars, setCalendars] = useState<CalendarType[]>([])
  const [eventEditorOpen, setEventEditorOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const rangeStart = getRangeStart(currentDate, view)
      const rangeEnd = getRangeEnd(currentDate, view)
      console.log('loadData:', {
        view,
        currentDate: currentDate.toLocaleDateString(),
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString(),
        rangeStartLocal: rangeStart.toLocaleString(),
        rangeEndLocal: rangeEnd.toLocaleString(),
      })
      
      const [calendarsRes, eventsRes] = await Promise.all([
        api.calendars.list(),
        api.events.list(rangeStart, rangeEnd),
      ])
      setCalendars(calendarsRes.calendars || [])
      
      // Enrich events with calendar data
      const enrichedEvents = (eventsRes.events || []).map((event: Event) => ({
        ...event,
        calendar: calendarsRes.calendars?.find((c: CalendarType) => c.id === event.calendarId),
      }))
      console.log('Loaded events:', enrichedEvents.length, 'for view:', view)
      enrichedEvents.forEach((e: Event) => {
        const d = new Date(e.startsAtUtc)
        console.log('  Event:', e.title, 'UTC:', e.startsAtUtc, 'Local:', d.toLocaleString())
      })
      setEvents(enrichedEvents)
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [currentDate, view, router])

  useEffect(() => {
    // Only load data if we have a valid session
    const checkAuth = async () => {
      try {
        await api.calendars.list()
        loadData()
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [loadData, router])

  const getRangeStart = (date: Date, view: View): Date => {
    switch (view) {
      case 'day':
      case '3day': {
        // Create date at start of day in local timezone
        const localStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        // Return as-is - toISOString() will convert to UTC correctly
        return localStart
      }
      case 'week': {
        const weekStart = getWeekStart(date)
        // Normalize week start to midnight in local timezone
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
      }
      case 'month':
        return getMonthStart(date)
      default:
        return new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const getRangeEnd = (date: Date, view: View): Date => {
    switch (view) {
      case 'day': {
        // Create date at end of day (start of next day) in local timezone
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        // Add 1 day and create new date at midnight
        return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() + 1)
      }
      case '3day': {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        // Add 3 days and create new date at midnight
        return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() + 3)
      }
      case 'week': {
        const weekStart = getWeekStart(date)
        // Normalize week start to midnight in local timezone
        const normalizedWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        // Add 7 days and create new date at midnight
        return new Date(normalizedWeekStart.getFullYear(), normalizedWeekStart.getMonth(), normalizedWeekStart.getDate() + 7)
      }
      case 'month': {
        const monthStart = getMonthStart(date)
        // Add 1 month and create new date at midnight
        return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, monthStart.getDate())
      }
      default:
        return addDays(date, 30)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1
    switch (view) {
      case 'day':
      case '3day':
        setCurrentDate(addDays(currentDate, amount))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, amount))
        break
      case 'month':
        setCurrentDate(addMonths(currentDate, amount))
        break
      default:
        setCurrentDate(addDays(currentDate, amount * 7))
    }
  }

  const handleNewEvent = () => {
    setSelectedEvent(null)
    setEventEditorOpen(true)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setEventEditorOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">WeTime</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                  ...(view === 'day' && { day: 'numeric' }),
                })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={async () => { await logout(); router.push('/login') }}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Button onClick={handleNewEvent} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-t border-border">
          {(['agenda', 'day', '3day', 'week', 'month'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                view === v
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === '3day' ? '3-Day' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        {view === 'agenda' && <AgendaView events={events} currentDate={currentDate} />}
        {view === 'day' && <DayView events={events} date={currentDate} onEventClick={handleEventClick} />}
        {view === '3day' && (
          <div className="grid grid-cols-3 gap-4 h-full">
            {[0, 1, 2].map((offset) => (
              <div key={offset} className="border-r border-border last:border-r-0">
                <DayView
                  events={events}
                  date={addDays(currentDate, offset)}
                  onEventClick={handleEventClick}
                />
              </div>
            ))}
          </div>
        )}
        {view === 'week' && (
          <WeekView
            events={events}
            weekStart={getWeekStart(currentDate)}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'month' && (
          <MonthView
            events={events}
            month={currentDate}
            onEventClick={handleEventClick}
            onDayClick={(date) => {
              setCurrentDate(date)
              setView('day')
            }}
          />
        )}
      </main>

      {/* Event Editor */}
      <EventEditor
        open={eventEditorOpen}
        onClose={() => {
          setEventEditorOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
        calendars={calendars}
        onSave={loadData}
        defaultDate={currentDate}
      />
    </div>
  )
}
