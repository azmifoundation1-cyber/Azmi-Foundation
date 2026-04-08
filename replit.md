# Azmi Foundation

## Overview

Azmi Foundation is a professional NGO website built to promote interfaith harmony and sustainable development. The platform enables donation campaigns, volunteer/member/intern registrations, program showcases, user dashboards, and a full admin panel for managing all platform activity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for page transitions
- **Build Tool**: Vite with path aliases (`@/` for client/src, `@shared/` for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints with Zod schemas for validation
- **Authentication**: Replit Auth (OpenID Connect) with session management
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Role-based access**: Users have `role: "user" | "admin"` with middleware-protected admin routes

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema integration (drizzle-zod)
- **Schema Location**: `shared/schema.ts`, `shared/models/auth.ts`
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Managed by Replit Auth, includes `role` field (user/admin)
- **Campaigns**: Fundraising campaigns with category, story, featured flag, video URL, end date
- **CampaignUpdates**: Progress updates posted by admins for each campaign
- **Donations**: Linked to campaigns with payment status, method, phone, message, 80G receipt flag
- **Programs**: NGO initiatives with status (upcoming/ongoing/completed), location, category
- **Registrations**: Member/volunteer/intern applications with admin notes and status
- **ContactMessages**: Messages from the contact form, managed by admins

### Pages
- `/` — Home with hero, stats, featured campaigns
- `/about` — Foundation history, mission, vision, leadership
- `/campaigns` — Campaign listing grid
- `/campaigns/:id` — Campaign detail page with story, YouTube embed, donation widget, UPI QR, supporters list, updates
- `/contact` — Office address, bank details, social media, **contact form**
- `/programs` — Program listing
- `/donate` — Donation form
- `/get-involved` — Volunteer/member/intern registration
- `/dashboard` — Authenticated user dashboard (my applications + my donations tabs, Bootstrap Admin button)
- `/admin` — Admin dashboard with stats overview
- `/admin/campaigns` — Campaign CRUD (create, edit, delete, post updates, toggle featured)
- `/admin/donations` — Donation management (filter, confirm/fail/refund, CSV export)
- `/admin/registrations` — Registration approve/reject with admin notes
- `/admin/programs` — Program CRUD
- `/admin/users` — User management and role assignment
- `/admin/messages` — Contact message inbox (read, reply, add notes)

### Admin Access
1. Sign in with Replit Auth
2. Go to `/dashboard`
3. Click **"Become Admin"** button (only works if no admin exists yet)
4. After becoming admin, the navbar will show an **Admin Panel** link

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (Navbar, Footer, shadcn/ui)
│       ├── hooks/        # Custom React hooks (use-auth, use-campaigns, etc.)
│       ├── pages/        # Route pages
│       │   └── admin/    # Admin panel pages
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── routes.ts     # All API routes (public, authenticated, admin)
│   ├── storage.ts    # Database access layer (IStorage interface)
│   └── replit_integrations/auth/  # Replit Auth setup
├── shared/           # Shared types and routes
│   ├── schema.ts     # Database schema (all tables)
│   ├── routes.ts     # Typed API route definitions
│   └── models/       # Auth models (users, sessions)
```

### API Endpoints Summary

#### Public
- `GET /api/campaigns` — List all campaigns
- `GET /api/campaigns/featured` — Featured campaigns
- `GET /api/campaigns/:id` — Campaign detail
- `GET /api/campaigns/:id/updates` — Campaign progress updates
- `GET /api/programs` — List programs
- `GET /api/donations/campaign/:id` — Donations for a campaign
- `POST /api/donations` — Create donation (auto-links user if logged in)
- `POST /api/contact` — Submit contact form

#### Authenticated Users
- `POST /api/registrations` — Submit application
- `GET /api/my/donations` — My donation history
- `GET /api/my/registrations` — My applications
- `POST /api/admin/bootstrap` — Become first admin (if no admin exists)

#### Admin Only
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/users` — All users
- `PATCH /api/admin/users/:id/role` — Change user role
- `POST /api/campaigns` — Create campaign
- `PUT /api/admin/campaigns/:id` — Update campaign
- `DELETE /api/admin/campaigns/:id` — Delete campaign
- `POST /api/admin/campaigns/:id/updates` — Post campaign update
- `DELETE /api/admin/campaign-updates/:id` — Delete update
- `GET /api/donations` — All donations
- `PATCH /api/admin/donations/:id/status` — Update donation status
- `GET /api/registrations` — All registrations
- `PATCH /api/admin/registrations/:id/status` — Approve/reject
- `POST /api/programs` — Create program
- `PUT /api/admin/programs/:id` — Update program
- `DELETE /api/admin/programs/:id` — Delete program
- `GET /api/admin/messages` — All contact messages
- `PATCH /api/admin/messages/:id/status` — Update message status

### Authentication Flow
- Uses Replit Auth via OpenID Connect
- Sessions stored in PostgreSQL `sessions` table
- User data stored in `users` table with auto-upsert on login
- Protected routes use `isAuthenticated` middleware
- Admin routes use `isAdmin` middleware (checks `users.role === "admin"`)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Passport.js**: Authentication middleware

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit deployment identifier (auto-provided)
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)
