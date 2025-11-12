import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const token = req.headers.get('x-internal-cron-token');
  if (!token || token !== process.env.INTERNAL_CRON_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const soon = new Date(now.getTime() + 15 * 60 * 1000);

  // Very simple: send reminders for events starting within 15 minutes where users opted-in
  const upcoming = await prisma.event.findMany({
    where: { startsAtUtc: { gte: now, lte: soon } },
    include: { calendar: true }
  });

  let sent = 0;
  for (const ev of upcoming) {
    // Send to calendar owner if personal/imported/external; for shared, to both users in couple
    const recipients: string[] = [];
    if (ev.calendar.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ev.calendar.ownerId } });
      if (owner?.notifyEmail) recipients.push(owner.email);
    } else if (ev.calendar.coupleId) {
      const couple = await prisma.couple.findUnique({ where: { id: ev.calendar.coupleId }, include: { users: true } });
      for (const u of couple?.users || []) if (u.notifyEmail) recipients.push(u.email);
    }

    for (const email of recipients) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      const s = await prisma.smtpSetting.findUnique({ where: { userId: user.id } });
      if (!s) continue;
      const transporter = nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.username, pass: decrypt(s.password) } });
      try {
        await transporter.sendMail({ from: `${s.fromName} <${s.fromEmail}>`, to: email, subject: `Reminder: ${ev.title}` , text: `Upcoming: ${ev.title} at ${ev.startsAtUtc.toISOString()}` });
        sent++;
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ sent });
}
