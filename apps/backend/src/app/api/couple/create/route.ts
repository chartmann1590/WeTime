import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Generate unique couple code
  let code = generateCode();
  while (await prisma.couple.findUnique({ where: { code } })) code = generateCode();
  
  // Create shared calendar first (without coupleId initially)
  const shared = await prisma.calendar.create({ 
    data: { 
      type: 'SHARED', 
      name: 'Shared', 
      color: '#10b981',
    } 
  });
  
  // Create couple with shared calendar ID
  const couple = await prisma.couple.create({ 
    data: { 
      code,
      sharedCalendarId: shared.id,
    } 
  });
  
  // Update shared calendar with coupleId
  await prisma.calendar.update({
    where: { id: shared.id },
    data: { coupleId: couple.id },
  });
  
  // Link user to couple
  await prisma.user.update({ where: { id: user.id }, data: { coupleId: couple.id } });

  return NextResponse.json({ code, coupleId: couple.id });
}
