import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await prisma.smtpSetting.findUnique({ where: { userId: user.id } });
  if (!s) return NextResponse.json({ error: 'not_configured' }, { status: 400 });

  const transporter = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.username, pass: decrypt(s.password) },
  });

  try {
    const info = await transporter.sendMail({
      from: `${s.fromName} <${s.fromEmail}>`,
      to: user.email,
      subject: 'WeTime SMTP test',
      text: 'This is a test email from WeTime.',
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (e: any) {
    return NextResponse.json({ error: 'send_failed', message: e.message }, { status: 500 });
  }
}
