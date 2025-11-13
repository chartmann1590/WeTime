import { prisma } from '../lib/prisma';

/**
 * Migration script to migrate existing User.notifyEmail data to NotificationPreference
 * Run this after running Prisma migrations to move data from the old schema to the new one
 */
export async function migrateNotifications() {
  console.log('Migrating notification preferences...');

  // Get all users that don't have notification preferences yet
  const users = await prisma.user.findMany({
    where: {
      notificationPreference: null,
    },
  });

  console.log(`Found ${users.length} users without notification preferences`);

  let migrated = 0;
  for (const user of users) {
    // Create default notification preference
    // Since we removed notifyEmail from User, we'll default to enabled with 15 minutes
    // Users can adjust this in settings
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        reminderMinutesBefore: 15, // Default to 15 minutes
        notifyEmail: true, // Default to enabled
        notifyWeb: true, // Default to enabled
      },
    });
    migrated++;
  }

  console.log(`Migrated ${migrated} users`);
  console.log('Migration complete!');
}

if (require.main === module) {
  migrateNotifications()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}


