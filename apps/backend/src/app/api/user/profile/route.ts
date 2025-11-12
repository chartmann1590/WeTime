import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      coupleId: user.coupleId,
      isAdmin: user.isAdmin,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, name } = parsed.data;

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'email_taken' }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      coupleId: updated.coupleId,
    },
  });
}

