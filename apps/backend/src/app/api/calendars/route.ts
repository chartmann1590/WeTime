import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
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
  
  const calendars = await prisma.calendar.findMany({
    where: calendarWhere,
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ calendars });
}

const postSchema = z.object({
  type: z.enum(['PERSONAL', 'SHARED', 'EXTERNAL', 'IMPORTED']),
  name: z.string().min(1),
  color: z.string().default('#3b82f6'),
  icsUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { type, name, color, icsUrl } = parsed.data;

  const data: any = { type, name, color };
  if (type === 'PERSONAL') data.ownerId = user.id;
  if (type === 'SHARED') data.coupleId = user.coupleId;
  if (type === 'EXTERNAL') data.ownerId = user.id, (data.icsUrl = icsUrl);

  const calendar = await prisma.calendar.create({ data });
  return NextResponse.json({ calendar });
}
