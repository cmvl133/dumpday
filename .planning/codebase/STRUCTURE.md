# Codebase Structure

**Analysis Date:** 2026-01-20

## Directory Layout

```
dumpday/
├── backend/                    # Symfony PHP backend
│   ├── config/                 # Symfony configuration
│   │   ├── packages/           # Bundle configs
│   │   ├── routes/             # Route configs
│   │   ├── routes.yaml         # Main routing
│   │   └── services.yaml       # DI container config
│   ├── migrations/             # Doctrine migrations
│   ├── src/                    # PHP source code
│   │   ├── Command/            # CLI commands
│   │   ├── Controller/         # REST API controllers
│   │   ├── Entity/             # Doctrine entities
│   │   ├── Enum/               # PHP enums
│   │   ├── Facade/             # Orchestration facades
│   │   ├── Repository/         # Doctrine repositories
│   │   ├── Security/           # Auth components
│   │   ├── Service/            # Business logic services
│   │   └── Kernel.php          # Symfony kernel
│   ├── templates/              # Twig templates
│   │   ├── emails/             # Email templates
│   │   └── prompts/            # AI prompt templates
│   ├── tests/                  # PHPUnit tests
│   └── var/                    # Cache, logs (gitignored)
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components by feature
│   │   ├── hooks/              # Custom React hooks
│   │   ├── i18n/               # Internationalization
│   │   │   └── locales/        # Translation JSON files
│   │   ├── lib/                # Utilities and API client
│   │   ├── store/              # Redux slices
│   │   ├── types/              # TypeScript types
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Tailwind base styles
│   └── vite.config.ts          # Vite build config
├── docker/                     # Docker configs
│   ├── nginx/                  # Nginx config
│   ├── node/                   # Node Dockerfile
│   ├── php/                    # PHP-FPM Dockerfile
│   └── postgres/               # Postgres config
├── notes/                      # Version release notes
│   └── v0.0.X/                 # Per-version notes
├── .planning/                  # GSD planning docs
│   └── codebase/               # Architecture docs
├── docker-compose.yml          # Container orchestration
├── Makefile                    # Dev commands
├── CLAUDE.md                   # AI assistant instructions
└── README.md                   # Project readme
```

## Directory Purposes

**`backend/src/Controller/`:**
- Purpose: REST API endpoints
- Contains: 17 controller classes
- Key files:
  - `TaskController.php`: CRUD for tasks
  - `DailyNoteController.php`: Get/save daily notes
  - `BrainDumpController.php`: AI analysis endpoint
  - `AuthController.php`: Login code flow
  - `PlanningController.php`: Schedule generation
  - `RecurringController.php`: Recurring task management
  - `CheckInController.php`: Daily check-in flow
  - `TagController.php`: Tag management

**`backend/src/Entity/`:**
- Purpose: Domain model + database schema
- Contains: 11 entity classes
- Key files:
  - `DailyNote.php`: Central aggregate (user+date unique)
  - `Task.php`: Task with categories, subtasks, tags
  - `Event.php`: Calendar events
  - `User.php`: User account
  - `RecurringTask.php`: Recurring task templates
  - `Tag.php`: User-defined task tags
  - `CheckIn.php`: Daily check-in records

**`backend/src/Service/`:**
- Purpose: Business logic and integrations
- Contains: 14 service classes
- Key files:
  - `BrainDumpAnalyzer.php`: OpenAI brain dump analysis
  - `PlanningScheduleGenerator.php`: AI schedule optimization
  - `ScheduleBuilder.php`: Build schedule from events
  - `TaskSplitService.php`: Split tasks into subtasks
  - `RecurringSyncService.php`: Generate recurring instances
  - `*Extractor.php`: Extract entities from AI response

**`backend/src/Facade/`:**
- Purpose: Complex operation orchestration
- Contains: 2 facade classes
- Key files:
  - `BrainDumpFacade.php`: Analyze + save flow
  - `AuthFacade.php`: Auth flow orchestration

**`backend/src/Repository/`:**
- Purpose: Database queries
- Contains: 11 repository classes
- Key files:
  - `TaskRepository.php`: Task queries (overdue, by date, etc.)
  - `DailyNoteRepository.php`: Find by user+date

**`frontend/src/components/`:**
- Purpose: React UI components organized by feature
- Contains: 14 feature directories + ui/
- Key directories:
  - `analysis/`: Task list, notes, journal display
  - `brain-dump/`: Brain dump input
  - `schedule/`: Day schedule visualization
  - `planning/`: Planning mode flow
  - `how-are-you/`: Modal flows (planning, check-in, rebuild)
  - `check-in/`: Check-in UI
  - `tasks/`: Task-related components
  - `tags/`: Tag management
  - `auth/`: Login page
  - `layout/`: Header, day switcher
  - `ui/`: shadcn/ui base components

**`frontend/src/store/`:**
- Purpose: Redux state management
- Contains: 10 slice files + index + hooks
- Key files:
  - `dailyNoteSlice.ts`: Core daily note state + CRUD
  - `planningSlice.ts`: Planning mode state
  - `authSlice.ts`: Auth state
  - `settingsSlice.ts`: User settings
  - `tagSlice.ts`: Tags state
  - `index.ts`: Store configuration
  - `hooks.ts`: Typed dispatch/selector hooks

**`frontend/src/lib/`:**
- Purpose: Utilities and API client
- Contains: API client, utils, tone messages
- Key files:
  - `api.ts`: Full API client with typed methods
  - `utils.ts`: Utility functions (cn, schedule calculations)

**`frontend/src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Shared types
- Key files:
  - `index.ts`: All domain types (Task, Event, DailyNote, etc.)

**`backend/templates/prompts/`:**
- Purpose: AI prompt templates
- Contains: Twig templates for OpenAI
- Key files:
  - `brain_dump_analysis_en.twig`: English analysis prompt
  - `brain_dump_analysis_pl.twig`: Polish analysis prompt
  - `schedule_optimization_*.twig`: Schedule generation prompts

## Key File Locations

**Entry Points:**
- `frontend/src/main.tsx`: React app entry
- `frontend/src/App.tsx`: Root component
- `backend/public/index.php`: PHP entry (implicit)
- `backend/src/Kernel.php`: Symfony kernel

**Configuration:**
- `backend/config/services.yaml`: DI container
- `backend/config/routes.yaml`: Route loading
- `backend/.env`: Environment vars
- `frontend/vite.config.ts`: Vite build
- `docker-compose.yml`: Container setup

**Core Logic:**
- `frontend/src/store/dailyNoteSlice.ts`: Main state slice
- `frontend/src/lib/api.ts`: API client
- `backend/src/Facade/BrainDumpFacade.php`: Brain dump orchestration
- `backend/src/Service/BrainDumpAnalyzer.php`: AI analysis

**Testing:**
- `backend/tests/`: PHPUnit tests (minimal)
- Frontend: No test files detected

## Naming Conventions

**Files:**
- Backend PHP: PascalCase (`TaskController.php`, `DailyNote.php`)
- Frontend TS/TSX: PascalCase for components (`BrainDumpInput.tsx`), camelCase for utilities (`api.ts`)
- Redux slices: camelCase with `Slice` suffix (`dailyNoteSlice.ts`)
- Types: camelCase (`index.ts`)

**Directories:**
- Backend: PascalCase (`Controller/`, `Entity/`, `Service/`)
- Frontend: kebab-case for features (`brain-dump/`, `how-are-you/`)
- Frontend lib: lowercase (`lib/`, `hooks/`, `store/`)

**Code Conventions:**
- Backend: PSR-12, strict types, PHP 8 attributes
- Frontend: TypeScript strict, functional components, named exports

## Where to Add New Code

**New API Endpoint:**
- Controller: `backend/src/Controller/{Feature}Controller.php`
- Entity (if needed): `backend/src/Entity/{Entity}.php`
- Repository: `backend/src/Repository/{Entity}Repository.php`
- Run: `php bin/console make:migration` for schema changes

**New Frontend Feature:**
- Components: `frontend/src/components/{feature-name}/`
- Redux slice: `frontend/src/store/{feature}Slice.ts`
- Add slice to `frontend/src/store/index.ts`
- Types: `frontend/src/types/index.ts`
- API methods: `frontend/src/lib/api.ts`

**New UI Component:**
- If reusable primitive: `frontend/src/components/ui/`
- Use shadcn/ui patterns

**New Business Logic:**
- Service: `backend/src/Service/{Feature}Service.php`
- For complex orchestration: `backend/src/Facade/{Feature}Facade.php`

**New AI Prompt:**
- Template: `backend/templates/prompts/{feature}_{lang}.twig`
- Languages: create both `_en.twig` and `_pl.twig`

**New Translation:**
- English: `frontend/src/i18n/locales/en.json`
- Polish: `frontend/src/i18n/locales/pl.json`

**New Database Migration:**
- Run: `php bin/console make:migration`
- Location: `backend/migrations/Version*.php`

## Special Directories

**`backend/var/`:**
- Purpose: Cache and logs
- Generated: Yes
- Committed: No (gitignored)

**`frontend/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No (Docker volume)

**`backend/vendor/`:**
- Purpose: Composer dependencies
- Generated: Yes
- Committed: No (gitignored)

**`notes/`:**
- Purpose: Version release documentation
- Generated: No (manually written)
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning and architecture docs
- Generated: By GSD tools
- Committed: Varies (usually yes)

---

*Structure analysis: 2026-01-20*
