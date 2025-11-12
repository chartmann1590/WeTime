# WeTime API Documentation

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All protected endpoints require authentication via JWT token stored in an HttpOnly cookie. The token is automatically included in requests from the frontend.

![API Testing Example](../screenshots/screenshot-api-testing.png)

> **Note**: Use tools like Postman, curl, or the browser's developer console to test API endpoints. All protected endpoints require a valid JWT token in the cookie.

### Authentication Endpoints

#### POST `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "timeZone": "America/New_York"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error (email already exists, invalid input)
- `500`: Server error

---

#### POST `/api/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Status Codes:**
- `200`: Success (sets HttpOnly cookie)
- `401`: Invalid credentials
- `500`: Server error

---

#### POST `/api/auth/logout`

Clear authentication cookie.

**Response:**
```json
{
  "success": true
}
```

---

## Couple Management

#### POST `/api/couple/create`

Create a new couple and generate an invite code.

**Response:**
```json
{
  "couple": {
    "id": "clx...",
    "code": "ABC1234",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### POST `/api/couple/join`

Join an existing couple using an invite code.

**Request Body:**
```json
{
  "code": "ABC1234"
}
```

**Response:**
```json
{
  "couple": {
    "id": "clx...",
    "code": "ABC1234",
    "partner": {
      "id": "cly...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid code or already in a couple
- `404`: Couple not found

---

#### GET `/api/couple`

Get current user's couple information.

**Response:**
```json
{
  "couple": {
    "id": "clx...",
    "code": "ABC1234",
    "partner": {
      "id": "cly...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Calendar Management

#### GET `/api/calendars`

List all calendars accessible to the current user.

**Response:**
```json
{
  "calendars": [
    {
      "id": "clx...",
      "name": "Personal Calendar",
      "type": "PERSONAL",
      "color": "#3b82f6",
      "ownerId": "clx...",
      "icsUrl": null,
      "lastFetched": null,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "cly...",
      "name": "Shared Calendar",
      "type": "SHARED",
      "color": "#10b981",
      "coupleId": "clz...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Calendar Types:**
- `PERSONAL`: Owned by a single user
- `SHARED`: Shared within a couple
- `EXTERNAL`: Synced from external iCal URL
- `IMPORTED`: Imported from .ics file

---

#### POST `/api/calendars`

Create a new calendar.

**Request Body:**
```json
{
  "type": "PERSONAL",
  "name": "My Calendar",
  "color": "#3b82f6",
  "icsUrl": "https://example.com/calendar.ics"  // Required for EXTERNAL type
}
```

**Response:**
```json
{
  "calendar": {
    "id": "clx...",
    "name": "My Calendar",
    "type": "PERSONAL",
    "color": "#3b82f6",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### PATCH `/api/calendars/:id`

Update a calendar.

**Request Body:**
```json
{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

**Response:**
```json
{
  "calendar": {
    "id": "clx...",
    "name": "Updated Name",
    "color": "#ef4444",
    ...
  }
}
```

---

#### DELETE `/api/calendars/:id`

Delete a calendar and all its events.

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/calendars/:id/refresh`

Manually refresh an external calendar.

**Response:**
```json
{
  "imported": 42
}
```

**Status Codes:**
- `200`: Success
- `400`: Calendar is not EXTERNAL type
- `404`: Calendar not found
- `502`: Failed to fetch external URL

---

#### POST `/api/calendars/import`

Import events from an .ics file.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "calendarId": "clx...",
  "imported": 15
}
```

---

#### GET `/api/calendars/:id/export.ics`

Export a calendar as an iCal file.

**Response:** `text/calendar` content type with .ics file

---

## Event Management

#### GET `/api/events`

List events within a date range.

**Query Parameters:**
- `rangeStart`: ISO 8601 date string (required)
- `rangeEnd`: ISO 8601 date string (required)

**Example:**
```
GET /api/events?rangeStart=2024-01-01T00:00:00Z&rangeEnd=2024-01-31T23:59:59Z
```

**Response:**
```json
{
  "events": [
    {
      "id": "clx...",
      "calendarId": "cly...",
      "title": "Meeting",
      "description": "Team meeting",
      "location": "Conference Room A",
      "startsAtUtc": "2024-01-15T14:00:00Z",
      "endsAtUtc": "2024-01-15T15:00:00Z",
      "allDay": false,
      "rrule": "FREQ=WEEKLY;BYDAY=MO",
      "exdates": [],
      "visibility": "owner",
      "color": "#3b82f6",
      "source": "local",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/api/events`

Create a new event.

**Request Body:**
```json
{
  "calendarId": "clx...",
  "title": "New Event",
  "description": "Event description",
  "location": "Location",
  "startsAtUtc": "2024-01-15T14:00:00Z",
  "endsAtUtc": "2024-01-15T15:00:00Z",
  "allDay": false,
  "rrule": "FREQ=WEEKLY;BYDAY=MO",
  "visibility": "owner"
}
```

**RRULE Examples:**
- Daily: `FREQ=DAILY`
- Weekly: `FREQ=WEEKLY;BYDAY=MO,WE,FR`
- Monthly: `FREQ=MONTHLY;BYMONTHDAY=1`
- Yearly: `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25`

**Response:**
```json
{
  "event": {
    "id": "clx...",
    "title": "New Event",
    ...
  }
}
```

---

#### PATCH `/api/events/:id`

Update an event.

**Request Body:** Same as POST, all fields optional

**Response:**
```json
{
  "event": {
    "id": "clx...",
    "title": "Updated Event",
    ...
  }
}
```

---

#### DELETE `/api/events/:id`

Delete an event.

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/events/:id/attend`

RSVP to an event.

**Request Body:**
```json
{
  "status": "accepted"  // accepted | declined | tentative | needsAction
}
```

**Response:**
```json
{
  "attendee": {
    "id": "clx...",
    "eventId": "cly...",
    "userId": "clz...",
    "status": "accepted"
  }
}
```

---

## User Management

#### GET `/api/user/profile`

Get current user's profile.

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "timeZone": "America/New_York",
    "notifyEmail": true,
    "avatarUrl": null
  }
}
```

---

#### PATCH `/api/user/profile`

Update user profile.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "name": "John Smith"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "newemail@example.com",
    "name": "John Smith",
    ...
  }
}
```

---

#### PATCH `/api/user/password`

Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid current password
- `401`: Unauthorized

---

## Settings

#### GET `/api/settings/smtp`

Get user's SMTP settings.

**Response:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": true,
  "username": "user@gmail.com",
  "fromName": "WeTime",
  "fromEmail": "noreply@example.com"
}
```

**Note:** Password is never returned for security.

---

#### POST `/api/settings/smtp`

Save SMTP settings.

**Request Body:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": true,
  "username": "user@gmail.com",
  "password": "app-password-here",
  "fromName": "WeTime",
  "fromEmail": "noreply@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

**Note:** Password is encrypted before storage.

---

#### POST `/api/settings/smtp/test`

Send a test email using current SMTP settings.

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

## Internal Cron Endpoints

These endpoints are called by the worker service and require the `INTERNAL_CRON_TOKEN` header.

#### POST `/api/internal/cron/refresh-ics`

Refresh all external calendars.

**Headers:**
```
x-internal-cron-token: <INTERNAL_CRON_TOKEN>
```

**Response:**
```json
{
  "refreshed": 5,
  "total": 10
}
```

---

#### POST `/api/internal/cron/send-reminders`

Send email reminders for events starting in the next 15 minutes.

**Headers:**
```
x-internal-cron-token: <INTERNAL_CRON_TOKEN>
```

**Response:**
```json
{
  "sent": 3
}
```

---

## Admin Endpoints

All admin endpoints require admin privileges. See [ADMIN.md](./ADMIN.md) for details.

#### GET `/api/admin/users`
#### POST `/api/admin/users`
#### PATCH `/api/admin/users/:id`
#### DELETE `/api/admin/users/:id`

#### GET `/api/admin/calendars`
#### POST `/api/admin/calendars`
#### PATCH `/api/admin/calendars/:id`
#### DELETE `/api/admin/calendars/:id`

#### GET `/api/admin/events`
#### POST `/api/admin/events`
#### PATCH `/api/admin/events/:id`
#### DELETE `/api/admin/events/:id`

#### GET `/api/admin/couples`
#### DELETE `/api/admin/couples?id=:id`

#### POST `/api/admin/cleanup-duplicates`

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message or object"
}
```

**Common Status Codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Per-IP limits on authentication endpoints
- Per-user limits on mutating operations
- Specific limits may vary by endpoint

Rate limit headers (if implemented):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## CSRF Protection

Mutating operations (POST, PATCH, DELETE) require CSRF token validation. The frontend automatically includes CSRF tokens in requests.

---

## Date/Time Handling

- All dates are stored in UTC in the database
- API accepts ISO 8601 date strings
- Timezone conversion handled by frontend based on user's `timeZone` setting
- Event times are converted to UTC before storage

---

## Pagination

Currently, list endpoints return all results. Future versions may implement pagination:

```
GET /api/events?page=1&limit=50
```

---

## Filtering & Sorting

Currently not implemented. Future enhancements may include:
- Filter by calendar
- Filter by date range
- Sort by date, title, etc.


