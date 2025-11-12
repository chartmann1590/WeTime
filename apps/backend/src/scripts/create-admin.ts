import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.env.ADMIN_NAME || 'Administrator';

  console.log(`Creating admin user: ${email}`);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.isAdmin) {
      console.log(`User ${email} already exists and is already an admin.`);
      return;
    }
    // Update existing user to admin
    await prisma.user.update({
      where: { id: existing.id },
      data: { isAdmin: true },
    });
    console.log(`Updated user ${email} to admin.`);
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
  console.log(`\nYou can now log in at http://localhost/login`);
  console.log(`Admin panel: http://localhost/admin`);
}

createAdmin()
  .catch((error) => {
    console.error('Error creating admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




