import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const calendars = await prisma.calendar.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        couple: {
          select: {
            id: true,
            code: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ calendars });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch calendars' }, { status: 500 });
  }
}

const createSchema = z.object({
  ownerId: z.string().optional(),
  coupleId: z.string().optional(),
  type: z.enum(['PERSONAL', 'SHARED', 'EXTERNAL', 'IMPORTED']),
  name: z.string().min(1),
  color: z.string().optional(),
  icsUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    
    // Validate ownerId or coupleId is provided
    if (!data.ownerId && !data.coupleId) {
      return NextResponse.json({ error: 'Either ownerId or coupleId must be provided' }, { status: 400 });
    }

    const calendar = await prisma.calendar.create({
      data: {
        ownerId: data.ownerId || undefined,
        coupleId: data.coupleId || undefined,
        type: data.type,
        name: data.name,
        color: data.color || '#3b82f6',
        icsUrl: data.icsUrl || undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        couple: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ calendar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create calendar' }, { status: 500 });
  }
}

