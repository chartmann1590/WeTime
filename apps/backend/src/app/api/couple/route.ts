import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!user.coupleId) {
    return NextResponse.json({ couple: null });
  }

  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!couple) {
    return NextResponse.json({ couple: null });
  }

  // Return couple info with partner info (the other user)
  const partner = couple.users.find((u: typeof couple.users[number]) => u.id !== user.id);

  return NextResponse.json({
    couple: {
      id: couple.id,
      code: couple.code,
      partner: partner || null,
      createdAt: couple.createdAt,
    },
  });
}



