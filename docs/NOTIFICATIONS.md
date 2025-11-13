# WeTime Notifications Documentation

## Overview

WeTime includes a comprehensive notification system that helps couples stay informed about upcoming events through both email and web notifications. The system supports configurable reminder times, multiple notification channels, and a user-friendly notification center.

## Features

### Notification Channels

1. **Email Notifications**: Send email reminders via SMTP
2. **Web Notifications**: In-app notification center with real-time updates

### Notification Types

- **Event Reminders**: Automatic reminders for upcoming events based on user preferences
- **Customizable Timing**: Set reminder times (e.g., 15 minutes, 1 hour, 1 day before events)

### Notification Preferences

Users can configure:
- **Reminder Time**: How many minutes before an event to receive reminders (null = disabled)
- **Email Notifications**: Toggle email reminders on/off
- **Web Notifications**: Toggle in-app notifications on/off

## User Interface

### Notification Bell Icon

The notification bell icon appears in the header of the main calendar page:
- Shows a red badge with unread count (e.g., "3" or "9+")
- Clicking opens the notification dropdown
- Badge updates in real-time as notifications are received

### Notification Dropdown

The notification dropdown displays:
- **Header**: "Notifications" title with close button
- **Notification List**: Scrollable list of recent notifications (up to 20)
- **Unread Indicators**: Unread notifications have highlighted background
- **Actions**: 
  - Mark as read (checkmark icon for unread notifications)
  - Delete (X icon)
- **Time Display**: Relative time (e.g., "5m ago", "2h ago", "3d ago")
- **Empty State**: "No notifications" message when list is empty

### Notification Item Display

Each notification shows:
- **Title**: Event reminder title (e.g., "Reminder: Team Meeting")
- **Message**: Reminder message (e.g., "Event starts 15 minutes from now")
- **Timestamp**: Relative time since notification was created
- **Read Status**: Visual distinction for unread notifications

## Configuration

### Setting Up Notification Preferences

1. Navigate to **Settings** page
2. Go to **Notifications** section
3. Configure:
   - **Reminder Time**: Select minutes before event (or disable)
   - **Email Notifications**: Toggle on/off
   - **Web Notifications**: Toggle on/off
4. Save preferences

### Setting Up Email Notifications

To receive email notifications:

1. Navigate to **Settings** page
2. Go to **SMTP Settings** section
3. Configure your SMTP server:
   - **Host**: SMTP server (e.g., `smtp.gmail.com`)
   - **Port**: SMTP port (e.g., `587` for TLS)
   - **Secure**: Enable for TLS/SSL
   - **Username**: Your email address
   - **Password**: Your email password or app-specific password
   - **From Name**: Display name for sent emails
   - **From Email**: Email address to send from
4. Test SMTP connection
5. Save settings

**Note**: SMTP passwords are encrypted at rest using AES-256 encryption.

## How It Works

### Reminder System

The reminder system runs as a background cron job:

1. **Worker Service**: Runs every minute
2. **Event Detection**: Finds events starting within the configured reminder window
3. **User Preferences**: Checks each user's notification preferences
4. **Reminder Calculation**: 
   - Uses event-specific reminder time if set
   - Falls back to user's default reminder time
   - Calculates if reminder should be sent now
5. **Duplicate Prevention**: Checks if reminder already sent (via `EventReminder` table)
6. **Notification Delivery**:
   - **Email**: Sends via user's SMTP settings (if enabled)
   - **Web**: Creates notification record in database (if enabled)
7. **Tracking**: Records reminder in `EventReminder` table to prevent duplicates

### Notification Polling

The frontend automatically polls for new notifications:
- **Initial Load**: Fetches notifications on page load
- **Auto-Refresh**: Polls every 30 seconds for new notifications
- **Unread Count**: Updates badge count in real-time

### Event-Specific Reminders

Events can have custom reminder times:
- If an event has `reminderMinutesBefore` set, it overrides the user's default
- Allows different reminder times for different events
- Works in combination with user preferences

## API Endpoints

### Get Notifications

**GET** `/api/notifications`

Retrieve user's notifications.

**Query Parameters:**
- `read` (optional): Filter by read status (`true` or `false`)
- `limit` (optional): Maximum number of notifications (default: 50)

**Response:**
```json
{
  "notifications": [
    {
      "id": "clx...",
      "eventId": "cly...",
      "title": "Reminder: Team Meeting",
      "message": "Event starts 15 minutes from now",
      "read": false,
      "createdAt": "2024-01-15T14:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### Mark Notification as Read/Unread

**PATCH** `/api/notifications`

Update notification read status.

**Request Body:**
```json
{
  "id": "clx...",
  "read": true
}
```

**Response:**
```json
{
  "notification": {
    "id": "clx...",
    "read": true,
    ...
  }
}
```

### Delete Notification

**DELETE** `/api/notifications?id=<notificationId>`

Delete a notification.

**Response:**
```json
{
  "ok": true
}
```

### Get Notification Preferences

**GET** `/api/settings/notifications`

Get user's notification preferences.

**Response:**
```json
{
  "reminderMinutesBefore": 15,
  "notifyEmail": true,
  "notifyWeb": true
}
```

### Update Notification Preferences

**POST** `/api/settings/notifications`

Update user's notification preferences.

**Request Body:**
```json
{
  "reminderMinutesBefore": 30,  // null to disable
  "notifyEmail": true,
  "notifyWeb": true
}
```

**Response:**
```json
{
  "reminderMinutesBefore": 30,
  "notifyEmail": true,
  "notifyWeb": true
}
```

## Database Schema

### Notification Model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId   String?
  title     String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Fields:**
- `id`: Unique identifier
- `userId`: Owner of the notification
- `eventId`: Optional link to related event
- `title`: Notification title
- `message`: Notification message
- `read`: Whether notification has been read
- `createdAt`: When notification was created

### NotificationPreference Model

```prisma
model NotificationPreference {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminderMinutesBefore Int?    // null = disabled
  notifyEmail          Boolean  @default(true)
  notifyWeb            Boolean  @default(true)
  updatedAt            DateTime @updatedAt
  createdAt            DateTime @default(now())
}
```

**Fields:**
- `id`: Unique identifier
- `userId`: User who owns these preferences
- `reminderMinutesBefore`: Minutes before event to send reminder (null = disabled)
- `notifyEmail`: Whether to send email notifications
- `notifyWeb`: Whether to create web notifications
- `updatedAt`: Last update timestamp
- `createdAt`: Creation timestamp

### EventReminder Model

```prisma
model EventReminder {
  id               String   @id @default(cuid())
  eventId          String
  event            Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId           String
  reminderMinutes  Int
  sentAt           DateTime @default(now())
  
  @@unique([eventId, userId, reminderMinutes])
  @@index([userId])
  @@index([eventId])
}
```

**Fields:**
- `id`: Unique identifier
- `eventId`: Event that reminder was sent for
- `userId`: User who received the reminder
- `reminderMinutes`: Minutes before event the reminder was sent
- `sentAt`: When reminder was sent

**Purpose**: Prevents duplicate reminders from being sent for the same event/user/reminder-time combination.

## Technical Implementation

### Backend

**Notification Creation** (`apps/backend/src/app/api/internal/cron/send-reminders/route.ts`):
- Runs as cron job endpoint
- Queries events in reminder window
- Creates notifications based on user preferences
- Sends emails via nodemailer
- Records reminders to prevent duplicates

**Notification API** (`apps/backend/src/app/api/notifications/route.ts`):
- `GET`: List notifications with filtering
- `PATCH`: Mark notifications as read/unread
- `DELETE`: Delete notifications

**Notification Preferences** (`apps/backend/src/app/api/settings/notifications/route.ts`):
- `GET`: Retrieve user preferences
- `POST`: Update user preferences

### Frontend

**Notification Component** (`apps/frontend/src/components/notifications.tsx`):
- Bell icon with unread badge
- Dropdown with notification list
- Auto-polling every 30 seconds
- Mark as read/delete actions
- Relative time formatting

**API Client** (`apps/frontend/src/lib/api.ts`):
- `api.notifications.list()`: Fetch notifications
- `api.notifications.markRead()`: Update read status
- `api.notifications.delete()`: Delete notification
- `api.settings.getNotifications()`: Get preferences
- `api.settings.updateNotifications()`: Update preferences

### Worker Service

**Reminder Job** (`apps/worker/src/jobs/send-reminders.ts`):
- Calls backend cron endpoint every minute
- Uses `INTERNAL_CRON_TOKEN` for authentication
- Logs results and errors

## Best Practices

### For Users

1. **Configure SMTP Early**: Set up email notifications during initial setup
2. **Set Appropriate Reminder Times**: Choose reminder times that work for your schedule
3. **Review Notifications Regularly**: Check notification center to stay updated
4. **Use Web Notifications**: Enable web notifications for instant in-app alerts
5. **Test Email Settings**: Use the "Test SMTP" button to verify email configuration

### For Developers

1. **Notification Limits**: Consider pagination for large notification lists
2. **Polling Optimization**: Current 30-second polling is reasonable for most use cases
3. **Error Handling**: Always handle notification API errors gracefully
4. **Cleanup**: Consider implementing automatic cleanup of old notifications
5. **Performance**: Index `userId` and `read` fields for efficient queries

## Troubleshooting

### Notifications Not Appearing

1. **Check Preferences**: Verify notification preferences are enabled
2. **Check Reminder Time**: Ensure reminder time is set (not null)
3. **Check Worker**: Verify worker service is running (`docker compose logs worker`)
4. **Check SMTP**: For email notifications, verify SMTP settings are correct
5. **Check Database**: Verify notifications are being created in database

### Email Not Sending

1. **SMTP Configuration**: Verify SMTP settings are correct
2. **Test Connection**: Use "Test SMTP" button in settings
3. **App Passwords**: For Gmail, use app-specific passwords
4. **Firewall**: Ensure SMTP ports are not blocked
5. **Logs**: Check backend logs for email sending errors

### Duplicate Notifications

1. **EventReminder Table**: Check if reminders are being tracked correctly
2. **Cron Timing**: Verify worker is not running multiple instances
3. **Time Windows**: Check reminder time calculations

## Future Enhancements

Potential improvements to the notification system:

- **Push Notifications**: Browser push notifications via Service Worker
- **Notification Categories**: Different types of notifications (events, invites, etc.)
- **Notification Sound**: Audio alerts for new notifications
- **Bulk Actions**: Mark all as read, delete all read notifications
- **Notification Filters**: Filter by type, date, read status
- **Email Templates**: Rich HTML email templates
- **SMS Notifications**: SMS reminders via Twilio or similar
- **Notification Scheduling**: Schedule notifications for specific times
- **Notification Groups**: Group related notifications together


