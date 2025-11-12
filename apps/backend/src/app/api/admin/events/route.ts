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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const events = await prisma.event.findMany({
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.event.count();

    return NextResponse.json({ events, total, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}

const createSchema = z.object({
  calendarId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAtUtc: z.string(),
  endsAtUtc: z.string(),
  allDay: z.boolean().optional(),
  rrule: z.string().optional(),
  exdates: z.array(z.string()).optional(),
  visibility: z.enum(['owner', 'partner']).optional(),
  color: z.string().optional(),
  createdById: z.string(),
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

    const event = await prisma.event.create({
      data: {
        calendarId: data.calendarId,
        title: data.title,
        description: data.description,
        location: data.location,
        startsAtUtc: new Date(data.startsAtUtc),
        endsAtUtc: new Date(data.endsAtUtc),
        allDay: data.allDay ?? false,
        rrule: data.rrule,
        exdates: data.exdates || [],
        visibility: data.visibility || 'owner',
        color: data.color,
        createdById: data.createdById,
        source: 'local',
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
  }
}




