'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetHeader, SheetTitle, SheetClose, SheetContent } from '@/components/ui/sheet'
import { api } from '@/lib/api'
import type { Event, Calendar } from '@/types'

interface EventEditorProps {
  open: boolean
  onClose: () => void
  event?: Event | null
  calendars: Calendar[]
  onSave: () => void
  defaultDate?: Date
}

export function EventEditor({ open, onClose, event, calendars, onSave, defaultDate }: EventEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [calendarId, setCalendarId] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setLocation(event.location || '')
      setCalendarId(event.calendarId)
      setAllDay(event.allDay)
      const start = new Date(event.startsAtUtc)
      const end = new Date(event.endsAtUtc)
      setStartDate(start.toISOString().slice(0, 10))
      setStartTime(start.toTimeString().slice(0, 5))
      setEndDate(end.toISOString().slice(0, 10))
      setEndTime(end.toTimeString().slice(0, 5))
    } else if (defaultDate) {
      const date = defaultDate.toISOString().slice(0, 10)
      setStartDate(date)
      setEndDate(date)
      setStartTime('09:00')
      setEndTime('10:00')
      if (calendars.length > 0) {
        setCalendarId(calendars[0].id)
      }
    }
  }, [event, defaultDate, calendars])

  const handleSave = async () => {
    if (!title || !calendarId) return

    setLoading(true)
    try {
      const startsAtUtc = new Date(`${startDate}T${allDay ? '00:00' : startTime}:00`).toISOString()
      const endsAtUtc = new Date(`${endDate}T${allDay ? '23:59' : endTime}:00`).toISOString()

      if (event) {
        await api.events.update(event.id, {
          title,
          description: description || undefined,
          location: location || undefined,
          startsAtUtc,
          endsAtUtc,
          allDay,
        })
      } else {
        await api.events.create({
          calendarId,
          title,
          description: description || undefined,
          location: location || undefined,
          startsAtUtc,
          endsAtUtc,
          allDay,
        })
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetHeader>
        <SheetTitle>{event ? 'Edit Event' : 'New Event'}</SheetTitle>
        <SheetClose onClose={onClose} />
      </SheetHeader>
      <SheetContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Calendar</label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select calendar</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional location" />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">All day</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mb-2"
              />
              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mb-2"
              />
              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading || !title || !calendarId} className="flex-1">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

