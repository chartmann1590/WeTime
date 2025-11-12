export const sendReminders = async () => {
  const backend = process.env.BACKEND_URL || 'http://backend:3001';
  const token = process.env.INTERNAL_CRON_TOKEN || '';
  try {
    const res = await fetch(`${backend}/api/internal/cron/send-reminders`, { method: 'POST', headers: { 'x-internal-cron-token': token } });
    if (!res.ok) {
      console.error('send-reminders failed', res.status);
    } else {
      console.log('send-reminders', await res.json());
    }
  } catch (e) {
    console.error('send-reminders error', (e as Error).message);
  }
};
