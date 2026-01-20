# Coding Conventions

**Analysis Date:** 2026-01-20

## Naming Patterns

**Files:**
- **Frontend Components:** PascalCase with `.tsx` extension: `TaskItem.tsx`, `BrainDumpInput.tsx`, `ScheduleExpandedModal.tsx`
- **Frontend Hooks:** camelCase with `use` prefix: `useAutoModal.ts`, `useReminders.ts`, `useTagFilter.ts`
- **Frontend Stores:** camelCase with `Slice` suffix: `dailyNoteSlice.ts`, `authSlice.ts`, `settingsSlice.ts`
- **Frontend Types:** Single `index.ts` in `types/` directory
- **Backend Controllers:** PascalCase with `Controller` suffix: `TaskController.php`, `AuthController.php`
- **Backend Entities:** PascalCase singular: `Task.php`, `User.php`, `DailyNote.php`
- **Backend Repositories:** PascalCase with `Repository` suffix: `TaskRepository.php`, `UserRepository.php`
- **Backend Services:** PascalCase with `Service` suffix: `BrainDumpAnalyzer.php`, `RecurringSyncService.php`
- **Backend Facades:** PascalCase with `Facade` suffix: `BrainDumpFacade.php`, `AuthFacade.php`

**Functions:**
- **Frontend:** camelCase for all functions and handlers: `handleToggle`, `handleDelete`, `fetchDailyNote`
- **Frontend Event Handlers:** `handle` prefix: `handleToggleTask`, `handleUpdateEvent`, `handleKeyDown`
- **Backend:** camelCase for methods: `analyze()`, `saveAnalysis()`, `getDailyNoteData()`
- **Backend Private Methods:** camelCase with descriptive names: `serializeTask()`, `timesOverlap()`, `normalizeResponse()`

**Variables:**
- **Frontend:** camelCase: `isLoading`, `currentDate`, `dailyNote`, `analysisPreview`
- **Frontend State:** Descriptive boolean prefixes: `isEditing`, `isCompleted`, `isPreview`, `hasSubtasks`
- **Backend:** camelCase for local variables: `$dailyNote`, `$existingTaskTitles`, `$scheduledTaskIds`

**Types/Interfaces:**
- **Frontend:** PascalCase, no `I` prefix: `Task`, `DailyNoteData`, `AnalysisResponse`, `Settings`
- **Frontend Props:** `{ComponentName}Props`: `TaskItemProps`, `ButtonProps`
- **Backend Enums:** PascalCase: `TaskCategory`, `RecurrenceType`

**Constants:**
- **Frontend:** SCREAMING_SNAKE_CASE: `SCHEDULE_START_HOUR`, `TOTAL_HOURS`, `INTERVAL_MS`
- **Frontend Consts in module:** camelCase: `buttonVariants`, `getConfettiConfig`

## Code Style

**Formatting (Frontend):**
- Tool: Prettier v3.4.2
- Config: `/home/kamil/Code/dumpday/frontend/.prettierrc`
- Key settings:
  - Semi: `true`
  - Single quotes: `true`
  - Tab width: `2`
  - Trailing comma: `es5`
  - Print width: `80`

**Linting (Frontend):**
- Tool: ESLint v9 with typescript-eslint
- Config: `/home/kamil/Code/dumpday/frontend/eslint.config.js`
- Key rules:
  - React hooks rules (recommended)
  - React refresh: warn on non-component exports
  - Prettier integration via eslint-config-prettier

**Formatting (Backend):**
- Tool: Easy Coding Standard (ECS) v12
- Config: `/home/kamil/Code/dumpday/backend/ecs.php`
- Key rules:
  - PSR-12 compliance
  - `declare(strict_types=1)` required at top of every file
  - No unused imports
  - Arrays, namespaces, spaces, docblocks, comments sets enabled

## Import Organization

**Frontend Order:**
1. React imports first: `import { useState, useEffect } from 'react'`
2. Third-party libraries: `import { useTranslation } from 'react-i18next'`
3. Internal absolute imports using `@/` alias: `import { api } from '@/lib/api'`
4. Type imports: `import type { Task, DailyNoteData } from '@/types'`

**Path Aliases (Frontend):**
- `@/*` maps to `./src/*` (configured in `/home/kamil/Code/dumpday/frontend/tsconfig.json`)

**Backend Order:**
1. PHP declare statement: `declare(strict_types=1);`
2. Namespace declaration: `namespace App\Controller;`
3. External use statements (Symfony, Doctrine)
4. Internal use statements (App namespace)

## Error Handling

**Frontend Patterns:**
- API errors caught with try/catch, parsed from response JSON:
```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.error || 'Failed to fetch');
}
```
- Redux thunks use `rejectWithValue` for error handling:
```typescript
} catch (error) {
  return rejectWithValue(
    error instanceof Error ? error.message : 'Failed to save'
  );
}
```
- Error state in Redux slices: `error: string | null`
- UI error display with styled error messages:
```tsx
{error && (
  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
    {error}
  </div>
)}
```

**Backend Patterns:**
- Return JSON errors with appropriate HTTP status codes:
```php
return $this->json([
    'error' => 'Task not found',
], Response::HTTP_NOT_FOUND);
```
- Throw `RuntimeException` for service-level errors:
```php
throw new \RuntimeException('Failed to analyze brain dump: ' . $e->getMessage(), 0, $e);
```
- Use null checks before operations: `if ($task === null)`, `$task->getDailyNote()?->getUser()?->getId()`

## Logging

**Framework:** Console (browser dev tools for frontend)

**Patterns:**
- No explicit logging framework in frontend
- Backend: Standard Symfony/Monolog (via framework bundle) - no custom logging observed in source
- Errors thrown and handled at controller level

## Comments

**When to Comment:**
- Complex business logic (e.g., duplicate detection in `BrainDumpFacade.php`)
- Non-obvious calculations (e.g., schedule positioning in `utils.ts`)
- Workflow explanations in longer methods

**JSDoc/TSDoc:**
- Not heavily used in frontend codebase
- Backend uses PHPDoc for:
  - Repository return types: `@return Task[]`
  - Collection generic types: `@var Collection<int, Tag>`
  - Method descriptions for complex logic

**Backend PHPDoc Example:**
```php
/**
 * Find all overdue tasks:
 * - Tasks with dueDate < today
 * - Tasks with category='today' from previous daily notes...
 *
 * @return Task[]
 */
public function findOverdueTasks(User $user, \DateTimeInterface $today): array
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract repeated logic into helper functions (e.g., `serializeTask()`, `normalizeResponse()`)
- Longer controller methods acceptable when handling full request lifecycle

**Parameters:**
- Use typed parameters in both frontend (TypeScript) and backend (PHP 8.3)
- Optional parameters use default values: `isPreview = false`, `$language = 'en'`
- Object destructuring for React component props
- Backend uses constructor property promotion:
```php
public function __construct(
    private readonly TaskRepository $taskRepository,
    private readonly EntityManagerInterface $entityManager,
) {}
```

**Return Values:**
- Frontend: Explicit return types where TypeScript infers complex types
- Backend: Typed return hints: `?DailyNote`, `array`, `JsonResponse`
- Use null for absence of data: `return null`, `?->format()` null-safe operator

## Module Design

**Frontend Exports:**
- Named exports for components: `export function TaskItem() {}`
- Named exports for hooks: `export function useAutoModal() {}`
- Default export for slice reducers: `export default dailyNoteSlice.reducer`
- Named export for actions: `export const { setCurrentDate, clearError } = dailyNoteSlice.actions`

**Barrel Files:**
- Used in `components/how-are-you/index.ts`:
```typescript
export { HowAreYouModal } from './HowAreYouModal';
```
- Not extensively used elsewhere - direct imports preferred

**Backend Structure:**
- Controllers extend `AbstractController`
- Repositories extend `ServiceEntityRepository<T>`
- Services as standalone classes with constructor injection
- Facades coordinate multiple services

## Component Patterns (Frontend)

**React Component Structure:**
```typescript
interface ComponentProps {
  // Props interface first
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // 2. State
  const [isOpen, setIsOpen] = useState(false);

  // 3. Effects
  useEffect(() => { ... }, [deps]);

  // 4. Handlers
  const handleClick = () => { ... };

  // 5. Render
  return <div>...</div>;
}
```

**Styling:**
- Tailwind CSS utility classes
- `cn()` utility for conditional class merging (clsx + tailwind-merge)
- class-variance-authority (cva) for component variants (see `button.tsx`)

## Redux Patterns (Frontend)

**Slice Structure:**
```typescript
// 1. Interface for state
interface SliceState { ... }

// 2. Initial state
const initialState: SliceState = { ... };

// 3. Async thunks
export const fetchData = createAsyncThunk('slice/fetch', async () => { ... });

// 4. Slice with reducers
const slice = createSlice({
  name: 'sliceName',
  initialState,
  reducers: { /* sync actions */ },
  extraReducers: (builder) => { /* async action handlers */ }
});

// 5. Export actions and reducer
export const { action1, action2 } = slice.actions;
export default slice.reducer;
```

**Typed Hooks:**
- Use `useAppDispatch` and `useAppSelector` from `/home/kamil/Code/dumpday/frontend/src/store/hooks.ts`
- Never use raw `useDispatch`/`useSelector`

## Entity Patterns (Backend)

**Doctrine Entity Structure:**
```php
#[ORM\Entity(repositoryClass: TaskRepository::class)]
#[ORM\Table(name: 'tasks')]
class Task
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Relations with cascade and orphan removal
    #[ORM\ManyToOne(targetEntity: DailyNote::class, inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?DailyNote $dailyNote = null;

    // Fluent setters
    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }
}
```

## API Patterns (Backend)

**Controller Structure:**
```php
#[Route('/api/resource')]
class ResourceController extends AbstractController
{
    public function __construct(
        private readonly Repository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    #[Route('', name: 'resource_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (empty($data['field'])) {
            return $this->json(['error' => 'Field required'], Response::HTTP_BAD_REQUEST);
        }

        // Authorization
        if ($entity->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        // Business logic + persist
        $this->entityManager->persist($entity);
        $this->entityManager->flush();

        return $this->json($data, Response::HTTP_CREATED);
    }
}
```

---

*Convention analysis: 2026-01-20*
