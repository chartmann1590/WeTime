# WeTime Architecture Documentation

## Overview

WeTime is a couples calendar application built as a modern, full-stack web application with a microservices architecture. The system is designed to be mobile-first, secure, and scalable.

> **Note**: The architecture diagram below shows the high-level system design. For a visual representation, see the ASCII diagram in the "High-Level Architecture" section.

## System Architecture

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
│  (PWA)      │
└──────┬──────┘
       │ HTTPS
       │
┌──────▼─────────────────────────────────────┐
│              Nginx (Port 80/443)            │
│  - SSL Termination                          │
│  - Reverse Proxy                            │
│  - Static Asset Serving                      │
└──────┬──────────────────────────────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────┐
│  Frontend   │ │  Backend   │ │  Worker  │
│  (Next.js)  │ │  (Next.js) │ │ (Node.js)│
│  Port 3000  │ │  Port 3001 │ │  Cron    │
└─────────────┘ └─────┬──────┘ └──────────┘
                      │
              ┌───────▼───────┐
              │  PostgreSQL   │
              │  Port 5432    │
              └───────────────┘
```

## Service Components

### 1. Frontend (`apps/frontend`)

**Technology Stack:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Framer Motion
- Radix UI components

**Key Features:**
- Progressive Web App (PWA) with service worker
- Mobile-first responsive design
- Multiple calendar views (Agenda, Day, 3-Day, Week, Month)
- Real-time event management
- Offline support via service worker

**Structure:**
```
apps/frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/      # Auth routes (login, signup)
│   │   ├── admin/       # Admin panel
│   │   ├── calendars/   # Calendar management
│   │   ├── settings/    # User settings
│   │   └── page.tsx     # Main calendar view
│   ├── components/      # React components
│   │   ├── calendar/    # Calendar view components
│   │   ├── ui/          # UI primitives
│   │   └── event-editor.tsx
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and API client
│   ├── types/           # TypeScript types
│   └── styles/          # Global styles
└── public/              # Static assets, PWA manifest
```

**Key Components:**
- `AgendaView`: Mobile-optimized list view
- `DayView`: Single day timeline view
- `WeekView`: 7-day week grid view
- `MonthView`: Full month calendar grid
- `EventEditor`: Modal for creating/editing events
- `Notifications`: Notification bell icon and dropdown

### 2. Backend (`apps/backend`)

**Technology Stack:**
- Next.js 15 (API Routes)
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt for password hashing
- node-ical for ICS parsing
- nodemailer for email sending

**Key Features:**
- RESTful API endpoints
- JWT-based authentication
- CSRF protection
- Rate limiting
- ICS import/export
- Email reminder system
- Admin panel API

**API Structure:**
```
apps/backend/src/app/api/
├── auth/              # Authentication endpoints
├── couple/           # Couple management
├── calendars/        # Calendar CRUD operations
├── events/           # Event CRUD operations
├── user/             # User profile management
├── settings/         # User settings (SMTP, notifications)
├── notifications/    # Notification management
├── internal/         # Internal cron endpoints
└── admin/            # Admin-only endpoints
```

**Authentication Flow:**
1. User submits credentials via `/api/auth/login`
2. Backend verifies password with bcrypt
3. JWT token generated and set as HttpOnly cookie
4. Subsequent requests include cookie automatically
5. Middleware validates JWT on protected routes

### 3. Worker (`apps/worker`)

**Technology Stack:**
- Node.js
- TypeScript
- node-cron for scheduling

**Scheduled Jobs:**
- **ICS Refresh** (every 15 minutes): Fetches and updates external calendar feeds
- **Send Reminders** (every minute): Sends email and web notifications for upcoming events based on user preferences

**Job Implementation:**
- Jobs call backend API endpoints via HTTP
- Uses `INTERNAL_CRON_TOKEN` for authentication
- Logs results and errors

### 4. Database (`prisma/`)

**Technology:**
- PostgreSQL 16
- Prisma ORM

**Schema Overview:**
- **User**: User accounts with authentication
- **Couple**: Links two users together
- **Calendar**: Personal, shared, external, or imported calendars
- **Event**: Calendar events with recurrence support
- **Attendee**: RSVP tracking for events
- **SmtpSetting**: Encrypted email configuration per user
- **Notification**: Web notifications for event reminders
- **NotificationPreference**: User notification preferences and settings
- **EventReminder**: Tracks sent reminders to prevent duplicates

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

### 5. Nginx (`deploy/nginx/`)

**Configuration:**
- SSL/TLS termination (self-signed certificates)
- HTTP to HTTPS redirect
- Reverse proxy for frontend and backend
- Static asset caching
- PWA manifest and service worker serving

## Data Flow

### Event Creation Flow

```
1. User clicks "New Event" in frontend
2. EventEditor component opens
3. User fills form and submits
4. Frontend calls POST /api/events
5. Backend validates request and user auth
6. Prisma creates event in database
7. Response returned to frontend
8. Frontend refetches events and updates UI
```

### External Calendar Sync Flow

```
1. Worker cron job triggers (every 15 minutes)
2. Worker calls POST /api/internal/cron/refresh-ics
3. Backend fetches all EXTERNAL calendars
4. For each calendar:
   a. Fetches ICS from external URL
   b. Parses ICS file
   c. Upserts events by externalUid
   d. Updates lastFetched timestamp
5. Returns summary of synced calendars
```

### Notification Reminder Flow

```
1. Worker cron job triggers (every minute)
2. Worker calls POST /api/internal/cron/send-reminders
3. Backend queries users with notification preferences enabled
4. For each user:
   a. Gets user's reminder time preference
   b. Finds events in reminder window (based on preference)
   c. For each event:
      - Checks if reminder already sent (EventReminder table)
      - Calculates if reminder should be sent now
      - If email enabled: sends email via nodemailer
      - If web enabled: creates Notification record
      - Records reminder in EventReminder table
5. Returns count of emails sent and web notifications created
```

## Network Architecture

### Docker Network

All services run on a custom bridge network (`wetime_net`):
- Services communicate via service names (e.g., `backend:3001`)
- Only nginx exposes ports to host (80, 443)
- Internal services are not directly accessible from host

### Port Mapping

- **80/443**: Nginx (exposed to host)
- **3000**: Frontend (internal only)
- **3001**: Backend (internal only)
- **5432**: PostgreSQL (internal only)

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Stored in HttpOnly cookies
- **Password Hashing**: bcrypt with 10 salt rounds
- **CSRF Protection**: Token-based validation on mutating routes
- **Rate Limiting**: Per-IP and per-user limits
- **Secure Cookies**: HttpOnly, SameSite=Lax, Secure flags

### Data Encryption

- **SMTP Passwords**: Encrypted at rest using AES-256
- **Database**: All data stored in PostgreSQL (encrypted at rest if configured)
- **HTTPS**: All traffic encrypted in transit (self-signed certs)

### Access Control

- **User-level**: Users can only access their own data
- **Couple-level**: Couple members share calendars and events
- **Admin-level**: Admins can access all data via `/admin` panel

## Scalability Considerations

### Current Architecture

- Monolithic backend (all API routes in one service)
- Single database instance
- Stateless services (can be horizontally scaled)
- Worker service can be scaled independently

### Potential Improvements

1. **Database**: Read replicas for query scaling
2. **Caching**: Redis for session storage and query caching
3. **Queue System**: RabbitMQ/Kafka for async job processing
4. **CDN**: CloudFlare or similar for static assets
5. **Load Balancing**: Multiple backend instances behind load balancer

## Development vs Production

### Development

- Services run via `pnpm dev` (Next.js dev servers)
- Hot reload enabled
- Detailed error messages
- No SSL (HTTP only)

### Production (Docker)

- Services run as built Next.js apps
- Optimized builds
- SSL/TLS enabled
- Health checks configured
- Volume persistence for database

## Monitoring & Logging

### Current State

- Console logging in all services
- Docker logs accessible via `docker compose logs`
- No centralized logging system
- No metrics collection

### Recommended Additions

- Structured logging (Winston, Pino)
- Log aggregation (ELK stack, Loki)
- Application monitoring (Prometheus, Grafana)
- Error tracking (Sentry, Rollbar)
- Uptime monitoring (UptimeRobot, Pingdom)

## Deployment Architecture

### Docker Compose Stack

All services defined in `docker-compose.yml`:
- **db**: PostgreSQL with health checks
- **backend**: Next.js API with auto-migration
- **frontend**: Next.js app
- **worker**: Cron service
- **nginx**: Reverse proxy

### Volumes

- **dbdata**: PostgreSQL data persistence
- **uploads**: File uploads (if implemented)
- **certs**: SSL certificates

### Environment Variables

All services share `.env` file with:
- Database connection string
- JWT secret
- Cookie secret
- Internal cron token
- Timezone defaults

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.


