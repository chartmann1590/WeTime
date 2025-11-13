import { prisma } from './prisma';

export interface CalendarContext {
  calendars: Array<{
    id: string;
    name: string;
    type: string;
    color: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    location?: string;
    startsAtUtc: string;
    endsAtUtc: string;
    allDay: boolean;
    calendarId: string;
    calendarName: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
    timeZone: string;
  };
}

/**
 * Build calendar context for AI assistant
 */
export async function buildCalendarContext(
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<CalendarContext> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      timeZone: true,
      coupleId: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get calendars (same logic as events route)
  let calendarWhere: any = { OR: [{ ownerId: user.id }, { coupleId: user.coupleId ?? undefined }] };

  if (user.coupleId) {
    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      include: { users: true },
    });
    if (couple) {
      const partner = couple.users.find((u) => u.id !== user.id);
      if (partner) {
        calendarWhere = {
          OR: [
            { ownerId: user.id },
            { coupleId: user.coupleId },
            { ownerId: partner.id, type: 'PERSONAL' },
          ],
        };
      }
    }
  }

  const calendars = await prisma.calendar.findMany({
    where: calendarWhere,
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
    },
  });

  const calIds = calendars.map((c) => c.id);

  // Get events in range
  const events = await prisma.event.findMany({
    where: {
      calendarId: { in: calIds },
      AND: [
        { startsAtUtc: { lt: dateRange.end } },
        { endsAtUtc: { gt: dateRange.start } },
      ],
    },
    include: {
      calendar: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startsAtUtc: 'asc',
    },
  });

  return {
    calendars: calendars.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description || undefined,
      location: e.location || undefined,
      startsAtUtc: e.startsAtUtc.toISOString(),
      endsAtUtc: e.endsAtUtc.toISOString(),
      allDay: e.allDay,
      calendarId: e.calendarId,
      calendarName: e.calendar.name,
    })),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timeZone: user.timeZone,
    },
  };
}

/**
 * Format calendar context as a natural language prompt for AI
 */
export function formatContextAsPrompt(context: CalendarContext, userMessage: string): string {
  const now = new Date();
  const timeZone = context.user.timeZone || 'America/New_York';
  
  // Format current date/time in a clear way
  const currentDateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone 
  });
  const currentTimeStr = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZone 
  });

  // Separate events into past and future
  const pastEvents: typeof context.events = [];
  const futureEvents: typeof context.events = [];
  
  context.events.forEach((event) => {
    const startDate = new Date(event.startsAtUtc);
    if (startDate < now) {
      pastEvents.push(event);
    } else {
      futureEvents.push(event);
    }
  });

  let prompt = `You are a helpful calendar assistant. The user is asking about their calendar.\n\n`;
  prompt += `IMPORTANT DATE CONTEXT:\n`;
  prompt += `- Current date: ${currentDateStr}\n`;
  prompt += `- Current time: ${currentTimeStr} (${timeZone})\n`;
  prompt += `- Current UTC: ${now.toISOString()}\n`;
  prompt += `- User timezone: ${timeZone}\n\n`;
  
  prompt += `User: ${context.user.name} (${context.user.email})\n\n`;

  prompt += `Available calendars:\n`;
  context.calendars.forEach((cal) => {
    prompt += `- ${cal.name} (${cal.type}, ID: ${cal.id}, Color: ${cal.color})\n`;
  });

  // Show future events first (most relevant)
  if (futureEvents.length > 0) {
    prompt += `\n=== UPCOMING/FUTURE EVENTS (These are in the future) ===\n`;
    futureEvents.forEach((event) => {
      const startDate = new Date(event.startsAtUtc);
      const endDate = new Date(event.endsAtUtc);
      const localStart = startDate.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        timeZone 
      });
      const localEnd = endDate.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone 
      });
      
      prompt += `- ${event.title}`;
      if (event.description) prompt += ` (${event.description})`;
      if (event.location) prompt += ` at ${event.location}`;
      prompt += `\n  Calendar: ${event.calendarName}`;
      prompt += `\n  When: ${localStart} - ${localEnd}`;
      if (event.allDay) prompt += ` (All-day)`;
      prompt += `\n  UTC: ${startDate.toISOString()} to ${endDate.toISOString()}\n\n`;
    });
  } else {
    prompt += `\n=== UPCOMING/FUTURE EVENTS ===\n`;
    prompt += `No upcoming events scheduled.\n\n`;
  }

  // Show past events separately (less relevant, but available for context)
  if (pastEvents.length > 0) {
    prompt += `=== PAST EVENTS (These have already happened - only mention if specifically asked) ===\n`;
    pastEvents.slice(-5).forEach((event) => { // Only show last 5 past events
      const startDate = new Date(event.startsAtUtc);
      const endDate = new Date(event.endsAtUtc);
      const localStart = startDate.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        timeZone 
      });
      
      prompt += `- ${event.title} (PAST - was on ${localStart})\n`;
    });
    prompt += `\n`;
  }

  prompt += `\nUser question: ${userMessage}\n\n`;
  prompt += `IMPORTANT INSTRUCTIONS:\n`;
  prompt += `- When the user asks about their schedule, upcoming events, or "what's coming up", ONLY mention FUTURE/UPCOMING events\n`;
  prompt += `- Past events should ONLY be mentioned if the user specifically asks about past events or history\n`;
  prompt += `- Always reference events using the local date/time in ${timeZone} timezone\n`;
  prompt += `- The current date/time is ${currentDateStr} at ${currentTimeStr}\n\n`;
  prompt += `If the user wants to create an event, respond with a JSON object like:\n`;
  prompt += `{"action": "create_event", "title": "Event Title", "description": "...", "location": "...", "startsAt": "2024-01-15T10:00:00Z", "endsAt": "2024-01-15T11:00:00Z", "allDay": false, "calendarId": "calendar-id"}\n`;
  prompt += `Otherwise, provide a helpful text response focusing on FUTURE events when discussing schedules.`;

  return prompt;
}

