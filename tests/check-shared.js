const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const couple = await prisma.couple.findUnique({ 
    where: { code: 'FQ2TA83F' }, 
    include: { sharedCalendar: true } 
  });
  console.log('Couple shared calendar ID:', couple?.sharedCalendarId);
  console.log('Shared calendar:', couple?.sharedCalendar ? {
    id: couple.sharedCalendar.id, 
    name: couple.sharedCalendar.name, 
    type: couple.sharedCalendar.type, 
    coupleId: couple.sharedCalendar.coupleId
  } : 'NOT FOUND');
  const allShared = await prisma.calendar.findMany({ 
    where: { type: 'SHARED', coupleId: couple?.id } 
  });
  console.log('All shared calendars for couple:', allShared.map(c => ({
    id: c.id, 
    name: c.name, 
    coupleId: c.coupleId
  })));
  await prisma.$disconnect();
})();



