import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({ status: z.enum(['accepted', 'declined', 'tentative', 'needsAction']) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { status } = parsed.data;
  const existing = await prisma.attendee.findFirst({ where: { eventId: id, userId: user.id } });
  if (existing) {
    await prisma.attendee.update({ where: { id: existing.id }, data: { status } });
  } else {
    await prisma.attendee.create({ data: { eventId: id, userId: user.id, status } });
  }
  return NextResponse.json({ ok: true });
}
