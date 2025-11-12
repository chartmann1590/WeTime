import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseIcs } from '@/lib/ics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const token = req.headers.get('x-internal-cron-token');
  if (!token || token !== process.env.INTERNAL_CRON_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const externals = await prisma.calendar.findMany({ where: { type: 'EXTERNAL' }, include: { owner: true } });
  let total = 0;
  for (const cal of externals) {
    if (!cal.icsUrl || !cal.ownerId) continue;
    try {
      const res = await fetch(cal.icsUrl, {
        headers: cal.etag ? { 'If-None-Match': cal.etag } : {},
      });
      if (res.status === 304) continue; // Not modified
      if (!res.ok) continue;
      const etag = res.headers.get('etag');
      const text = await res.text();
      const entries = parseIcs(text);
      total += entries.length;
      for (const e of entries) {
        const externalUid = e.uid || undefined;
        const data: any = {
          calendarId: cal.id,
          title: e.title,
          description: e.description,
          location: e.location,
          startsAtUtc: e.dtstart,
          endsAtUtc: e.dtend,
          rrule: e.rrule,
          exdates: e.exdates || [],
          source: 'external',
          externalUid,
          createdById: cal.ownerId,
        };
        const existing = externalUid ? await prisma.event.findFirst({ where: { externalUid, calendarId: cal.id } }) : null;
        if (existing) {
          await prisma.event.update({ where: { id: existing.id }, data });
        } else {
          await prisma.event.create({ data });
        }
      }
      await prisma.calendar.update({
        where: { id: cal.id },
        data: { lastFetched: new Date(), etag: etag || undefined },
      });
    } catch (error) {
      console.error(`Failed to refresh calendar ${cal.id}:`, error);
    }
  }
  return NextResponse.json({ refreshed: externals.length, events: total });
}
