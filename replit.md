# Azmi Foundation

## Overview

Azmi Foundation is a professional NGO website built to promote interfaith harmony and sustainable development. The platform enables donation campaigns, volunteer/member/intern registrations, program showcases, and user dashboards. It features a modern React frontend with a Node.js/Express backend, PostgreSQL database, and Replit Auth integration for user authentication.

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
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Authentication**: Replit Auth (OpenID Connect) with session management
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema integration (drizzle-zod)
- **Schema Location**: `shared/schema.ts` for shared types, `shared/models/auth.ts` for auth tables
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Managed by Replit Auth with sessions table
- **Campaigns**: Fundraising campaigns with target/current amounts
- **Donations**: Linked to campaigns with payment status tracking
- **Programs**: NGO initiatives and events
- **Registrations**: Member/volunteer/intern applications linked to users

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn/ui based)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route pages
│       └── lib/          # Utilities
├── server/           # Express backend
│   └── replit_integrations/auth/  # Replit Auth setup
├── shared/           # Shared types and routes
│   ├── schema.ts     # Database schema
│   ├── routes.ts     # API route definitions
│   └── models/       # Auth models
└── migrations/       # Database migrations
```

### Authentication Flow
- Uses Replit Auth via OpenID Connect
- Sessions stored in PostgreSQL `sessions` table
- User data stored in `users` table with auto-upsert on login
- Protected routes use `isAuthenticated` middleware

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable

### Authentication
- **Replit Auth**: OpenID Connect provider (issuer URL: replit.com/oidc)
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit deployment identifier (auto-provided)
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide icons, Tailwind CSS
- **Data**: Drizzle ORM, TanStack React Query
- **Auth**: Passport, express-session, openid-client
- **Validation**: Zod, React Hook Form