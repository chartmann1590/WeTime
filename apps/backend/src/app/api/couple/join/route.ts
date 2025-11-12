import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({ code: z.string().min(6).max(12) });

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { code } = parsed.data;
  const couple = await prisma.couple.findUnique({ where: { code }, include: { users: true } });
  if (!couple) return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
  if (couple.users.length >= 2) return NextResponse.json({ error: 'couple_full' }, { status: 409 });
  await prisma.user.update({ where: { id: user.id }, data: { coupleId: couple.id } });
  return NextResponse.json({ ok: true, coupleId: couple.id });
}
