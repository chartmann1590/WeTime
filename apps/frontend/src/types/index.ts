export type CalendarType = 'PERSONAL' | 'SHARED' | 'EXTERNAL' | 'IMPORTED'

export interface Calendar {
  id: string
  ownerId?: string
  coupleId?: string
  type: CalendarType
  name: string
  color: string
  icsUrl?: string
  lastFetched?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  calendarId: string
  calendar?: Calendar
  title: string
  description?: string
  location?: string
  startsAtUtc: string
  endsAtUtc: string
  allDay: boolean
  rrule?: string
  exdates?: string[]
  visibility: 'owner' | 'partner'
  color?: string
  createdById: string
  source: string
  externalUid?: string
  recurrenceInstance?: boolean
}

export interface User {
  id: string
  email: string
  name: string
  timeZone?: string
  coupleId?: string
}

