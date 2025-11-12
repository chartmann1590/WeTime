# WeTime Database Schema Documentation

## Overview

WeTime uses PostgreSQL 16 with Prisma ORM for database management. The schema is defined in `prisma/schema.prisma`.

## Entity Relationship Diagram

```
┌─────────┐         ┌─────────┐
│  User   │◄────────┤ Couple  │
└────┬────┘         └────┬────┘
     │                  │
     │                  │
     │                  │
     ▼                  ▼
┌─────────┐         ┌─────────┐
│Calendar │         │Calendar │
└────┬────┘         └────┬────┘
     │                  │
     │                  │
     ▼                  ▼
┌─────────┐         ┌─────────┐
│ Event   │         │ Event   │
└────┬────┘         └────┬────┘
     │                  │
     │                  │
     ▼                  ▼
┌─────────┐
│Attendee │
└─────────┘

┌─────────┐
│  User   │───1:1───┐
└─────────┘         │
                    ▼
            ┌──────────────┐
            │ SmtpSetting  │
            └──────────────┘
```

## Models

### User

Represents a user account in the system.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `email` (String, Unique): User's email address
- `passwordHash` (String): Bcrypt-hashed password
- `name` (String): User's display name
- `avatarUrl` (String?, Optional): URL to user's avatar image
- `timeZone` (String): IANA timezone (default: "America/New_York")
- `coupleId` (String?, Optional): Foreign key to Couple
- `notifyEmail` (Boolean): Whether to send email reminders (default: true)
- `isAdmin` (Boolean): Admin privileges (default: false)
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `couple`: Optional relationship to Couple
- `calendars`: One-to-many with Calendar (owned calendars)
- `events`: One-to-many with Event (created events)
- `attendees`: One-to-many with Attendee (RSVPs)
- `smtpSetting`: One-to-one with SmtpSetting

**Indexes:**
- Unique index on `email`
- Index on `coupleId` (foreign key)

**Example:**
```typescript
{
  id: "clx1234567890",
  email: "alice@example.com",
  passwordHash: "$2b$10$...",
  name: "Alice",
  timeZone: "America/New_York",
  coupleId: "cly9876543210",
  notifyEmail: true,
  isAdmin: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

---

### Couple

Links two users together to form a couple.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `code` (String, Unique): Invite code for joining (e.g., "ABC1234")
- `sharedCalendarId` (String, Unique): Foreign key to shared Calendar
- `createdAt` (DateTime): Couple creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `users`: One-to-many with User (max 2 users)
- `sharedCalendar`: One-to-one with Calendar (the couple's shared calendar)
- `calendars`: One-to-many with Calendar (couple-level calendars)

**Indexes:**
- Unique index on `code`
- Unique index on `sharedCalendarId`

**Example:**
```typescript
{
  id: "cly9876543210",
  code: "DEMO1234",
  sharedCalendarId: "clz1111111111",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

---

### Calendar

Represents a calendar containing events.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `ownerId` (String?, Optional): Foreign key to User (for PERSONAL/EXTERNAL calendars)
- `coupleId` (String?, Optional): Foreign key to Couple (for SHARED calendars)
- `type` (CalendarType, Enum): Calendar type
  - `PERSONAL`: Owned by a single user
  - `SHARED`: Shared within a couple
  - `EXTERNAL`: Synced from external iCal URL
  - `IMPORTED`: Imported from .ics file
- `name` (String): Calendar display name
- `color` (String): Hex color code (default: "#3b82f6")
- `icsUrl` (String?, Optional): External iCal URL (for EXTERNAL type)
- `lastFetched` (DateTime?, Optional): Last sync timestamp (for EXTERNAL type)
- `etag` (String?, Optional): ETag for conditional fetching
- `createdAt` (DateTime): Calendar creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `owner`: Optional relationship to User
- `couple`: Optional relationship to Couple
- `sharedInCouple`: Optional relationship to Couple (as shared calendar)
- `events`: One-to-many with Event

**Indexes:**
- Index on `ownerId` (foreign key)
- Index on `coupleId` (foreign key)

**Example:**
```typescript
{
  id: "clz1111111111",
  ownerId: null,
  coupleId: "cly9876543210",
  type: "SHARED",
  name: "Our Shared Calendar",
  color: "#10b981",
  icsUrl: null,
  lastFetched: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

---

### Event

Represents a calendar event.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `calendarId` (String): Foreign key to Calendar
- `title` (String): Event title
- `description` (String?, Optional): Event description
- `location` (String?, Optional): Event location
- `startsAtUtc` (DateTime): Event start time (UTC)
- `endsAtUtc` (DateTime): Event end time (UTC)
- `allDay` (Boolean): Whether event is all-day (default: false)
- `rrule` (String?, Optional): RFC 5545 recurrence rule (e.g., "FREQ=WEEKLY;BYDAY=MO")
- `exdates` (String[]): Array of excluded dates (ISO format)
- `visibility` (String): Visibility level (default: "owner")
  - `owner`: Only visible to creator
  - `partner`: Visible to couple partner
- `color` (String?, Optional): Override calendar color
- `createdById` (String): Foreign key to User (creator)
- `source` (String): Event source (default: "local")
  - `local`: Created in WeTime
  - `external`: Synced from external calendar
  - `imported`: Imported from .ics file
- `externalUid` (String?, Optional): Stable UID from external calendar (for de-duplication)
- `originalTz` (String?, Optional): Original timezone (for expansion)
- `createdAt` (DateTime): Event creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `calendar`: Many-to-one with Calendar
- `createdBy`: Many-to-one with User
- `attendees`: One-to-many with Attendee

**Indexes:**
- Index on `calendarId` (foreign key)
- Index on `createdById` (foreign key)
- Index on `startsAtUtc` (for date range queries)
- Index on `externalUid` (for de-duplication)

**Example:**
```typescript
{
  id: "clx9999999999",
  calendarId: "clz1111111111",
  title: "Team Meeting",
  description: "Weekly sync",
  location: "Conference Room A",
  startsAtUtc: "2024-01-15T14:00:00Z",
  endsAtUtc: "2024-01-15T15:00:00Z",
  allDay: false,
  rrule: "FREQ=WEEKLY;BYDAY=MO",
  exdates: ["2024-01-22"],
  visibility: "partner",
  color: null,
  createdById: "clx1234567890",
  source: "local",
  externalUid: null,
  originalTz: "America/New_York",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

---

### Attendee

Represents an RSVP for an event.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `eventId` (String): Foreign key to Event
- `userId` (String): Foreign key to User
- `status` (String): RSVP status (default: "needsAction")
  - `accepted`: User will attend
  - `declined`: User will not attend
  - `tentative`: User might attend
  - `needsAction`: No response yet

**Relations:**
- `event`: Many-to-one with Event
- `user`: Many-to-one with User

**Indexes:**
- Index on `eventId` (foreign key)
- Index on `userId` (foreign key)
- Unique constraint on `(eventId, userId)` (one RSVP per user per event)

**Example:**
```typescript
{
  id: "cla1111111111",
  eventId: "clx9999999999",
  userId: "cly9876543210",
  status: "accepted"
}
```

---

### SmtpSetting

Stores encrypted SMTP configuration for email reminders.

**Fields:**
- `id` (String, Primary Key): Unique identifier (CUID)
- `userId` (String, Unique): Foreign key to User
- `host` (String): SMTP server hostname
- `port` (Int): SMTP server port
- `secure` (Boolean): Use TLS/SSL (default: true)
- `username` (String): SMTP username
- `password` (String): Encrypted SMTP password
- `fromName` (String): Display name for sent emails
- `fromEmail` (String): From email address
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `user`: One-to-one with User

**Indexes:**
- Unique index on `userId`

**Example:**
```typescript
{
  id: "clb2222222222",
  userId: "clx1234567890",
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  username: "user@gmail.com",
  password: "encrypted_password_here",
  fromName: "WeTime",
  fromEmail: "noreply@example.com",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

---

## Enums

### CalendarType

```prisma
enum CalendarType {
  PERSONAL
  SHARED
  EXTERNAL
  IMPORTED
}
```

---

## Relationships Summary

### One-to-Many

- User → Calendar (via `ownerId`)
- User → Event (via `createdById`)
- User → Attendee
- Couple → User (max 2)
- Couple → Calendar (via `coupleId`)
- Calendar → Event

### One-to-One

- User → Couple (via `coupleId`)
- Couple → Calendar (via `sharedCalendarId`)
- User → SmtpSetting

---

## Cascading Deletes

The following cascading delete behaviors are configured:

- **User deletion**: 
  - Deletes owned calendars (Cascade)
  - Deletes created events (Cascade)
  - Deletes attendees (Cascade)
  - Deletes SMTP settings (Cascade)
  - Sets `coupleId` to null (SetNull)

- **Calendar deletion**:
  - Deletes all events (Cascade)

- **Event deletion**:
  - Deletes all attendees (Cascade)

- **Couple deletion**:
  - Sets `coupleId` to null on users (SetNull)

---

## Database Migrations

Migrations are managed via Prisma:

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

---

## Query Patterns

### Get User's Calendars

```typescript
const calendars = await prisma.calendar.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { coupleId: user.coupleId }
    ]
  }
})
```

### Get Events in Date Range

```typescript
const events = await prisma.event.findMany({
  where: {
    calendarId: { in: calendarIds },
    startsAtUtc: {
      gte: rangeStart,
      lte: rangeEnd
    }
  },
  include: {
    calendar: true,
    createdBy: true
  }
})
```

### Get Couple Members

```typescript
const couple = await prisma.couple.findUnique({
  where: { id: coupleId },
  include: {
    users: true,
    sharedCalendar: true
  }
})
```

---

## Performance Considerations

### Indexes

The following indexes are recommended for optimal performance:

- `User.email`: Unique index (already defined)
- `Event.startsAtUtc`: Index for date range queries
- `Event.calendarId`: Index for calendar filtering
- `Event.externalUid`: Index for de-duplication
- `Attendee(eventId, userId)`: Composite unique index

### Query Optimization

- Use `select` to limit fields when possible
- Use `include` judiciously to avoid N+1 queries
- Consider pagination for large result sets
- Use database-level date filtering (UTC) rather than application-level

---

## Data Integrity

### Constraints

- Email uniqueness enforced at database level
- Couple code uniqueness enforced
- Foreign key constraints ensure referential integrity
- Cascade deletes prevent orphaned records

### Validation

- Prisma schema enforces type safety
- Application-level validation via Zod schemas
- Database constraints as final safety net

---

## Backup & Recovery

### Backup Strategy

```bash
# Create database backup
docker compose exec db pg_dump -U wetime wetime > backup.sql

# Restore from backup
docker compose exec -T db psql -U wetime wetime < backup.sql
```

### Migration Safety

- Always test migrations in development first
- Use transactions for multi-step migrations
- Keep migration history in version control
- Never modify existing migrations

---

## Future Schema Enhancements

Potential additions:

- **EventSeries**: Separate table for recurring event series
- **EventInstance**: Individual occurrences of recurring events
- **CalendarSubscription**: Track external calendar subscriptions
- **Notification**: Store notification preferences and history
- **AuditLog**: Track all data changes for compliance


