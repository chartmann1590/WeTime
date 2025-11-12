import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { parseIcs } from '@/lib/ics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let icsText = '';
  if (contentType.includes('multipart/form-data')) {
    const form = await (req as any).formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file_required' }, { status: 400 });
    icsText = await file.text();
  } else {
    const body = await req.json().catch(() => ({}));
    icsText = body.icsText || '';
  }
  if (!icsText) return NextResponse.json({ error: 'invalid_ics' }, { status: 400 });

  const calendar = await prisma.calendar.create({ data: { ownerId: user.id, type: 'IMPORTED', name: 'Imported', color: '#f59e0b' } });
  const entries = parseIcs(icsText);

  for (const e of entries) {
    await prisma.event.create({
      data: {
        calendarId: calendar.id,
        title: e.title,
        description: e.description,
        location: e.location,
        startsAtUtc: e.dtstart,
        endsAtUtc: e.dtend,
        rrule: e.rrule,
        exdates: e.exdates || [],
        createdById: user.id,
        source: 'imported',
        externalUid: e.uid,
      },
    });
  }

  return NextResponse.json({ calendarId: calendar.id, imported: entries.length });
}
