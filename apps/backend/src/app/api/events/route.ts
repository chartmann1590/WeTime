import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { expandRecurrence } from '@/lib/ics';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const start = new Date(searchParams.get('rangeStart') || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());
  const end = new Date(searchParams.get('rangeEnd') || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString());

  // Get calendars: user's personal, shared, and partner's personal (if in a couple)
  let calendarWhere: any = { OR: [{ ownerId: user.id }, { coupleId: user.coupleId ?? undefined }] };
  
  if (user.coupleId) {
    // Get partner's user ID
    const couple = await prisma.couple.findUnique({
      where: { id: user.coupleId },
      include: { users: true },
    });
    if (couple) {
      const partner = couple.users.find((u: typeof couple.users[number]) => u.id !== user.id);
      if (partner) {
        // Include partner's personal calendars
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

  const calendars = await prisma.calendar.findMany({ where: calendarWhere });
  const calIds = calendars.map((c: typeof calendars[number]) => c.id);
  // Filter events that overlap with the requested date range
  // An event overlaps if: startsAtUtc < end AND endsAtUtc > start
  const events = await prisma.event.findMany({ 
    where: { 
      calendarId: { in: calIds },
      // Event overlaps with range if it starts before range ends AND ends after range starts
      AND: [
        { startsAtUtc: { lt: end } },
        { endsAtUtc: { gt: start } }
      ]
    },
    include: {
      calendar: {
        select: {
          id: true,
          ownerId: true,
          coupleId: true,
          type: true,
          name: true,
          color: true,
        }
      }
    }
  });

  // Expand recurring events within range
  const expanded: any[] = [];
  for (const e of events) {
    if (e.rrule) {
      const dates = expandRecurrence(e.rrule, e.exdates as any, { start, end });
      for (const d of dates) {
        const dur = e.endsAtUtc.getTime() - e.startsAtUtc.getTime();
        const startsAtUtc = new Date(d);
        const endsAtUtc = new Date(startsAtUtc.getTime() + dur);
        expanded.push({ 
          ...e, 
          startsAtUtc, 
          endsAtUtc, 
          recurrenceInstance: true,
          calendar: e.calendar
        });
      }
    } else {
      expanded.push(e);
    }
  }
  return NextResponse.json({ events: expanded });
}

const postSchema = z.object({
  calendarId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAtUtc: z.string(),
  endsAtUtc: z.string(),
  allDay: z.boolean().optional(),
  rrule: z.string().optional(),
  exdates: z.array(z.string()).optional(),
  visibility: z.enum(['owner', 'partner']).optional(),
});

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const created = await prisma.event.create({
    data: {
      calendarId: data.calendarId,
      title: data.title,
      description: data.description,
      location: data.location,
      startsAtUtc: new Date(data.startsAtUtc),
      endsAtUtc: new Date(data.endsAtUtc),
      allDay: data.allDay ?? false,
      rrule: data.rrule,
      exdates: data.exdates || [],
      visibility: data.visibility || 'owner',
      createdById: user.id,
      source: 'local',
    },
  });
  return NextResponse.json({ event: created });
}
