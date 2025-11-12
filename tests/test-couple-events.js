// Test script to link two couples and verify shared events
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testCoupleLinking() {
  console.log('=== Testing Couple Linking and Shared Events ===\n');

  // Step 1: Login as Alice
  console.log('1. Logging in as Alice...');
  const aliceLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@example.com', password: 'password123' }),
  });
  const aliceData = await aliceLogin.json();
  const aliceCookie = aliceLogin.headers.get('set-cookie');
  console.log('   ✓ Alice logged in:', aliceData.user?.name || 'OK');

  // Step 2: Get Alice's couple info
  console.log('\n2. Getting Alice\'s couple info...');
  const aliceCoupleRes = await fetch(`${BASE_URL}/couple`, {
    headers: { Cookie: aliceCookie },
  });
  const aliceCouple = await aliceCoupleRes.json();
  let coupleCode = aliceCouple.couple?.code;
  
  if (!coupleCode) {
    console.log('   Creating new couple for Alice...');
    const createCoupleRes = await fetch(`${BASE_URL}/couple/create`, {
      method: 'POST',
      headers: { Cookie: aliceCookie },
    });
    const createCouple = await createCoupleRes.json();
    coupleCode = createCouple.code;
    console.log('   ✓ Couple created with code:', coupleCode);
  } else {
    console.log('   ✓ Alice already has couple code:', coupleCode);
  }

  // Step 3: Create Bob user (or login if exists)
  console.log('\n3. Creating/Logging in as Bob...');
  let bobCookie;
  let bobSignup = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob@example.com', password: 'password123', name: 'Bob' }),
  });
  
  if (bobSignup.ok) {
    bobCookie = bobSignup.headers.get('set-cookie');
    const bobData = await bobSignup.json();
    console.log('   ✓ Bob created:', bobData.user?.name || 'OK');
  } else {
    // Try to login instead
    bobSignup = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'password123' }),
    });
    bobCookie = bobSignup.headers.get('set-cookie');
    const bobData = await bobSignup.json();
    console.log('   ✓ Bob logged in:', bobData.user?.name || 'OK');
  }

  // Step 4: Bob joins the couple
  console.log('\n4. Bob joining couple with code:', coupleCode);
  const bobJoinRes = await fetch(`${BASE_URL}/couple/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: bobCookie },
    body: JSON.stringify({ code: coupleCode }),
  });
  const bobJoin = await bobJoinRes.json();
  if (!bobJoinRes.ok) {
    console.log('   ✗ Bob join failed:', bobJoin.error || 'Unknown error');
  } else {
    console.log('   ✓ Bob joined couple:', bobJoin.ok ? 'OK' : 'FAILED');
  }

  // Step 5: Get calendars for both users
  console.log('\n5. Getting calendars...');
  const aliceCalsRes = await fetch(`${BASE_URL}/calendars`, {
    headers: { Cookie: aliceCookie },
  });
  const aliceCals = await aliceCalsRes.json();
  const alicePersonalCal = aliceCals.calendars?.find(c => c.type === 'PERSONAL');
  const aliceSharedCal = aliceCals.calendars?.find(c => c.type === 'SHARED');
  console.log('   ✓ Alice calendars:', aliceCals.calendars?.length || 0, 'found');

  const bobCalsRes = await fetch(`${BASE_URL}/calendars`, {
    headers: { Cookie: bobCookie },
  });
  const bobCals = await bobCalsRes.json();
  console.log('   Bob calendars response:', JSON.stringify(bobCals, null, 2));
  const bobPersonalCal = bobCals.calendars?.find(c => c.type === 'PERSONAL');
  const bobSharedCal = bobCals.calendars?.find(c => c.type === 'SHARED');
  console.log('   ✓ Bob calendars:', bobCals.calendars?.length || 0, 'found');
  
  if (!bobPersonalCal) {
    console.log('   ⚠ Warning: Bob has no personal calendar!');
  }

  // Step 6: Create events
  console.log('\n6. Creating events...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(15, 0, 0, 0);

  // Alice's event
  const aliceEventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: aliceCookie },
    body: JSON.stringify({
      calendarId: alicePersonalCal.id,
      title: "Alice's Personal Event",
      description: 'This is Alice\'s personal calendar event',
      startsAtUtc: tomorrow.toISOString(),
      endsAtUtc: tomorrowEnd.toISOString(),
      allDay: false,
    }),
  });
  const aliceEvent = await aliceEventRes.json();
  console.log('   ✓ Alice event created:', aliceEvent.event?.title || 'FAILED');

  // Bob's event
  if (bobPersonalCal) {
    const bobEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: bobCookie },
      body: JSON.stringify({
        calendarId: bobPersonalCal.id,
        title: "Bob's Personal Event",
        description: 'This is Bob\'s personal calendar event',
        startsAtUtc: tomorrow.toISOString(),
        endsAtUtc: tomorrowEnd.toISOString(),
        allDay: false,
      }),
    });
    const bobEvent = await bobEventRes.json();
    console.log('   ✓ Bob event created:', bobEvent.event?.title || 'FAILED');
  } else {
    console.log('   ✗ Cannot create Bob event - no personal calendar');
  }

  // Shared event
  if (aliceSharedCal) {
    const sharedEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: aliceCookie },
      body: JSON.stringify({
        calendarId: aliceSharedCal.id,
        title: 'Shared Couple Event',
        description: 'This is a shared event visible to both',
        startsAtUtc: tomorrow.toISOString(),
        endsAtUtc: tomorrowEnd.toISOString(),
        allDay: false,
      }),
    });
    const sharedEvent = await sharedEventRes.json();
    console.log('   ✓ Shared event created:', sharedEvent.event?.title || 'FAILED');
  }

  // Step 7: Verify both can see each other's events
  console.log('\n7. Verifying event visibility...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const aliceEventsRes = await fetch(`${BASE_URL}/events?rangeStart=${startDate.toISOString()}&rangeEnd=${endDate.toISOString()}`, {
    headers: { Cookie: aliceCookie },
  });
  const aliceEvents = await aliceEventsRes.json();
  console.log('   Alice sees', aliceEvents.events?.length || 0, 'events');
  const aliceSeesBob = aliceEvents.events?.some(e => e.title?.includes("Bob's"));
  console.log('   ✓ Alice sees Bob\'s event:', aliceSeesBob ? 'YES' : 'NO');

  const bobEventsRes = await fetch(`${BASE_URL}/events?rangeStart=${startDate.toISOString()}&rangeEnd=${endDate.toISOString()}`, {
    headers: { Cookie: bobCookie },
  });
  const bobEvents = await bobEventsRes.json();
  console.log('   Bob sees', bobEvents.events?.length || 0, 'events');
  const bobSeesAlice = bobEvents.events?.some(e => e.title?.includes("Alice's"));
  console.log('   ✓ Bob sees Alice\'s event:', bobSeesAlice ? 'YES' : 'NO');

  console.log('\n=== Test Complete ===');
  console.log('Summary:');
  console.log('  - Couple linked:', bobJoin.ok ? '✓' : '✗');
  console.log('  - Alice sees Bob\'s event:', aliceSeesBob ? '✓' : '✗');
  console.log('  - Bob sees Alice\'s event:', bobSeesAlice ? '✓' : '✗');
}

testCoupleLinking().catch(console.error);

