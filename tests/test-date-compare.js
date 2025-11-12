const today = new Date();
today.setHours(0, 0, 0, 0);
const eventDate = new Date('2025-11-08T15:00:00.000Z');
const eventLocal = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
console.log('Today:', today.toISOString(), 'Local:', today.toLocaleString());
console.log('Event UTC:', eventDate.toISOString(), 'Event Local:', eventDate.toLocaleString());
console.log('Event Local Date:', eventLocal.toISOString());
console.log('Today Local Date:', todayLocal.toISOString());
console.log('Same day?', eventLocal.getTime() === todayLocal.getTime());



