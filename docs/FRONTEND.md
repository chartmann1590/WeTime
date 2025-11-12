# WeTime Frontend Documentation

## Overview

The WeTime frontend is built with Next.js 15 using the App Router, React 18, and TypeScript. It's designed as a mobile-first Progressive Web App (PWA) with offline support.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PWA**: Service Worker for offline support

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx        # Admin panel
│   │   ├── calendars/
│   │   │   └── page.tsx        # Calendar management
│   │   ├── settings/
│   │   │   └── page.tsx        # User settings
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main calendar view
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── agenda-view.tsx
│   │   │   ├── day-view.tsx
│   │   │   ├── week-view.tsx
│   │   │   └── month-view.tsx
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── sheet.tsx
│   │   └── event-editor.tsx
│   ├── hooks/
│   │   └── use-auth.ts         # Authentication hook
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Global styles
├── public/
│   ├── favicon.ico
│   ├── icons/                  # PWA icons
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

## Pages

### Main Calendar Page (`/`)

The primary calendar interface with multiple view options.

![Main Calendar - Agenda View](../screenshots/screenshot-main-calendar-agenda.png)

**Calendar Views:**

- **Agenda View** (default on mobile):
  ![Agenda View](../screenshots/screenshot-calendar-agenda.png)

- **Day View**:
  ![Day View](../screenshots/screenshot-calendar-day-view.png)

- **3-Day View**:
  ![3-Day View](../screenshots/screenshot-calendar-3day-view.png)

- **Week View**:
  ![Week View](../screenshots/screenshot-calendar-week-view.png)

- **Month View**:
  ![Month View](../screenshots/screenshot-calendar-month-view.png)

**Event Editor:**

![Event Editor](../screenshots/screenshot-event-editor.png)

**Event Editor (Open):**

![Event Editor Open](../screenshots/screenshot-event-editor-open.png)

**Features:**
- Multiple calendar views (Agenda, Day, 3-Day, Week, Month)
- Date navigation (previous/next)
- Event creation and editing
- Calendar filtering
- Responsive design (mobile-first)

**Components Used:**
- `AgendaView`, `DayView`, `WeekView`, `MonthView`
- `EventEditor`
- Header with navigation controls

**State Management:**
- Current view type
- Current date
- Events list (from API)
- Calendars list (from API)
- Event editor open/closed state

---

### Login Page (`/login`)

User authentication page.

![Login Page](../screenshots/screenshot-login.png)

**Features:**
- Email/password login
- Redirect to signup
- Error handling
- Form validation

---

### Signup Page (`/signup`)

New user registration page.

![Signup Page](../screenshots/screenshot-signup.png)

**Features:**
- Email, password, name fields
- Password confirmation
- Form validation
- Redirect to login on success

---

### Calendars Page (`/calendars`)

Calendar management interface.

![Calendar Management](../screenshots/screenshot-calendars.png)

![Calendar Management Full](../screenshots/screenshot-calendars-management.png)

**Features:**
- List all calendars
- Create new calendars (Personal, External)
- Import .ics files
- Refresh external calendars
- Delete calendars
- Export calendars as .ics

**Calendar Types:**
- **Personal**: User-owned calendar
- **External**: Synced from iCal URL
- **Shared**: Automatically created for couples
- **Imported**: Created from .ics file upload

---

### Settings Page (`/settings`)

User account and application settings.

![Settings Page](../screenshots/screenshot-settings.png)

![Settings Profile](../screenshots/screenshot-settings-profile.png)

**Sections:**
1. **Profile**: Update email and name
2. **Password**: Change password
3. **Couple Information**: View/join couple
4. **SMTP Configuration**: Email settings for reminders
5. **Calendars**: Link to calendar management

---

### Admin Page (`/admin`)

Administrator panel (admin users only).

![Admin Panel](../screenshots/screenshot-admin.png)

**Features:**
- User management
- Calendar management
- Event management
- Couple management
- Duplicate cleanup tools

**Admin Panel Tabs:**

- **Users Tab**:
  ![Users Tab](../screenshots/screenshot-admin.png)

- **Calendars Tab**:
  ![Calendars Tab](../screenshots/screenshot-admin-calendars.png)

- **Events Tab**:
  ![Events Tab](../screenshots/screenshot-admin-events.png)

- **Couples Tab**:
  ![Couples Tab](../screenshots/screenshot-admin-couples.png)

- **Cleanup Tab**:
  ![Cleanup Tab](../screenshots/screenshot-admin-cleanup.png)

See [ADMIN.md](./ADMIN.md) for details.

---

## Components

### Calendar Views

#### AgendaView

Mobile-optimized list view showing upcoming events.

**Props:**
- `events`: Array of events
- `currentDate`: Current date for filtering

**Features:**
- Groups events by date
- Shows event time and calendar color
- Click to edit event

---

#### DayView

Single day timeline view.

**Props:**
- `events`: Array of events
- `date`: Date to display
- `onEventClick`: Event click handler

**Features:**
- Hour-by-hour timeline
- Event blocks positioned by time
- All-day events at top
- Click events to edit

---

#### WeekView

7-day week grid view.

**Props:**
- `events`: Array of events
- `weekStart`: Start date of week
- `onEventClick`: Event click handler

**Features:**
- 7 columns (one per day)
- Hour rows
- Events span across days if multi-day
- Click events to edit

---

#### MonthView

Full month calendar grid.

**Props:**
- `events`: Array of events
- `month`: Month to display
- `onEventClick`: Event click handler
- `onDayClick`: Day click handler

**Features:**
- Traditional calendar grid
- Event dots/indicators
- Click day to switch to day view
- Click event to edit

---

### EventEditor

Modal dialog for creating/editing events.

**Props:**
- `open`: Boolean to control visibility
- `onClose`: Close handler
- `event`: Event to edit (null for new event)
- `calendars`: Available calendars
- `onSave`: Callback after save
- `defaultDate`: Default date for new events

**Features:**
- Title, description, location fields
- Start/end date and time pickers
- All-day toggle
- Calendar selection
- Recurrence rule editor
- Visibility settings
- Save and delete actions

---

### UI Components

Located in `src/components/ui/`, these are reusable primitives built on Radix UI:

- **Button**: Various styles and sizes
- **Card**: Container with header/content
- **Dialog**: Modal dialogs
- **Input**: Text input fields
- **Sheet**: Slide-out panels

---

## Hooks

### useAuth

Custom hook for authentication state and actions.

**Returns:**
- `user`: Current user object (or null)
- `loading`: Loading state
- `logout`: Logout function

**Usage:**
```typescript
const { user, loading, logout } = useAuth()
```

---

## API Client

Located in `src/lib/api.ts`, provides typed API methods.

**Methods:**
- `auth.signup()`, `auth.login()`, `auth.logout()`
- `couple.create()`, `couple.join()`, `couple.get()`
- `calendars.list()`, `calendars.create()`, etc.
- `events.list()`, `events.create()`, etc.
- `user.getProfile()`, `user.updateProfile()`, etc.
- `settings.getSmtp()`, `settings.saveSmtp()`, etc.

**Features:**
- Automatic CSRF token handling
- Cookie-based authentication
- Error handling
- TypeScript types

---

## Styling

### Tailwind CSS

The app uses Tailwind CSS for styling with a custom configuration.

**Theme:**
- Light/dark mode support (via CSS variables)
- Custom color palette
- Responsive breakpoints
- Animation utilities

**Key Classes:**
- `bg-background`: Main background color
- `text-foreground`: Main text color
- `text-muted-foreground`: Secondary text
- `border-border`: Border color

### Global Styles

`src/styles/globals.css` contains:
- CSS variables for theming
- Base styles
- Utility classes

---

## PWA Features

### Service Worker

`public/sw.js` provides:
- Offline caching
- Asset caching
- Network-first strategy for API calls
- Cache-first for static assets

### Manifest

`public/manifest.json` defines:
- App name and description
- Icons for various sizes
- Display mode (standalone)
- Theme colors
- Start URL

### Installation

Users can install the app on:
- iOS: Add to Home Screen
- Android: Install prompt
- Desktop: Browser install button

---

## State Management

### React Query

TanStack Query is used for:
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates

**Query Keys:**
- `['calendars']`: Calendar list
- `['events', rangeStart, rangeEnd]`: Events in range
- `['user', 'profile']`: User profile

---

## Routing

Next.js App Router handles routing:

- File-based routing
- Route groups: `(auth)` for auth pages
- Layouts: `layout.tsx` for shared UI
- Server and client components

**Protected Routes:**
- Client-side redirect to `/login` if not authenticated
- API calls validate authentication

---

## Date/Time Handling

### Timezone Support

- All dates stored in UTC in database
- Frontend converts to user's timezone
- User timezone stored in `User.timeZone` field
- Events displayed in user's local time

### Date Utilities

`src/lib/utils.ts` contains:
- `addDays()`, `addWeeks()`, `addMonths()`
- `getWeekStart()`, `getMonthStart()`
- Date formatting helpers

---

## Error Handling

### API Errors

- Network errors caught and displayed
- Validation errors shown inline
- 401 errors trigger logout and redirect
- Generic error messages for user-facing errors

### Error Boundaries

- React Error Boundaries for component errors
- Fallback UI for crashes
- Error logging (console in dev)

---

## Performance Optimizations

### Code Splitting

- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting

### Image Optimization

- Next.js Image component (if used)
- Lazy loading
- Responsive images

### Caching

- React Query caching
- Service worker caching
- Static asset caching via nginx

---

## Accessibility

### ARIA Labels

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support

### Responsive Design

- Mobile-first approach
- Touch-friendly targets (min 44x44px)
- Readable font sizes
- High contrast ratios

---

## Browser Support

### Modern Browsers

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Features Used

- Service Workers (PWA)
- CSS Grid and Flexbox
- ES6+ JavaScript
- Fetch API

---

## Development

### Running Locally

```bash
cd apps/frontend
pnpm install
pnpm dev
```

### Building

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

---

## Testing

### E2E Tests

Playwright tests in `tests/frontend/`:
- `smoke.spec.ts`: Basic smoke tests

### Running Tests

```bash
pnpm test:e2e
pnpm test:e2e:ui  # With UI
```

---

## Future Enhancements

Potential improvements:

- **Offline Mode**: Full offline event editing
- **Push Notifications**: Browser push API
- **Dark Mode Toggle**: User preference
- **Calendar Sharing**: Share calendars with non-couple users
- **Event Templates**: Quick event creation
- **Keyboard Shortcuts**: Power user features
- **Drag & Drop**: Reorder events
- **Search**: Full-text event search

