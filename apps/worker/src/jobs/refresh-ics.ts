export const refreshIcs = async () => {
  const backend = process.env.BACKEND_URL || 'http://backend:3001';
  const token = process.env.INTERNAL_CRON_TOKEN || '';
  try {
    const res = await fetch(`${backend}/api/internal/cron/refresh-ics`, { method: 'POST', headers: { 'x-internal-cron-token': token } });
    if (!res.ok) {
      console.error('refresh-ics failed', res.status);
    } else {
      console.log('refresh-ics', await res.json());
    }
  } catch (e) {
    console.error('refresh-ics error', (e as Error).message);
  }
};
