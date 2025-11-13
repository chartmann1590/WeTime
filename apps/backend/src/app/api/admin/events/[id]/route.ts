import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  calendarId: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAtUtc: z.string().optional(),
  endsAtUtc: z.string().optional(),
  allDay: z.boolean().optional(),
  rrule: z.string().optional(),
  exdates: z.array(z.string()).optional(),
  visibility: z.enum(['owner', 'partner']).optional(),
  color: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    
    // Convert date strings to Date objects
    if (data.startsAtUtc) data.startsAtUtc = new Date(data.startsAtUtc);
    if (data.endsAtUtc) data.endsAtUtc = new Date(data.endsAtUtc);

    const event = await prisma.event.update({
      where: { id },
      data,
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
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 500 });
  }
}






