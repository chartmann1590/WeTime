import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123456';
  const name = 'Administrator';

  console.log(`Creating admin user: ${email}`);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isAdmin: true },
    });
    console.log(`Updated user ${email} to admin.`);
    await prisma.$disconnect();
    return;
  }

  // Create new admin user
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      isAdmin: true,
      timeZone: 'America/New_York',
    },
  });

  // Create personal calendar
  await prisma.calendar.create({
    data: {
      ownerId: user.id,
      type: 'PERSONAL',
      name: name,
      color: '#3b82f6',
    },
  });

  console.log(`Admin user created successfully!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  await prisma.$disconnect();
}

createAdmin().catch(console.error);



