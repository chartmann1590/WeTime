import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const updateSchema = z.object({
  reminderMinutesBefore: z.number().int().positive().nullable().optional(),
  notifyEmail: z.boolean().optional(),
  notifyWeb: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });

  // Return defaults if no preferences exist
  return NextResponse.json({
    reminderMinutesBefore: prefs?.reminderMinutesBefore ?? null,
    notifyEmail: prefs?.notifyEmail ?? true,
    notifyWeb: prefs?.notifyWeb ?? true,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {
      reminderMinutesBefore: data.reminderMinutesBefore !== undefined ? data.reminderMinutesBefore : undefined,
      notifyEmail: data.notifyEmail,
      notifyWeb: data.notifyWeb,
    },
    create: {
      userId: user.id,
      reminderMinutesBefore: data.reminderMinutesBefore ?? null,
      notifyEmail: data.notifyEmail ?? true,
      notifyWeb: data.notifyWeb ?? true,
    },
  });

  return NextResponse.json({
    reminderMinutesBefore: prefs.reminderMinutesBefore,
    notifyEmail: prefs.notifyEmail,
    notifyWeb: prefs.notifyWeb,
  });
}


