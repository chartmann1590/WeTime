import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chat, parseEventCreation } from '@/lib/ollama';
import { buildCalendarContext, formatContextAsPrompt } from '@/lib/ai-context';

export const runtime = 'nodejs';

const chatSchema = z.object({
  message: z.string().min(1),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get user's AI assistant settings
    const settings = await prisma.aiAssistantSetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings || !settings.ollamaUrl || !settings.selectedModel) {
      return NextResponse.json(
        { error: 'AI assistant not configured. Please configure Ollama settings first.' },
        { status: 400 }
      );
    }

    // Determine date range for calendar context
    const now = new Date();
    const dateRangeStart = parsed.data.dateRangeStart
      ? new Date(parsed.data.dateRangeStart)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const dateRangeEnd = parsed.data.dateRangeEnd
      ? new Date(parsed.data.dateRangeEnd)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    // Build calendar context
    const context = await buildCalendarContext(user.id, {
      start: dateRangeStart,
      end: dateRangeEnd,
    });

    // Format context as prompt
    const systemPrompt = formatContextAsPrompt(context, parsed.data.message);

    // Send to Ollama (with CPU mode if configured)
    let aiResponse: string;
    try {
      aiResponse = await chat(
        settings.ollamaUrl,
        settings.selectedModel,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: parsed.data.message },
        ],
        { use_cpu: settings.useCpu || false }
      );
    } catch (error: any) {
      // If CUDA error and CPU mode not enabled, try with CPU fallback
      if (
        (error.message?.includes('CUDA') || error.message?.includes('GPU')) &&
        !settings.useCpu
      ) {
        console.log('CUDA error detected, retrying with CPU mode...');
        try {
          aiResponse = await chat(
            settings.ollamaUrl,
            settings.selectedModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: parsed.data.message },
            ],
            { use_cpu: true }
          );
        } catch (cpuError: any) {
          throw new Error(
            `GPU error occurred and CPU fallback also failed: ${cpuError.message}`
          );
        }
      } else {
        throw error;
      }
    }

    // Try to parse event creation from response
    const eventData = parseEventCreation(aiResponse);
    let createdEvent = null;

    if (eventData && eventData.title) {
      // Get default calendar (first personal calendar or first available)
      let calendarId = eventData.calendarId;
      if (!calendarId) {
        const defaultCalendar = context.calendars.find(
          (c) => c.type === 'PERSONAL'
        ) || context.calendars[0];
        if (defaultCalendar) {
          calendarId = defaultCalendar.id;
        }
      }

      if (calendarId) {
        // Parse dates
        const startsAt = eventData.startsAt
          ? new Date(eventData.startsAt)
          : new Date();
        const endsAt = eventData.endsAt
          ? new Date(eventData.endsAt)
          : new Date(startsAt.getTime() + 60 * 60 * 1000); // Default 1 hour

        try {
          createdEvent = await prisma.event.create({
            data: {
              calendarId,
              title: eventData.title,
              description: eventData.description,
              location: eventData.location,
              startsAtUtc: startsAt,
              endsAtUtc: endsAt,
              allDay: eventData.allDay || false,
              visibility: 'owner',
              createdById: user.id,
              source: 'local',
            },
            include: {
              calendar: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          });
        } catch (error: any) {
          console.error('Failed to create event:', error);
          // Continue with response even if event creation fails
        }
      }
    }

    return NextResponse.json({
      response: aiResponse,
      eventCreated: createdEvent !== null,
      event: createdEvent,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to process chat message';
    
    if (errorMessage.includes('CUDA') || errorMessage.includes('GPU')) {
      errorMessage = `GPU/CUDA Error: The selected model cannot run on your GPU. ` +
        `Please try:\n` +
        `1. Use a smaller model (e.g., llama3.2:1b, phi3:mini)\n` +
        `2. Configure Ollama to use CPU mode\n` +
        `3. Check your GPU drivers and CUDA installation\n\n` +
        `Original error: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

