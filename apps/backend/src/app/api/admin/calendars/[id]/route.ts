import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icsUrl: z.string().optional(),
  ownerId: z.string().optional(),
  coupleId: z.string().optional(),
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
    // Convert empty strings to null for optional fields
    if (data.ownerId === '') data.ownerId = null;
    if (data.coupleId === '') data.coupleId = null;
    if (data.icsUrl === '') data.icsUrl = null;

    const calendar = await prisma.calendar.update({
      where: { id },
      data,
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
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update calendar' }, { status: 500 });
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
    await prisma.calendar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to delete calendar' }, { status: 500 });
  }
}




