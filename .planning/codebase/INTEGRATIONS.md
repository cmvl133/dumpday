# External Integrations

**Analysis Date:** 2026-01-20

## APIs & External Services

**AI/ML:**
- OpenAI GPT-4o-mini - Brain dump analysis and schedule optimization
  - SDK/Client: `symfony/http-client` (direct HTTP)
  - Auth: `OPENAI_API_KEY` env var
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Implementation: `backend/src/Service/BrainDumpAnalyzer.php`, `backend/src/Service/PlanningScheduleGenerator.php`
  - Uses JSON response format with temperature 0.3
  - Prompts stored as Twig templates: `backend/templates/prompts/`

**OpenAI Usage Locations:**
| Service | Purpose | Prompt Template |
|---------|---------|-----------------|
| `BrainDumpAnalyzer` | Parse raw text into tasks/events/notes/journal | `brain_dump_analysis_{en,pl}.twig` |
| `PlanningScheduleGenerator::generate()` | Optimize task scheduling around events | `schedule_optimization_{en,pl}.twig` |
| `PlanningScheduleGenerator::generateRebuild()` | Rebuild schedule with work-end constraint | `schedule_rebuild_{en,pl}.twig` |

## Data Storage

**Primary Database:**
- PostgreSQL 16
  - Connection: `DATABASE_URL` env var
  - Format: `postgresql://app:app@postgres:5432/app?serverVersion=16&charset=utf8`
  - Client: Doctrine ORM 3.3
  - Config: `backend/config/packages/doctrine.yaml`
  - Migrations: `backend/migrations/`

**Entities:**
- `User` - User accounts with email, language preference
- `DailyNote` - Daily planning container
- `Task` - Tasks with categories, scheduling, recurring support
- `Event` - Calendar events with time slots
- `JournalEntry` - Daily journal entries
- `Note` - Persistent notes with rich text
- `Tag` - Task tagging system
- `RecurringTask` - Recurring task templates
- `CheckIn` - Daily check-in history
- `LoginCode` - Email authentication codes

**File Storage:**
- Local filesystem only (`var/share/` directory)
- No cloud storage integration

**Caching:**
- Doctrine query/result cache (production only)
- Framework cache pool (`backend/config/packages/cache.yaml`)

## Authentication & Identity

**Auth Provider:**
- Custom email-based passwordless authentication
  - Implementation: `backend/src/Controller/AuthController.php`, `backend/src/Facade/AuthFacade.php`
  - Flow: Request code by email -> Verify 6-digit code -> Session-based auth
  - Session storage: Symfony sessions with `PHPSESSID` cookie
  - Authenticator: `backend/src/Security/SessionAuthenticator.php`

**User Whitelist:**
- `ALLOWED_USERS` env var (comma-separated emails)
- Implementation: `backend/src/Service/UserService.php`

**Security Config:**
- `backend/config/packages/security.yaml`
- Public endpoints: `/api/auth/*`, `/api/health`
- Protected endpoints: All other `/api/*` routes require `ROLE_USER`

## Email

**Mail Provider:**
- Configurable via `MAILER_DSN` env var
  - Development: Mailpit (SMTP localhost:1025, UI at localhost:8125)
  - Production: Any SMTP server

**Email Service:**
- `backend/src/Service/AuthMailerService.php`
- Templates: `backend/templates/emails/login_code.{html,txt}.twig`
- From address: `MAIL_FROM` env var (default: noreply@dopaminder.app)
- Supported emails: Login codes only (currently)

## Monitoring & Observability

**Error Tracking:**
- None (relies on Symfony error handling)

**Logs:**
- Symfony monolog (default config)
- Docker container logs (`docker compose logs`)

**Health Check:**
- Endpoint: `GET /api/health`
- Implementation: `backend/src/Controller/HealthController.php`

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment
- No specific cloud platform configured

**CI Pipeline:**
- None configured (no `.github/workflows/` detected)

## Frontend-Backend Communication

**API Architecture:**
- RESTful JSON API
- Base URL: `/api` (proxied via Vite in dev, nginx in prod)
- Credentials: `include` (session cookies)

**API Client:**
- `frontend/src/lib/api.ts` - Typed fetch wrapper
- All endpoints use `credentials: 'include'` for session auth

**Key API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-code` | POST | Request login code |
| `/api/auth/verify-code` | POST | Verify code and login |
| `/api/auth/me` | GET | Get current user |
| `/api/brain-dump/analyze` | POST | AI analysis of raw text |
| `/api/daily-note/{date}` | GET | Get day's data |
| `/api/daily-note` | POST | Save day's data |
| `/api/task` | POST | Create task |
| `/api/task/{id}` | PATCH/DELETE | Update/delete task |
| `/api/task/{id}/split` | POST | Split task into subtasks |
| `/api/event` | POST | Create event |
| `/api/planning/generate` | POST | AI schedule generation |
| `/api/rebuild` | POST | AI schedule rebuild |
| `/api/recurring` | GET/POST | List/create recurring tasks |
| `/api/recurring/sync` | POST | Sync recurring tasks |
| `/api/settings` | GET/PATCH | User settings |

## Environment Configuration

**Required env vars (Production):**
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API access
- `ALLOWED_USERS` - Email whitelist
- `MAILER_DSN` - SMTP configuration
- `APP_SECRET` - Symfony secret key

**Optional env vars:**
- `MAIL_FROM` - Sender email (default: noreply@dopaminder.app)
- `APP_ENV` - Environment (dev/prod)

**Secrets location:**
- Backend: `backend/.env` (not committed), `backend/.env.local` (overrides)
- No secrets management service (e.g., Vault, AWS Secrets Manager)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Internationalization

**Frontend:**
- i18next with browser language detection
- Supported languages: English (en), Polish (pl)
- Translations: `frontend/src/i18n/locales/{en,pl}.json`
- Detection order: localStorage, navigator

**Backend:**
- Language-aware AI prompts (en/pl variants)
- User language preference stored in database
- Day-of-week localization in services

---

*Integration audit: 2026-01-20*
