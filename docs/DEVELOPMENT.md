# WeTime Development Guide

## Overview

This guide covers setting up a local development environment for WeTime, including prerequisites, setup steps, and development workflows.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: Latest version (package manager)
- **Docker & Docker Compose**: For running PostgreSQL
- **Git**: For version control
- **Code Editor**: VS Code recommended (with extensions)

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd cupla-clone
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces:
- Root workspace
- `apps/frontend`
- `apps/backend`
- `apps/worker`
- `packages/*`

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with local settings:

```env
# Database (for local development)
DATABASE_URL=postgresql://wetime:wetime_password@localhost:5432/wetime

# Secrets (use strong values in production)
JWT_SECRET=dev-secret-change-in-production
COOKIE_SECRET=dev-cookie-secret
INTERNAL_CRON_TOKEN=dev-cron-token

# Timezone
DEFAULT_TIMEZONE=America/New_York
```

### 4. Start Database

```bash
# Start only PostgreSQL
docker compose up -d db

# Wait for database to be ready
docker compose ps db
```

### 5. Setup Database Schema

```bash
cd apps/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed demo data
npm run seed
```

### 6. Start Development Servers

```bash
# From root directory
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

> **Note**: The development servers run with hot reload enabled. Changes to code will automatically refresh in the browser. You can verify the servers are running by checking the terminal output or visiting the URLs in your browser.

## Development Workflow

### Project Structure

```
cupla-clone/
├── apps/
│   ├── frontend/      # Next.js frontend app
│   ├── backend/       # Next.js API routes
│   └── worker/        # Background cron jobs
├── packages/          # Shared packages (if any)
├── prisma/            # Database schema
└── docs/              # Documentation
```

### Workspace Management

WeTime uses pnpm workspaces. Commands can be run from root or specific apps:

**From Root:**
```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps
```

**From App Directory:**
```bash
cd apps/frontend
pnpm dev              # Start only frontend
pnpm build            # Build only frontend
```

### Code Style

**TypeScript:**
- Strict mode enabled
- 2-space indentation
- Prefer explicit types
- Use interfaces for object shapes

**React:**
- Functional components only
- Hooks for state management
- TypeScript for props

**Naming Conventions:**
- Components: PascalCase (`EventEditor.tsx`)
- Files: kebab-case or camelCase
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### Database Development

**Prisma Studio (Visual Editor):**

```bash
cd apps/backend
npx prisma studio
```

Opens at http://localhost:5555

> **Note**: Prisma Studio provides a visual interface to browse and edit your database. Start it with `npx prisma studio` from the `apps/backend` directory. A screenshot of Prisma Studio would show the database tables and data in a user-friendly interface.

**Create Migration:**

```bash
cd apps/backend

# Make schema changes in prisma/schema.prisma
# Then create migration:
npx prisma migrate dev --name descriptive_name
```

**Reset Database:**

```bash
cd apps/backend
npx prisma migrate reset
```

**Generate Prisma Client:**

```bash
cd apps/backend
npx prisma generate
```

### API Development

**Adding New Endpoint:**

1. Create route file in `apps/backend/src/app/api/`:
```
apps/backend/src/app/api/example/route.ts
```

2. Export handler functions:
```typescript
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getUserFromRequest(req as any)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Your logic here
  return NextResponse.json({ data: 'example' })
}
```

3. Test endpoint:
```bash
curl http://localhost:3001/api/example
```

### Frontend Development

**Adding New Page:**

1. Create page file in `apps/frontend/src/app/`:
```
apps/frontend/src/app/example/page.tsx
```

2. Export default component:
```typescript
export default function ExamplePage() {
  return <div>Example Page</div>
}
```

**Adding New Component:**

1. Create component file:
```
apps/frontend/src/components/example-component.tsx
```

2. Use in pages:
```typescript
import { ExampleComponent } from '@/components/example-component'
```

**API Client:**

Add methods to `apps/frontend/src/lib/api.ts`:

```typescript
export const api = {
  // ... existing methods
  example: {
    get: () => fetchApi('/example'),
    create: (data: any) => fetchApi('/example', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}
```

### Testing

**Run Tests:**

```bash
# E2E tests (Playwright)
cd apps/frontend
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

**Write Tests:**

Create test files in `tests/frontend/`:

```typescript
import { test, expect } from '@playwright/test'

test('example test', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/WeTime/)
})
```

### Debugging

**Backend Debugging:**

1. Add console.log statements
2. Use VS Code debugger:
   - Create `.vscode/launch.json`
   - Attach to Node.js process

**Frontend Debugging:**

1. Use React DevTools browser extension
2. Browser console for errors
3. Network tab for API calls

**Database Debugging:**

1. Use Prisma Studio
2. Direct SQL queries:
```bash
docker compose exec db psql -U wetime -d wetime
```

### Hot Reload

**Frontend:**
- Next.js Fast Refresh enabled
- Changes to components auto-reload
- State preserved when possible

**Backend:**
- Next.js API routes hot reload
- Restart required for some changes (env vars, etc.)

### Linting

**Run Linter:**

```bash
pnpm lint
```

**Fix Issues:**

```bash
pnpm lint --fix
```

**ESLint Config:**
- Uses Next.js ESLint config
- TypeScript-aware
- React best practices

## Common Tasks

### Create Admin User

```bash
cd apps/backend
npm run create-admin
```

Or with custom credentials:
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure123 npm run create-admin
```

### Seed Demo Data

```bash
cd apps/backend
npm run seed
```

Creates:
- Demo users (alice@example.com, bob@example.com)
- Demo couple
- Sample calendars and events

### Reset Everything

```bash
# Stop all services
docker compose down

# Remove volumes (deletes data)
docker compose down -v

# Restart
docker compose up -d db
cd apps/backend
npx prisma migrate dev
npm run seed
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Update Dependencies

```bash
# Update all
pnpm update

# Update specific package
pnpm update package-name

# Update to latest
pnpm update --latest
```

## Git Workflow

### Branching

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

### Commits

Use Conventional Commits:

```
feat: add event recurrence support
fix: correct timezone handling
docs: update API documentation
refactor: simplify calendar component
chore: update dependencies
```

### Pull Requests

PRs should include:
- Clear description
- Screenshots (for UI changes)
- Testing instructions
- Migration notes (if database changed)

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev
```

### Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if database is running
docker compose ps db

# Start database
docker compose up -d db

# Check connection string in .env
```

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd apps/backend
npx prisma generate
```

### Module Not Found

**Error:** `Cannot find module '@/lib/...'`

**Solution:**
- Check `tsconfig.json` path aliases
- Restart TypeScript server in VS Code
- Rebuild: `pnpm build`

### Type Errors

**Error:** TypeScript compilation errors

**Solution:**
- Check `tsconfig.json` configuration
- Ensure types are imported correctly
- Run `pnpm build` to see all errors

## Performance Tips

### Database Queries

- Use Prisma's `select` to limit fields
- Use `include` carefully to avoid N+1 queries
- Add indexes for frequently queried fields

### Frontend Optimization

- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images
- Use TanStack Query caching

### Build Performance

- Use pnpm for faster installs
- Cache node_modules
- Use Docker layer caching

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Getting Help

1. Check existing documentation in `docs/`
2. Review code comments
3. Check GitHub issues
4. Ask in team chat/forum

