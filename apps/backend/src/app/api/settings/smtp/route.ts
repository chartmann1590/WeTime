import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

const schema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  secure: z.boolean().optional(),
  username: z.string(),
  password: z.string(),
  fromName: z.string(),
  fromEmail: z.string().email(),
});

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const saved = await prisma.smtpSetting.upsert({
    where: { userId: user.id },
    update: {
      host: d.host,
      port: d.port,
      secure: d.secure ?? true,
      username: d.username,
      password: encrypt(d.password),
      fromName: d.fromName,
      fromEmail: d.fromEmail,
    },
    create: {
      userId: user.id,
      host: d.host,
      port: d.port,
      secure: d.secure ?? true,
      username: d.username,
      password: encrypt(d.password),
      fromName: d.fromName,
      fromEmail: d.fromEmail,
    },
  });
  return NextResponse.json({ ok: true, settingId: saved.id });
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await prisma.smtpSetting.findUnique({ where: { userId: user.id } });
  if (!s) return NextResponse.json({});
  return NextResponse.json({
    host: s.host,
    port: s.port,
    secure: s.secure,
    username: s.username,
    fromName: s.fromName,
    fromEmail: s.fromEmail,
    // never return password
  });
}
