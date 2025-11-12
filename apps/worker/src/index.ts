import * as cron from 'node-cron';
import { refreshIcs } from './jobs/refresh-ics';
import { sendReminders } from './jobs/send-reminders';

console.log('Worker started');

// Schedule jobs
cron.schedule('*/15 * * * *', refreshIcs);
cron.schedule('* * * * *', sendReminders);
