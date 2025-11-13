import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await requireAdmin(req as any);
  } catch (e) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Find all events grouped by duplicate criteria (same calendar, start time, end time, and title)
    const allEvents = await prisma.event.findMany({
      orderBy: { createdAt: 'asc' }, // Keep the oldest one
    });

    // Group events by duplicate key
    const duplicates = new Map<string, typeof allEvents>();
    
    for (const event of allEvents) {
      // Create a key based on calendar, start time, end time, and title
      const key = `${event.calendarId}_${event.startsAtUtc.toISOString()}_${event.endsAtUtc.toISOString()}_${event.title}`;
      
      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }
      duplicates.get(key)!.push(event);
    }

    // Find groups with duplicates (more than 1 event)
    const duplicateGroups = Array.from(duplicates.values()).filter(group => group.length > 1);
    
    let deletedCount = 0;
    const eventIdsToDelete: string[] = [];

    for (const group of duplicateGroups) {
      // Keep the first (oldest) event, delete the rest
      const toKeep = group[0];
      const toDelete = group.slice(1);
      
      for (const event of toDelete) {
        eventIdsToDelete.push(event.id);
      }
    }

    // Delete duplicate events
    if (eventIdsToDelete.length > 0) {
      await prisma.event.deleteMany({
        where: { id: { in: eventIdsToDelete } },
      });
      deletedCount = eventIdsToDelete.length;
    }

    return NextResponse.json({ 
      deleted: deletedCount,
      duplicateGroups: duplicateGroups.length,
      message: `Removed ${deletedCount} duplicate events from ${duplicateGroups.length} duplicate groups`
    });
  } catch (error: any) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json({ error: error.message || 'Failed to cleanup duplicates' }, { status: 500 });
  }
}





