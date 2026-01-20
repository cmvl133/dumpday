# Architecture

**Analysis Date:** 2026-01-20

## Pattern Overview

**Overall:** Layered Monolith with SPA Frontend

**Key Characteristics:**
- Symfony backend as REST API server with Doctrine ORM
- React SPA frontend with Redux Toolkit for state management
- AI-powered analysis layer using OpenAI GPT-4o-mini
- Multi-container Docker deployment (nginx, php-fpm, node, postgres)
- DailyNote as central aggregate root organizing user's daily content

## Layers

**Frontend - Presentation Layer:**
- Purpose: React SPA handling user interactions and rendering
- Location: `frontend/src/`
- Contains: React components, Redux slices, hooks, types
- Depends on: Backend API via `frontend/src/lib/api.ts`
- Used by: Browser clients

**Frontend - State Layer:**
- Purpose: Centralized state management with Redux Toolkit
- Location: `frontend/src/store/`
- Contains: Redux slices for domain entities (dailyNote, auth, planning, tags, etc.)
- Depends on: API client, types
- Used by: React components via hooks

**Backend - Controller Layer:**
- Purpose: HTTP request handling, routing, JSON responses
- Location: `backend/src/Controller/`
- Contains: REST API endpoints with Symfony routing attributes
- Depends on: Facades, Services, Repositories, Entities
- Used by: Frontend API calls

**Backend - Facade Layer:**
- Purpose: Orchestration of complex multi-service operations
- Location: `backend/src/Facade/`
- Contains: `AuthFacade`, `BrainDumpFacade`
- Depends on: Services, Repositories, EntityManager
- Used by: Controllers

**Backend - Service Layer:**
- Purpose: Business logic, AI integration, domain operations
- Location: `backend/src/Service/`
- Contains: `BrainDumpAnalyzer`, `ScheduleBuilder`, `TaskSplitService`, extractors
- Depends on: External APIs (OpenAI), Twig templates, Repositories
- Used by: Facades, Controllers

**Backend - Repository Layer:**
- Purpose: Database queries and entity persistence
- Location: `backend/src/Repository/`
- Contains: Doctrine repositories for each entity
- Depends on: Doctrine ORM, Entities
- Used by: Services, Facades, Controllers

**Backend - Entity Layer:**
- Purpose: Domain model and database schema
- Location: `backend/src/Entity/`
- Contains: `User`, `DailyNote`, `Task`, `Event`, `Note`, `JournalEntry`, `Tag`, `RecurringTask`, `CheckIn`, `LoginCode`
- Depends on: Doctrine annotations/attributes
- Used by: All backend layers

## Data Flow

**Brain Dump Flow (Core Feature):**

1. User types raw text in `BrainDumpInput.tsx`
2. Auto-debounce triggers `analyzeBrainDump` thunk after 2.5s
3. Frontend calls `POST /api/brain-dump/analyze`
4. `BrainDumpController` delegates to `BrainDumpFacade.analyze()`
5. `BrainDumpAnalyzer` sends prompt to OpenAI API
6. AI returns structured JSON: tasks, events, notes, journal
7. Response shown as preview in `AnalysisResults.tsx`
8. User confirms, triggering `saveDailyNote` thunk
9. `BrainDumpFacade.saveAnalysis()` persists with deduplication
10. `DailyNote` aggregate with related entities saved via Doctrine

**State Management:**
- Redux store at `frontend/src/store/index.ts`
- Slices: `dailyNote`, `auth`, `planning`, `checkIn`, `settings`, `howAreYou`, `recurring`, `tags`, `health`
- Async operations via `createAsyncThunk`
- Typed hooks: `useAppDispatch`, `useAppSelector` from `frontend/src/store/hooks.ts`

**Authentication Flow:**
1. User requests login code via email (`AuthController.requestCode`)
2. `AuthCodeService` generates 6-digit code, `AuthMailerService` sends email
3. User enters code, `AuthController.verifyCode` validates
4. Session created via Symfony security
5. Frontend `authSlice` tracks `isAuthenticated`, `user`

## Key Abstractions

**DailyNote (Aggregate Root):**
- Purpose: Central container for a user's daily content
- Examples: `backend/src/Entity/DailyNote.php`
- Pattern: Owns Tasks, Events, Notes, JournalEntries via OneToMany
- Unique constraint: one DailyNote per user per date

**Task (Rich Entity):**
- Purpose: Action item with multiple states and features
- Examples: `backend/src/Entity/Task.php`
- Pattern: Supports categories (today/scheduled/someday), recurring links, subtasks, tags

**Redux Slice:**
- Purpose: Domain-specific state + async thunks
- Examples: `frontend/src/store/dailyNoteSlice.ts`, `frontend/src/store/planningSlice.ts`
- Pattern: `createSlice` + `createAsyncThunk` with typed state

**API Client:**
- Purpose: Type-safe HTTP client for all backend endpoints
- Examples: `frontend/src/lib/api.ts`
- Pattern: Namespaced object with methods per resource (api.task.create, api.auth.me, etc.)

## Entry Points

**Frontend Entry:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser loads React app
- Responsibilities: Mount React, provide Redux store, initialize i18n

**Frontend App Root:**
- Location: `frontend/src/App.tsx`
- Triggers: After mount
- Responsibilities: Auth check, data fetching, main layout, routing between LoginPage and main app

**Backend Entry:**
- Location: `backend/public/index.php` (via nginx)
- Triggers: HTTP requests to `/api/*`
- Responsibilities: Bootstrap Symfony, route to controllers

**Backend Kernel:**
- Location: `backend/src/Kernel.php`
- Triggers: Request handling
- Responsibilities: Load bundles, configure container

## Error Handling

**Strategy:** Try-catch with error propagation to UI

**Frontend Patterns:**
- Async thunks catch errors, store in slice state (`error` field)
- `App.tsx` displays error banner from `dailyNote.error`
- API client throws on non-OK responses with parsed error message

**Backend Patterns:**
- Controllers return JSON error responses with HTTP status codes
- Services throw `RuntimeException` for integration failures
- Doctrine handles database errors

## Cross-Cutting Concerns

**Logging:** Console-based (browser console, Symfony logs)

**Validation:**
- Backend: Manual validation in controllers, Doctrine constraints
- Frontend: Form-level validation, required fields

**Authentication:**
- Symfony session-based auth via `#[CurrentUser]` attribute
- Frontend stores auth state in Redux, checks on app load

**Internationalization:**
- Frontend: react-i18next with en/pl locales at `frontend/src/i18n/locales/`
- Backend: AI prompts in en/pl at `backend/templates/prompts/`

**AI Integration:**
- Twig templates for prompts at `backend/templates/prompts/`
- Services: `BrainDumpAnalyzer`, `PlanningScheduleGenerator`
- JSON response format enforced via OpenAI API

---

*Architecture analysis: 2026-01-20*
