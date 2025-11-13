import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const token = req.headers.get('x-internal-cron-token');
  if (!token || token !== process.env.INTERNAL_CRON_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000); // 1 minute window
  const windowEnd = new Date(now.getTime() + 60 * 1000);

  // Get all users with notification preferences enabled
  const usersWithPrefs = await prisma.user.findMany({
    where: {
      notificationPreference: {
        reminderMinutesBefore: { not: null },
      },
    },
    include: {
      notificationPreference: true,
    },
  });

  let emailsSent = 0;
  let webNotificationsCreated = 0;

  for (const user of usersWithPrefs) {
    const prefs = user.notificationPreference;
    if (!prefs || prefs.reminderMinutesBefore === null) continue;

    // Use user's default reminder time
    const userDefaultReminderMinutes = prefs.reminderMinutesBefore;
    
    // Calculate the event start time that would trigger a reminder now
    // We need to check both user default and event-specific reminder times
    // So we'll query events in a wider window and check each event's reminder time
    const maxReminderMinutes = Math.max(userDefaultReminderMinutes, 10080); // Max 1 week
    const eventStartWindowStart = new Date(now.getTime() - 60 * 1000);
    const eventStartWindowEnd = new Date(now.getTime() + maxReminderMinutes * 60 * 1000 + 60 * 1000);

    // Get user's calendar IDs (personal and shared)
    const personalCalendars = await prisma.calendar.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const personalCalendarIds = personalCalendars.map(c => c.id);

    let sharedCalendarIds: string[] = [];
    if (user.coupleId) {
      const sharedCalendars = await prisma.calendar.findMany({
        where: { coupleId: user.coupleId },
        select: { id: true },
      });
      sharedCalendarIds = sharedCalendars.map(c => c.id);
    }

    const allCalendarIds = [...personalCalendarIds, ...sharedCalendarIds];
    if (allCalendarIds.length === 0) continue;

    // Find events that start at the target time (within 1 minute window)
    const eventsToRemind = await prisma.event.findMany({
      where: {
        calendarId: { in: allCalendarIds },
        startsAtUtc: {
          gte: eventStartWindowStart,
          lte: eventStartWindowEnd,
        },
      },
      include: {
        calendar: true,
      },
    });

    for (const event of eventsToRemind) {
      // Use event-specific reminder time if set, otherwise use user default
      const reminderMinutes = event.reminderMinutesBefore ?? userDefaultReminderMinutes;
      
      // Calculate if this event should trigger a reminder now
      const eventReminderTime = new Date(event.startsAtUtc.getTime() - reminderMinutes * 60 * 1000);
      const reminderTimeDiff = Math.abs(eventReminderTime.getTime() - now.getTime());
      if (reminderTimeDiff > 60 * 1000) continue; // Not time to send reminder yet

      // Check if reminder already sent
      const existingReminder = await prisma.eventReminder.findUnique({
        where: {
          eventId_userId_reminderMinutes: {
            eventId: event.id,
            userId: user.id,
            reminderMinutes,
          },
        },
      });

      if (existingReminder) continue; // Already sent

      // Send email reminder if enabled
      if (prefs.notifyEmail) {
        const smtp = await prisma.smtpSetting.findUnique({ where: { userId: user.id } });
        if (smtp) {
          try {
            const transporter = nodemailer.createTransport({
              host: smtp.host,
              port: smtp.port,
              secure: smtp.secure,
              auth: { user: smtp.username, pass: decrypt(smtp.password) },
            });

            const eventTime = new Date(event.startsAtUtc);
            const timeStr = eventTime.toLocaleString('en-US', {
              timeZone: user.timeZone,
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            await transporter.sendMail({
              from: `${smtp.fromName} <${smtp.fromEmail}>`,
              to: user.email,
              subject: `Reminder: ${event.title}`,
              text: `Upcoming event: ${event.title}\n\nTime: ${timeStr}${event.location ? `\nLocation: ${event.location}` : ''}${event.description ? `\n\n${event.description}` : ''}`,
            });
            emailsSent++;
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
          }
        }
      }

      // Create web notification if enabled
      if (prefs.notifyWeb) {
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              eventId: event.id,
              title: `Reminder: ${event.title}`,
              message: `Event starts ${reminderMinutes} minute${reminderMinutes !== 1 ? 's' : ''} from now`,
            },
          });
          webNotificationsCreated++;
        } catch (error) {
          console.error(`Failed to create notification for user ${user.id}:`, error);
        }
      }

      // Record that reminder was sent
      try {
        await prisma.eventReminder.create({
          data: {
            eventId: event.id,
            userId: user.id,
            reminderMinutes,
          },
        });
      } catch (error) {
        console.error(`Failed to record reminder for event ${event.id}:`, error);
      }
    }
  }

  return NextResponse.json({
    emailsSent,
    webNotificationsCreated,
    total: emailsSent + webNotificationsCreated,
  });
}
