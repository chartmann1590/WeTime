// Fresh test with new users
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testFreshCouple() {
  console.log('=== Fresh Couple Linking Test ===\n');

  // Step 1: Create User1
  console.log('1. Creating User1...');
  const user1Signup = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user1@test.com', password: 'password123', name: 'User1' }),
  });
  const user1Data = await user1Signup.json();
  const user1Cookie = user1Signup.headers.get('set-cookie');
  console.log('   ✓ User1 created:', user1Data.user?.name || 'OK');

  // Step 2: Create couple for User1
  console.log('\n2. Creating couple for User1...');
  const coupleRes = await fetch(`${BASE_URL}/couple/create`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
  });
  if (!coupleRes.ok) {
    const error = await coupleRes.text();
    console.log('   ✗ Couple creation failed:', error);
    return;
  }
  const coupleData = await coupleRes.json();
  const coupleCode = coupleData.code;
  console.log('   ✓ Couple created with code:', coupleCode);

  // Step 3: Get User1 calendars
  console.log('\n3. Getting User1 calendars...');
  const user1CalsRes = await fetch(`${BASE_URL}/calendars`, {
    headers: { Cookie: user1Cookie },
  });
  const user1Cals = await user1CalsRes.json();
  const user1Personal = user1Cals.calendars?.find(c => c.type === 'PERSONAL');
  const user1Shared = user1Cals.calendars?.find(c => c.type === 'SHARED');
  console.log('   ✓ User1 has', user1Cals.calendars?.length || 0, 'calendars');
  console.log('   - Personal:', user1Personal?.name || 'NOT FOUND');
  console.log('   - Shared:', user1Shared?.name || 'NOT FOUND');

  // Step 4: Create User2
  console.log('\n4. Creating User2...');
  const user2Signup = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user2@test.com', password: 'password123', name: 'User2' }),
  });
  const user2Data = await user2Signup.json();
  const user2Cookie = user2Signup.headers.get('set-cookie');
  console.log('   ✓ User2 created:', user2Data.user?.name || 'OK');

  // Step 5: User2 joins couple
  console.log('\n5. User2 joining couple with code:', coupleCode);
  const user2JoinRes = await fetch(`${BASE_URL}/couple/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
    body: JSON.stringify({ code: coupleCode }),
  });
  const user2Join = await user2JoinRes.json();
  if (!user2JoinRes.ok) {
    console.log('   ✗ Join failed:', user2Join.error || 'Unknown');
    return;
  }
  console.log('   ✓ User2 joined couple');

  // Step 6: Get User2 calendars
  console.log('\n6. Getting User2 calendars...');
  const user2CalsRes = await fetch(`${BASE_URL}/calendars`, {
    headers: { Cookie: user2Cookie },
  });
  const user2Cals = await user2CalsRes.json();
  const user2Personal = user2Cals.calendars?.find(c => c.type === 'PERSONAL');
  const user2Shared = user2Cals.calendars?.find(c => c.type === 'SHARED');
  console.log('   ✓ User2 has', user2Cals.calendars?.length || 0, 'calendars');
  console.log('   - Personal:', user2Personal?.name || 'NOT FOUND');
  console.log('   - Shared:', user2Shared?.name || 'NOT FOUND');

  // Step 7: Create events
  console.log('\n7. Creating events...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(15, 0, 0, 0);

  // User1 personal event
  const user1PersonalEvent = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
    body: JSON.stringify({
      calendarId: user1Personal.id,
      title: "User1's Personal Event",
      startsAtUtc: tomorrow.toISOString(),
      endsAtUtc: tomorrowEnd.toISOString(),
      allDay: false,
    }),
  });
  const user1PersonalEventData = await user1PersonalEvent.json();
  console.log('   ✓ User1 personal event:', user1PersonalEventData.event?.title || 'FAILED');

  // User2 personal event
  const user2PersonalEvent = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
    body: JSON.stringify({
      calendarId: user2Personal.id,
      title: "User2's Personal Event",
      startsAtUtc: tomorrow.toISOString(),
      endsAtUtc: tomorrowEnd.toISOString(),
      allDay: false,
    }),
  });
  const user2PersonalEventData = await user2PersonalEvent.json();
  console.log('   ✓ User2 personal event:', user2PersonalEventData.event?.title || 'FAILED');

  // Shared event (User1 creates it)
  if (user1Shared) {
    const sharedEvent = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        calendarId: user1Shared.id,
        title: 'Shared Couple Event',
        description: 'Both users should see this',
        startsAtUtc: tomorrow.toISOString(),
        endsAtUtc: tomorrowEnd.toISOString(),
        allDay: false,
      }),
    });
    const sharedEventData = await sharedEvent.json();
    console.log('   ✓ Shared event:', sharedEventData.event?.title || 'FAILED');
  }

  // Step 8: Verify visibility
  console.log('\n8. Verifying event visibility...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const user1EventsRes = await fetch(`${BASE_URL}/events?rangeStart=${startDate.toISOString()}&rangeEnd=${endDate.toISOString()}`, {
    headers: { Cookie: user1Cookie },
  });
  const user1Events = await user1EventsRes.json();
  console.log('   User1 sees', user1Events.events?.length || 0, 'events');
  const user1SeesShared = user1Events.events?.some(e => e.title === 'Shared Couple Event');
  const user1SeesUser2Personal = user1Events.events?.some(e => e.title?.includes("User2's Personal"));
  console.log('   - Sees shared event:', user1SeesShared ? '✓' : '✗');
  console.log('   - Sees User2 personal:', user1SeesUser2Personal ? '✓ (should be ✗)' : '✗ (correct)');

  const user2EventsRes = await fetch(`${BASE_URL}/events?rangeStart=${startDate.toISOString()}&rangeEnd=${endDate.toISOString()}`, {
    headers: { Cookie: user2Cookie },
  });
  const user2Events = await user2EventsRes.json();
  console.log('   User2 sees', user2Events.events?.length || 0, 'events');
  const user2SeesShared = user2Events.events?.some(e => e.title === 'Shared Couple Event');
  const user2SeesUser1Personal = user2Events.events?.some(e => e.title?.includes("User1's Personal"));
  console.log('   - Sees shared event:', user2SeesShared ? '✓' : '✗');
  console.log('   - Sees User1 personal:', user2SeesUser1Personal ? '✓ (should be ✗)' : '✗ (correct)');

  console.log('\n=== Test Summary ===');
  console.log('Couple linked:', user2Join.ok ? '✓' : '✗');
  console.log('Shared calendar visible to both:', (user1Shared && user2Shared) ? '✓' : '✗');
  console.log('Shared event visible to User1:', user1SeesShared ? '✓' : '✗');
  console.log('Shared event visible to User2:', user2SeesShared ? '✓' : '✗');
  console.log('Personal events private:', (!user1SeesUser2Personal && !user2SeesUser1Personal) ? '✓' : '✗');
}

testFreshCouple().catch(console.error);

