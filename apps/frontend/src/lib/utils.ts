import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date)
}

export function formatTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function formatDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function getStartOfDay(date: Date, timeZone?: string): Date {
  const str = date.toLocaleString('en-US', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
  const [month, day, year] = str.split('/')
  return new Date(`${year}-${month}-${day}T00:00:00`)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  // Normalize both dates to start of day in local timezone for comparison
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return aDate.getTime() === bDate.getTime()
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function filterEventsByOwner(
  events: any[],
  currentUserId: string,
  partnerId: string | null
): { currentUserEvents: any[]; partnerEvents: any[]; sharedEvents: any[] } {
  const currentUserEvents: any[] = []
  const partnerEvents: any[] = []
  const sharedEvents: any[] = []

  for (const event of events) {
    const calendar = event.calendar
    const isSharedCalendar = calendar?.coupleId && !calendar?.ownerId
    const isSharedEvent = event.visibility === 'partner'
    const isCurrentUserCalendar = calendar?.ownerId === currentUserId
    const isPartnerCalendar = partnerId && calendar?.ownerId === partnerId
    const isCurrentUserCreated = event.createdById === currentUserId
    const isPartnerCreated = partnerId && event.createdById === partnerId

    // Shared calendar events (from shared calendar) go to both columns
    // Events with visibility='partner' also go to both columns (shared events)
    if (isSharedCalendar || isSharedEvent) {
      sharedEvents.push(event)
      continue
    }

    // Primary: Calendar owner
    if (isCurrentUserCalendar) {
      currentUserEvents.push(event)
    } else if (isPartnerCalendar) {
      partnerEvents.push(event)
    } else {
      // Secondary: Event creator (fallback)
      if (isCurrentUserCreated) {
        currentUserEvents.push(event)
      } else if (isPartnerCreated) {
        partnerEvents.push(event)
      } else {
        // Default to current user if we can't determine
        currentUserEvents.push(event)
      }
    }
  }

  return { currentUserEvents, partnerEvents, sharedEvents }
}

