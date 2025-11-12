import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

export async function seed() {
  console.log('Seeding demo data...');

  const passwordHash = await hashPassword('password123');

  // Clean up existing demo data
  await prisma.event.deleteMany({});
  await prisma.calendar.deleteMany({});
  await prisma.couple.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice',
      timeZone: 'America/New_York',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob',
      timeZone: 'America/New_York',
    },
  });

  // Personal calendars
  const alicePersonal = await prisma.calendar.create({
    data: { ownerId: alice.id, type: 'PERSONAL', name: 'Alice', color: '#3b82f6' },
  });
  const bobPersonal = await prisma.calendar.create({
    data: { ownerId: bob.id, type: 'PERSONAL', name: 'Bob', color: '#8b5cf6' },
  });

  // Couple & shared calendar
  const code = 'DEMO1234';
  const sharedCal = await prisma.calendar.create({
    data: { type: 'SHARED', name: 'Shared', color: '#10b981' },
  });

  const couple = await prisma.couple.create({
    data: {
      code,
      sharedCalendarId: sharedCal.id,
    },
  });

  await prisma.user.update({ where: { id: alice.id }, data: { coupleId: couple.id } });
  await prisma.user.update({ where: { id: bob.id }, data: { coupleId: couple.id } });

  // Add external calendar example (public holiday calendar)
  await prisma.calendar.create({
    data: {
      ownerId: alice.id,
      type: 'EXTERNAL',
      name: 'US Holidays',
      color: '#ef4444',
      icsUrl: 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics',
    },
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.event.createMany({
    data: [
      {
        calendarId: alicePersonal.id,
        title: 'Alice: Gym',
        startsAtUtc: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
        endsAtUtc: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
        createdById: alice.id,
        visibility: 'owner',
      },
      {
        calendarId: sharedCal.id,
        title: 'Dinner together',
        description: 'Date night at our favorite restaurant',
        startsAtUtc: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 19, 0),
        endsAtUtc: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 21, 0),
        createdById: alice.id,
        visibility: 'partner',
      },
      {
        calendarId: bobPersonal.id,
        title: 'Bob: Morning Run',
        startsAtUtc: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30),
        endsAtUtc: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 15),
        createdById: bob.id,
        visibility: 'owner',
      },
      {
        calendarId: sharedCal.id,
        title: 'Weekend Trip',
        description: 'Planning our weekend getaway',
        startsAtUtc: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0),
        endsAtUtc: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 2, 18, 0),
        allDay: true,
        createdById: bob.id,
        visibility: 'partner',
      },
    ],
  });

  console.log('✅ Seeding complete!');
  console.log('Users:');
  console.log('  alice@example.com / password123');
  console.log('  bob@example.com / password123');
  console.log(`Couple code: ${code}`);
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

