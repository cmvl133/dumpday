# Codebase Concerns

**Analysis Date:** 2026-01-20

## Tech Debt

**No Unit Tests:**
- Issue: Project has zero unit/integration tests (only `backend/tests/bootstrap.php` exists which is Symfony boilerplate)
- Files: `backend/tests/` (empty), no `frontend/src/**/*.test.{ts,tsx}` files
- Impact: Regressions go undetected, refactoring is risky, no confidence in code correctness
- Fix approach: Add PHPUnit tests for services (BrainDumpAnalyzer, RecurringSyncService, TaskExtractor) and Vitest tests for Redux slices and critical components

**Duplicated Recurrence Pattern Logic:**
- Issue: `matchesRecurrencePattern` is implemented identically in two places
- Files: `backend/src/Controller/TaskController.php:348-362`, `backend/src/Service/RecurringSyncService.php:85-98`
- Impact: Bug fixes need to be applied twice, risk of divergence
- Fix approach: Extract to a shared trait or utility class, or move logic entirely to RecurringSyncService and have TaskController call it

**Large Frontend Files:**
- Issue: Several slice/component files exceed 400-500 lines, making them hard to maintain
- Files:
  - `frontend/src/lib/api.ts` (739 lines) - monolithic API client
  - `frontend/src/store/howAreYouSlice.ts` (578 lines) - complex modal state
  - `frontend/src/store/dailyNoteSlice.ts` (565 lines) - many async thunks
  - `frontend/src/components/schedule/ScheduleExpandedModal.tsx` (477 lines)
- Impact: Hard to navigate, test, and maintain; high cognitive load
- Fix approach: Split api.ts by domain (auth.api.ts, task.api.ts, etc.), extract sub-slices for check-in/planning/rebuild, break components into smaller units

**Inconsistent Category Handling:**
- Issue: Task categories are handled as both const arrays and hardcoded values in different places
- Files: `frontend/src/store/dailyNoteSlice.ts:269,283,297,363,378,394,408,539` uses `['today', 'scheduled', 'someday']` while line 539 adds `'overdue'`
- Impact: If a new category is added, multiple places need updating
- Fix approach: Create a single source of truth for task categories array

## Known Bugs

**Dev-only Recurring Sync:**
- Symptoms: Recurring tasks only auto-sync in development mode, not production
- Files: `frontend/src/store/dailyNoteSlice.ts:40-46`
- Trigger: The sync call is wrapped in `if (import.meta.env.DEV)`
- Workaround: Manual call to `/api/recurring/sync` or rely on cron job
- Root cause: Likely intentional but undocumented; production should have a scheduled job

## Security Considerations

**Session-based Auth without CSRF Protection:**
- Risk: Cross-site request forgery attacks on state-changing endpoints
- Files: `backend/src/Controller/AuthController.php`, `backend/src/Security/SessionAuthenticator.php`
- Current mitigation: Session-based auth with `credentials: 'include'` in frontend
- Recommendations: Add CSRF tokens or use SameSite=Strict cookies; consider adding rate limiting on auth endpoints

**OpenAI API Key in Backend:**
- Risk: Key exposure if server is compromised; no request rate limiting
- Files: `backend/config/services.yaml:2` (`openai_api_key: '%env(OPENAI_API_KEY)%'`)
- Current mitigation: Environment variable (good), not committed to repo
- Recommendations: Add rate limiting per user on AI endpoints to prevent abuse; consider adding cost monitoring

**ALLOWED_USERS Whitelist:**
- Risk: Unclear if this is enforced consistently across all endpoints
- Files: `backend/config/services.yaml:3`
- Current mitigation: Used in AuthFacade (assumed based on naming)
- Recommendations: Ensure all authenticated endpoints verify user is in allowed list

## Performance Bottlenecks

**N+1 Query Risk in Task Serialization:**
- Problem: Task serialization accesses related entities (tags, subtasks, recurringTask) without explicit eager loading
- Files:
  - `backend/src/Facade/BrainDumpFacade.php:289-313` (serializeTask method)
  - `backend/src/Controller/TaskController.php:73-93,182-206` (response building)
- Cause: Doctrine lazy loading triggers individual queries for each task's relations
- Improvement path: Add `->leftJoin('t.tags', 'tags')->addSelect('tags')` in repository queries, or use DTOs with batch loading

**AI Requests Block User Flow:**
- Problem: Brain dump analysis and schedule generation wait synchronously for OpenAI responses
- Files:
  - `backend/src/Service/BrainDumpAnalyzer.php:36-67`
  - `backend/src/Service/PlanningScheduleGenerator.php:77-115,174-212`
- Cause: Direct HTTP calls in request lifecycle; no timeout specified
- Improvement path: Add timeouts to HTTP client config, consider async processing with job queue for non-critical AI features

**Large Redux State Updates:**
- Problem: Every task update triggers slice updates that may cause unnecessary re-renders
- Files: `frontend/src/store/dailyNoteSlice.ts` (multiple addCase handlers)
- Cause: Finding tasks across multiple category arrays on each update
- Improvement path: Normalize task state (by ID) instead of nested category arrays

## Fragile Areas

**Task Category Movement Logic:**
- Files:
  - `backend/src/Facade/BrainDumpFacade.php:162-238` (getDailyNoteData)
  - `frontend/src/store/dailyNoteSlice.ts:360-415` (task handlers)
- Why fragile: Complex logic determining which category a task belongs to (today/scheduled/someday/overdue) based on dueDate, dailyNote date, and category field
- Safe modification: Add comprehensive tests before changing; trace all paths a task can take
- Test coverage: None

**Schedule Modal Drag-and-Drop:**
- Files: `frontend/src/components/schedule/ScheduleExpandedModal.tsx:320-359`
- Why fragile: Complex coordinate calculations for positioning tasks on schedule; relies on ref measurements
- Safe modification: Test thoroughly on different screen sizes; consider extracting position logic to tested utility
- Test coverage: None

**How Are You Modal State Machine:**
- Files: `frontend/src/store/howAreYouSlice.ts` (entire file)
- Why fragile: Complex state transitions between check-in/planning/rebuild modes with 30+ actions
- Safe modification: Document state machine diagram; add tests for transition sequences
- Test coverage: None

## Scaling Limits

**Single OpenAI Model Hardcoded:**
- Current capacity: All AI features use `gpt-4o-mini`
- Limit: Cost and rate limits of single model; no fallback
- Scaling path: Add model configuration per feature, implement retry with fallback models

**localStorage for Modal State:**
- Current capacity: `lastModalAt` stored in localStorage
- Limit: Per-browser only, doesn't sync across devices
- Scaling path: Already syncing with backend via `lastCheckInAt`; localStorage is just cache

## Dependencies at Risk

**None Critical Identified:**
- All major dependencies (React 19, Symfony 7.4, shadcn/ui) are actively maintained
- OpenAI SDK is direct HTTP calls, not SDK - flexible

## Missing Critical Features

**Error Boundaries:**
- Problem: No React error boundaries; JS errors crash entire app
- Blocks: Production stability
- Files: `frontend/src/App.tsx` - no ErrorBoundary wrapper

**Offline Support:**
- Problem: App requires network; no service worker or local caching
- Blocks: Use in poor connectivity situations
- Note: May be intentional given AI dependency

**Undo/Redo:**
- Problem: Destructive actions (delete task/event) have no undo
- Blocks: User confidence in making changes
- Files: All delete handlers in `frontend/src/App.tsx`

## Test Coverage Gaps

**Backend - No Coverage:**
- What's not tested: All services, controllers, entities, repositories
- Files: `backend/src/**/*.php`
- Risk: Any refactoring could break functionality silently
- Priority: High - Start with BrainDumpAnalyzer, RecurringSyncService, TaskRepository

**Frontend - No Coverage:**
- What's not tested: All Redux slices, components, utilities
- Files: `frontend/src/**/*.{ts,tsx}`
- Risk: State management bugs, UI regressions
- Priority: High - Start with dailyNoteSlice, howAreYouSlice, api.ts

**Critical Untested Paths:**
1. Task completion triggering next recurring task generation
2. Overdue task detection and categorization
3. Schedule conflict detection in planning mode
4. Brain dump → AI analysis → entity extraction → save flow

---

*Concerns audit: 2026-01-20*
