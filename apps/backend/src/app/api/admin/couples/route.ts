import { NextResponse } from 'next/server';
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
    const couples = await prisma.couple.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        sharedCalendar: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            calendars: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ couples });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch couples' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
    }

    await prisma.couple.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to delete couple' }, { status: 500 });
  }
}





