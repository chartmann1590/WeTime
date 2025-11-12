import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    startsAtUtc: z.string().optional(),
    endsAtUtc: z.string().optional(),
    allDay: z.boolean().optional(),
    rrule: z.string().optional(),
    exdates: z.array(z.string()).optional(),
    visibility: z.enum(['owner', 'partner']).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...('title' in d ? { title: d.title } : {}),
      ...('description' in d ? { description: d.description } : {}),
      ...('location' in d ? { location: d.location } : {}),
      ...('startsAtUtc' in d ? { startsAtUtc: new Date(d.startsAtUtc!) } : {}),
      ...('endsAtUtc' in d ? { endsAtUtc: new Date(d.endsAtUtc!) } : {}),
      ...('allDay' in d ? { allDay: d.allDay } : {}),
      ...('rrule' in d ? { rrule: d.rrule } : {}),
      ...('exdates' in d ? { exdates: d.exdates } : {}),
      ...('visibility' in d ? { visibility: d.visibility } : {}),
    },
  });
  return NextResponse.json({ event: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
