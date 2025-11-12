import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { parseIcs } from '@/lib/ics';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const cal = await prisma.calendar.findUnique({ where: { id } });
  if (!cal || cal.ownerId !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!cal.icsUrl) return NextResponse.json({ error: 'not_external' }, { status: 400 });

  const res = await fetch(cal.icsUrl);
  if (!res.ok) return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  const text = await res.text();
  const entries = parseIcs(text);

  // Upsert by externalUid + calendar
  for (const e of entries) {
    const externalUid = e.uid;
    const createdById = user.id;
    const data: any = {
      calendarId: cal.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startsAtUtc: e.dtstart,
      endsAtUtc: e.dtend,
      createdById,
      source: 'external',
      rrule: e.rrule,
      exdates: e.exdates || [],
      externalUid,
    };
    if (externalUid) {
      const existing = await prisma.event.findFirst({ where: { externalUid, calendarId: cal.id } });
      if (existing) {
        await prisma.event.update({ where: { id: existing.id }, data });
      } else {
        await prisma.event.create({ data });
      }
    } else {
      await prisma.event.create({ data });
    }
  }

  await prisma.calendar.update({ where: { id: cal.id }, data: { lastFetched: new Date() } });
  return NextResponse.json({ imported: entries.length });
}
