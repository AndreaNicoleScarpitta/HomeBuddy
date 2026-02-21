# Home Buddy - Home Maintenance Assistant

## Overview
Home Buddy is a home maintenance assistant web application with OAuth authentication, home profile management, AI-powered maintenance task tracking, chat assistant interface, and comprehensive budget/funds tracking. Now configured as a Progressive Web App (PWA) ready for browser installation and potential Google Play Store submission.

## Current State
- Social login authentication (Google, Facebook, Instagram via Passport.js)
- Complete database schema with all tables
- All API routes with structured logging and error handling
- Authorization checks on all routes (users can only access their own data)
- AI-powered chat with streaming responses (GPT-4o)
- Budget tracker with funds, allocations, and expenses
- Contact form with email notifications (Resend)
- Environment validation at startup (fail-fast on missing required vars)
- Unit tests with Vitest (36 passing tests)
- PWA with service worker and manifest for installability
- Legal Terms & Conditions page accessible without authentication

## Recent Changes
- 2026-02-21: Security Hardening Pass:
  - C1 (IDOR): Ownership verification helpers on all v2 mutation endpoints (systems, tasks, reports, findings, chat, assistant)
  - C2 (Event leakage): v2/events endpoints filter by user ownership via LEFT JOINs
  - C3-C5 (Data deletion): deleteAllUserData handles v2 UUID homes, correct column names, orphaned events
  - H1-H3 (Event semantics): TaskUpdated, SystemDeleted, InspectionReportDeleted event types with state machine transitions
  - H4 (Email validation): Contact form schema uses .email() validation
  - H5 (Legacy validation): Zod partial schemas on all legacy PATCH routes (tasks, log entries, funds, allocations, expenses)
  - H6-H7 (Error sanitization): handleError hides PG internals, FK constraint names for 500 responses
  - H8-H9 (Rate limiting): express-rate-limit — 100 req/min API mutations, 20 req/15min auth endpoints
  - All 103 tests passing
- 2026-02-21: Milestone 7 — Cutover (Frontend to V2):
  - Updated frontend API client with V2 types (V2Home, V2System, V2Task, V2Report, V2ChatMessage)
  - Added idempotency key generation for all v2 mutations
  - Hybrid approach: v2 for home/system/task/report/notification, legacy for budget/log/appointment/chat-SSE
  - V2Home has legacyId field for bridging to integer-based legacy APIs
  - Updated all frontend components from @shared/schema legacy types to V2 types from api.ts
  - Updated dashboard, maintenance-log, inspections, budget pages for string UUID IDs
  - Pages use home.legacyId for budget/log/contractor-appointment API calls
  - V2 routes auth middleware with X-Test-User-Id bypass in non-production for integration tests
  - Fixed PATCH /homes/:homeId SQL parameterization (proper drizzle sql template tags)
  - Updated command-pipeline and assistant-gating tests with auth headers and test user creation
  - All 103 tests passing
- 2026-02-21: Milestone 6 — Backfill/Migration:
  - Implemented server/cli/backfill.ts with full CRUD-to-event-log migration
  - deterministicUuid() creates stable UUID v4 from SHA-256 hash of namespace:type:id
  - idempotencyKey() builds predictable keys (safe to re-run)
  - Per-table import: homes → systems → tasks → reports → notification prefs → chat
  - Task status mapping: pending→proposed, completed→proposed+approved+started+done, scheduled→proposed+approved+scheduled, skipped→proposed+skipped
  - Chat backfill creates sessions per home, messages with seq numbering and metadata preservation
  - --dry-run flag shows counts without writing events
  - Full backfill wrapped in single DB transaction, rebuilds projections after
  - Added 9 Vitest tests: deterministic UUID, idempotency keys, dry-run, full run, re-run idempotency, projection verification
  - Set fileParallelism: false in vitest.config.ts for DB test isolation
  - All 103 tests passing (9 new + 94 existing)
- 2026-02-21: Privacy & Data Management:
  - Added dataStorageOptOut field to users table for chat data opt-out
  - Added imageData, imageType columns to chat_messages for photo persistence
  - Added model, promptTokens, completionTokens to chat_messages for AI metadata tracking
  - Updated streamAIResponse to return AIResponseMeta (model name, token usage via stream_options)
  - Chat route respects dataStorageOptOut: skips message persistence when opted out
  - Chat route persists image data and AI metadata per message
  - Added GET/PUT /api/user/privacy routes for opt-out toggle
  - Added DELETE /api/user/data route for full data deletion
  - deleteAllUserData is transactional, purges legacy tables + event_log + all projection tables + job_queue
  - Profile page: Data & Privacy card with Switch toggle and AlertDialog confirmation for data deletion
  - All 94 tests passing
- 2026-02-21: Milestone 5 — Workers & Reconciliation:
  - Created server/jobs/queue.ts with enqueue/lock (SKIP LOCKED)/complete/fail with retry backoff and dead-letter
  - Created server/jobs/reportAnalyzer.ts (emits InspectionReportAnalyzedDraft with {draft} shape)
  - Created server/jobs/digester.ts (emits DigestDelivered with task summary in meta)
  - Created server/jobs/reconciler.ts (detects stuck reports >30min, overdue tasks; emits RetryRequested/TaskOverdueMarked with deterministic idempotency keys)
  - Implemented server/worker/worker.ts — poll loop with SKIP LOCKED, handler dispatch, graceful shutdown
  - Implemented server/cli/reconcile.ts — CLI runner for reconciliation checks
  - Added RetryRequested to queued report state machine transitions
  - Added 11 Vitest tests: queue CRUD (5), report analyzer (2), reconciler (4 including idempotency)
  - All 94 tests passing (11 new + 83 existing)
- 2026-02-21: Milestone 4 — Assistant Gating:
  - Extracted assistant logic into server/assistant/assistantService.ts (core gating) and server/assistant/assistantRoutes.ts (thin router)
  - Propose stores provenance metadata (confidence, rationale) in projection
  - Approve + execute is transactional: validates proposed state, runs all proposed commands, emits AssistantActionExecuted with correlation IDs
  - Reject prevents subsequent approval (state machine enforced)
  - Added GET /v2/assistant/actions/:id and GET /v2/assistant/actions?homeId= for traceability/audit
  - Added 9 Vitest tests: execution guard (double-approve, reject-then-approve), provenance storage, event trail with correlation IDs, GET endpoints, full lifecycle
  - All 83 tests passing (9 new + 74 existing)
- 2026-02-21: Milestone 3 — State-Machine Guards:
  - Created server/domain/stateMachine.ts with transition maps for Task, InspectionReport, Finding, and AssistantAction aggregates
  - validateTransition() and TransitionError enforce valid lifecycle transitions at write time
  - Wired guardedAppendAndApply() into all stateful v2 mutation endpoints (tasks, reports, findings, assistant actions)
  - Updated handleError to return structured 409 responses with currentState, eventType, aggregateType
  - Added 16 Vitest tests (10 unit + 6 DB integration) covering valid/invalid transitions
  - Updated existing command-pipeline test to respect state machine (approved → started → completed)
- 2026-02-21: Milestone 2 — Command + Projection Pipeline:
  - Created server/eventing/types.ts with full event type catalog and Zod schemas
  - Created server/eventing/eventStore.ts with append(), readStream(), readFromSeq(), getCurrentVersion()
  - Created server/eventing/idempotency.ts middleware requiring Idempotency-Key on mutations
  - Created server/eventing/commandBus.ts with transactional command dispatch
  - Created server/projections/applyEvent.ts with projection reducers for all aggregate types
  - Created server/projections/rebuild.ts with full replay capability
  - Created server/routes_v2.ts with /v2 endpoints (homes, systems, reports, findings, tasks, notifications, chat, assistant)
  - Added 12 Vitest tests for idempotency, optimistic concurrency, assistant gating, and projection sync
  - Updated rebuildProjections.ts CLI to use the rebuild module
- 2026-02-21: Milestone 1 — Event Log Foundation:
  - Created event_log table with envelope fields, idempotency + concurrency unique constraints
  - Created 10 projection tables (home, system, report, finding, task, notification_pref, assistant_action, chat_session, chat_message, checkpoint)
  - Created job_queue table for background processing
  - Added SQL immutability trigger preventing UPDATE/DELETE on event_log
  - Added 10 Vitest DB-backed tests validating all constraints
  - Added CLI placeholders (backfill, rebuildProjections, reconcile, worker)
- 2026-02-21: GA4 event tracking across all pages and navigation
- 2026-02-21: Authentication overhaul:
  - Replaced Replit Auth (OIDC) with social login via Passport.js (Google, Facebook, Instagram)
  - Added provider and providerId fields to users table
  - Updated all API routes from req.user.claims.sub to req.user.id
  - New login page with social provider buttons (Google, Facebook, Instagram)
  - Cleaned up landing page: single sign-in button, removed duplicate CTAs
  - Replaced Home icon with half-house-half-gear logo
  - Expanded Terms & Conditions page with comprehensive legal sections
  - Terms page accessible to unauthenticated users
  - Added /api/auth/providers endpoint for dynamic provider availability
- 2026-01-07: Corrective and capability hardening pass:
  - Fixed AddSystemWizard form state isolation bug (form resets on dialog open)
  - Added success step 4 with checkmark, "Done" and "Add Another System" buttons
  - Extended schema with Asset vs Service distinction (entityType, contractStartDate, cadence fields)
  - Extended schema with recurring task support (isRecurring, recurrenceCadence, parentTaskId, assignedContractorId, fundId, completedAt)
  - Added purpose field to funds (shown first in UI) with optional asset scoping (scopedSystemId)
  - Created EditFundDialog for post-creation fund editing
  - Created Profile page with user info and moved notification settings from Dashboard
  - Improved chat: expanding Textarea input, rich text rendering for assistant messages (bold, italics, headings, lists)
  - Cleaned up Contact page: removed email support and response time cards
- 2026-01-04: Updated AI system prompt with comprehensive operating instructions covering response structure, safety escalation, tone guidelines, budget handling, provider research rules, and photo analysis
- 2026-01-04: Added photo upload to chat with Vision API, consent modal, Terms page, and high-risk topic filtering
- 2026-01-04: Added onboarding tour for new users with tooltips, spotlight highlights, and guided steps through key features (home status, quick stats, maintenance plan, budget, inspections, assistant)
- 2026-01-04: Major UX overhaul implementing comprehensive audit findings
- 2026-01-04: Added PWA manifest, service worker, app icons, and Play Store submission guide
- 2026-01-04: Added AI chat with streaming, environment validation, email notifications, authorization tests, fixed nested anchor tag hydration errors

## Architecture

### Authentication
- Social login via Passport.js (Google OAuth 2.0, Facebook Login)
- Instagram login routes through Facebook/Meta OAuth
- Session-based auth with PostgreSQL session store (connect-pg-simple)
- Auth files: `server/replit_integrations/auth/`

### Database Tables
- users (social auth with provider/providerId)
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
- `server/storage.ts` - Database operations with authorization helpers
- `server/lib/logger.ts` - Structured logging with pino
- `server/lib/ai-chat.ts` - AI chat with streaming responses
- `server/lib/env-validation.ts` - Environment validation at startup
- `server/lib/email.ts` - Email notifications with Resend
- `client/src/pages/` - React pages (Dashboard, Budget, Chat, Contact)

## Environment Variables

### Required
- DATABASE_URL - PostgreSQL connection (auto-provided)

### Social Login (required for auth)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET - Google OAuth login
- FACEBOOK_APP_ID, FACEBOOK_APP_SECRET - Facebook/Instagram login

### Optional (features disabled if not set)
- AI_INTEGRATIONS_OPENAI_API_KEY - AI chat (auto-provided by Replit)
- VITE_GOOGLE_PLACES_API_KEY - Address autocomplete
- USPS_CLIENT_ID, USPS_CLIENT_SECRET - Address verification
- RESEND_API_KEY - Email notifications

## User Preferences
- Design: "Modern Utility" aesthetic with construction orange (#f97316)
- Typography: Plus Jakarta Sans (headings), Inter (UI)
- UX: Emotional design, no-shame budgeting approach, anxiety-aware
- Style: Minimalist, no cards, split-hero layouts, pill-style components
- Tone: Calm professional, not "friendly startup" - empathetic but grounded
- AI Messaging: Always include disclaimers that estimates are ranges, user is in control
- Provider Integration: Angi for contractor research, opt-in only, never pushy

## Running Tests
```bash
npx vitest run
```

## Database Commands
```bash
npm run db:push   # Push schema changes to database
```
