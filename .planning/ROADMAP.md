# Roadmap: Dopaminder v2 Architecture

**Created:** 2026-01-22
**Milestone:** v2 Architecture Refactoring
**Phases:** 9-13 (continues from v1.1)

## Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 9 | Backend DTOs | Eliminate array duplication with typed DTOs | DTO-01 to DTO-07 | Complete |
| 10 | Backend Services | Extract business logic from controllers | SVC-01 to SVC-06 | Planned |
| 11 | Backend Tests | Add unit and integration tests | TST-01 to TST-05 | Pending |
| 12 | Frontend Slices | Split monolithic howAreYouSlice | SLC-01 to SLC-05 | Pending |
| 13 | Frontend Storage | Centralize localStorage handling | STR-01 to STR-05 | Pending |

## Phase Details

### Phase 9: Backend DTOs

**Goal:** Replace inline array serialization with typed DTO classes

**Plans:** 6 plans

Plans:
- [x] 09-01-PLAN.md - Create base Response DTOs (TagResponse, EventResponse, NoteResponse, JournalEntryResponse)
- [x] 09-02-PLAN.md - Create Request DTOs (TaskCreateRequest, TaskUpdateRequest)
- [x] 09-03-PLAN.md - Create TaskResponse and TimeBlockResponse DTOs
- [x] 09-04-PLAN.md - Create ScheduleItemResponse and DailyNoteResponse DTOs
- [x] 09-05-PLAN.md - Integrate Response DTOs into controllers
- [x] 09-06-PLAN.md - Integrate Request DTOs and complete BrainDumpFacade migration

**Requirements:**
- DTO-01: TaskResponse DTO (eliminates 6+ duplications)
- DTO-02: EventResponse DTO
- DTO-03: TimeBlockResponse DTO
- DTO-04: TaskCreateRequest DTO with validation
- DTO-05: TaskUpdateRequest DTO with validation
- DTO-06: ScheduleItemResponse DTO
- DTO-07: DailyNoteResponse DTO

**Success Criteria:**
1. No inline array serialization for Task, Event, TimeBlock in controllers
2. Request DTOs validate input before reaching services
3. All API responses use consistent DTO structure
4. PHPStan passes with strict typing
5. Existing tests (if any) still pass

**Approach:**
- Create `backend/src/DTO/Request/` and `backend/src/DTO/Response/` directories
- Start with TaskResponse (most duplicated) as template
- Use Symfony Serializer groups for flexible field inclusion
- Use Symfony Validator for request validation

---

### Phase 10: Backend Services

**Goal:** Controllers only handle HTTP, all business logic in services

**Plans:** 5 plans

Plans:
- [ ] 10-01-PLAN.md - Create RecurrenceService and DuplicateDetectionService (pure logic)
- [ ] 10-02-PLAN.md - Create TaskService with CRUD and completion logic
- [ ] 10-03-PLAN.md - Create PlanningService for planning mode operations
- [ ] 10-04-PLAN.md - Refactor controllers to thin wrappers
- [ ] 10-05-PLAN.md - Refactor BrainDumpFacade to use DuplicateDetectionService

**Requirements:**
- SVC-01: TaskService handles CRUD
- SVC-02: TaskService handles completion + recurring generation
- SVC-03: RecurrenceService consolidates matchesRecurrencePattern()
- SVC-04: PlanningService handles schedule acceptance
- SVC-05: No EntityManager calls in controllers
- SVC-06: Split BrainDumpFacade

**Success Criteria:**
1. TaskController under 100 lines (from 320)
2. PlanningController under 80 lines (from 257)
3. No `$this->entityManager->persist()` or `flush()` in controllers
4. matchesRecurrencePattern() exists in exactly one place
5. BrainDumpFacade under 200 lines

**Approach:**
- Create `TaskService` with methods matching controller actions
- Move recurrence logic to `RecurrenceService`
- Extract `DuplicateDetectionService` from BrainDumpFacade
- Controllers become thin wrappers: validate -> call service -> return DTO

**Dependencies:** Phase 9 (uses DTOs for input/output)

---

### Phase 11: Backend Tests

**Goal:** Test coverage for new architecture

**Requirements:**
- TST-01: Unit tests for TaskService
- TST-02: Unit tests for RecurrenceService
- TST-03: Unit tests for DTO validation
- TST-04: Unit tests for PlanningService
- TST-05: Integration tests for Task API

**Success Criteria:**
1. TaskService has 80%+ test coverage
2. RecurrenceService has 100% test coverage (all patterns)
3. Invalid DTO requests return 400 with validation errors
4. Integration tests verify full request/response cycle
5. CI can run tests (if CI exists)

**Approach:**
- Use PHPUnit with Symfony's test helpers
- Mock repositories for unit tests
- Use test database for integration tests
- Test each recurrence type (daily, weekly, weekdays, monthly, custom)

**Dependencies:** Phase 10 (tests the services)

---

### Phase 12: Frontend Slices

**Goal:** Split monolithic howAreYouSlice into focused slices

**Requirements:**
- SLC-01: checkInFlowSlice (modal state, task actions)
- SLC-02: planningFlowSlice (planning wizard)
- SLC-03: rebuildFlowSlice (rebuild day)
- SLC-04: Consolidate duplicate CheckInState
- SLC-05: Clean cross-slice dependencies

**Success Criteria:**
1. howAreYouSlice.ts deleted or reduced to coordinator
2. Each new slice under 200 lines
3. No duplicate type definitions across slices
4. Cross-slice imports use proper action dependencies
5. All existing functionality works (manual testing)

**Approach:**
- Create new slice files maintaining existing state shape
- Move reducers and thunks to appropriate slices
- Update imports across components
- Keep extraReducers pattern but document dependencies

**Dependencies:** None (can run in parallel with Phase 11)

---

### Phase 13: Frontend Storage

**Goal:** Centralize localStorage with typed useStorage hook

**Requirements:**
- STR-01: useStorage hook with typed keys
- STR-02: Migrate tagSlice
- STR-03: Migrate checkInSlice
- STR-04: Migrate useReminders
- STR-05: Centralize storage keys

**Success Criteria:**
1. No direct localStorage calls outside useStorage
2. Storage keys defined in single constants file
3. All storage operations have error handling
4. Migration preserves existing stored data
5. TypeScript catches storage key typos

**Approach:**
- Create `frontend/src/hooks/useStorage.ts` with generic typed API
- Create `frontend/src/lib/storageKeys.ts` with all keys
- Migrate modules one by one, testing each
- Handle migration of existing data formats if needed

**Dependencies:** Phase 12 (may need updated slice structure)

---

## Requirement Coverage

All 28 requirements mapped:

| Category | Requirements | Phase |
|----------|--------------|-------|
| Backend DTOs | DTO-01 to DTO-07 | 9 |
| Backend Services | SVC-01 to SVC-06 | 10 |
| Backend Tests | TST-01 to TST-05 | 11 |
| Frontend Slices | SLC-01 to SLC-05 | 12 |
| Frontend Storage | STR-01 to STR-05 | 13 |

**Coverage:** 28/28 requirements mapped (100%)

---

## Phase Dependencies

```
Phase 9 (DTOs)
    |
Phase 10 (Services) ---------> Phase 11 (Tests)
                                      |
Phase 12 (Slices) <-------------------+ (can run parallel)
    |
Phase 13 (Storage)
```

- Phase 9 -> 10: Services use DTOs
- Phase 10 -> 11: Tests verify services
- Phase 12: Can start after Phase 10, parallel with 11
- Phase 13: After Phase 12 (may use new slice structure)

---

*Roadmap created: 2026-01-22*
