const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const couple = await prisma.couple.findUnique({ where: { code: 'FQ2TA83F' } });
  if (couple && couple.sharedCalendarId) {
    await prisma.calendar.update({
      where: { id: couple.sharedCalendarId },
      data: { coupleId: couple.id }
    });
    console.log('Fixed shared calendar coupleId');
  }
  await prisma.$disconnect();
})();



