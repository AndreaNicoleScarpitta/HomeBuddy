# Home Buddy - Home Maintenance Assistant

## Overview
Home Buddy is a home maintenance assistant web application with OAuth authentication, home profile management, AI-powered maintenance task tracking, chat assistant interface, and comprehensive budget/funds tracking.

## Current State
- Full authentication system with Replit Auth
- Complete database schema with all tables
- All API routes with structured logging and error handling
- Budget tracker with funds, allocations, and expenses
- Contact form (stores to database, email forwarding pending)
- Unit tests with Vitest (17 passing tests)

## Recent Changes
- 2026-01-04: Added logging, improved error handling, contact form, unit tests

## Architecture

### Database Tables
- users (Replit Auth)
- homes (user's home profile)
- systems (HVAC, plumbing, etc.)
- maintenanceTasks (maintenance items)
- chatMessages (chat history)
- funds (budget tracking)
- fundAllocations (money earmarked for tasks)
- expenses (actual spending)
- contactMessages (contact form submissions)

### Key Files
- `shared/schema.ts` - Database schema with Drizzle ORM
- `server/routes.ts` - All API endpoints with logging
- `server/storage.ts` - Database operations
- `server/lib/logger.ts` - Structured logging with pino
- `client/src/pages/` - React pages (Dashboard, Budget, Chat, Contact)

## Pending Features

### Email Integration
Contact form currently stores messages to database. To enable email forwarding to andrew.scarpitta@gmail.com:
1. Set up Resend integration, OR
2. Add RESEND_API_KEY secret manually

## User Preferences
- Design: "Modern Utility" aesthetic with construction orange (#f97316)
- Typography: Plus Jakarta Sans (headings), Inter (UI)
- UX: Emotional design, no-shame budgeting approach

## Running Tests
```bash
npx vitest run
```

## Environment Variables
- DATABASE_URL - PostgreSQL connection (auto-provided)
- Replit Auth - Handled automatically
