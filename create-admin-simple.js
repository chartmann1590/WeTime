const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('admin123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { isAdmin: true },
    create: { email: 'admin@example.com', passwordHash: hash, name: 'Administrator', isAdmin: true, timeZone: 'America/New_York' }
  });
  console.log('Admin created:', user.email, 'isAdmin:', user.isAdmin);
  await prisma.$disconnect();
})();

