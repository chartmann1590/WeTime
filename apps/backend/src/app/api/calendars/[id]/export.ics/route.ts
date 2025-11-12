import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { toIcs } from '@/lib/ics';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const cal = await prisma.calendar.findUnique({ where: { id } });
  if (!cal) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const events = await prisma.event.findMany({ where: { calendarId: cal.id } });
  const ics = toIcs(
    events.map((e: typeof events[number]) => ({
      title: e.title,
      description: e.description || undefined,
      location: e.location || undefined,
      start: [e.startsAtUtc.getUTCFullYear(), e.startsAtUtc.getUTCMonth() + 1, e.startsAtUtc.getUTCDate(), e.startsAtUtc.getUTCHours(), e.startsAtUtc.getUTCMinutes()],
      end: [e.endsAtUtc.getUTCFullYear(), e.endsAtUtc.getUTCMonth() + 1, e.endsAtUtc.getUTCDate(), e.endsAtUtc.getUTCHours(), e.endsAtUtc.getUTCMinutes()],
      uid: e.externalUid || e.id,
      recurrenceRule: e.rrule || undefined,
    }))
  );

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="calendar-${cal.id}.ics"`,
    },
  });
}
