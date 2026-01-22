# Requirements: Dopaminder v2 Architecture

**Defined:** 2026-01-22
**Core Value:** Struktura z elastycznoscia — AI sugeruje, uzytkownik decyduje

## v2 Requirements

Architecture refactoring milestone focused on code quality, maintainability, and testability.

### Backend DTOs

- [x] **DTO-01**: Task serialization uses TaskResponse DTO instead of inline arrays (eliminates 6+ duplications)
- [x] **DTO-02**: Event serialization uses EventResponse DTO
- [x] **DTO-03**: TimeBlock serialization uses TimeBlockResponse DTO
- [x] **DTO-04**: Task creation uses TaskCreateRequest DTO with validation
- [x] **DTO-05**: Task update uses TaskUpdateRequest DTO with validation
- [x] **DTO-06**: Planning schedule items use ScheduleItemResponse DTO
- [x] **DTO-07**: DailyNote response uses DailyNoteResponse DTO (replaces 20+ field arrays)

### Backend Services

- [x] **SVC-01**: TaskService handles task CRUD operations (extracted from TaskController)
- [x] **SVC-02**: TaskService handles task completion with recurring task generation
- [x] **SVC-03**: RecurrenceService consolidates matchesRecurrencePattern() logic (removes duplication)
- [x] **SVC-04**: PlanningService handles schedule acceptance logic (extracted from PlanningController)
- [x] **SVC-05**: Controllers only handle HTTP concerns (request/response, no EntityManager calls)
- [x] **SVC-06**: BrainDumpFacade split into smaller focused services (DuplicateDetectionService, etc.)

### Backend Tests

- [ ] **TST-01**: Unit tests for TaskService (CRUD, completion, recurring generation)
- [ ] **TST-02**: Unit tests for RecurrenceService (all recurrence patterns)
- [ ] **TST-03**: Unit tests for DTO validation (TaskCreateRequest, TaskUpdateRequest)
- [ ] **TST-04**: Unit tests for PlanningService (schedule acceptance)
- [ ] **TST-05**: Integration tests for Task API endpoints

### Frontend Slices

- [ ] **SLC-01**: howAreYouSlice split into separate checkInFlowSlice (modal, task actions)
- [ ] **SLC-02**: howAreYouSlice split into separate planningFlowSlice (planning wizard state)
- [ ] **SLC-03**: howAreYouSlice split into separate rebuildFlowSlice (rebuild day state)
- [ ] **SLC-04**: Duplicate CheckInState definitions consolidated (single source of truth)
- [ ] **SLC-05**: Cross-slice dependencies use Redux middleware instead of extraReducers where cleaner

### Frontend Storage

- [ ] **STR-01**: useStorage hook created for centralized localStorage access
- [ ] **STR-02**: tagSlice migrated to useStorage
- [ ] **STR-03**: checkInSlice migrated to useStorage
- [ ] **STR-04**: useReminders migrated to useStorage
- [ ] **STR-05**: Storage keys centralized in constants file

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | This is a refactoring milestone |
| Database schema changes | No entity changes, only code structure |
| API contract changes | Responses must remain backward compatible |
| CQRS with separate read/write models | Too complex for current scale |
| GraphQL migration | Out of scope, REST is sufficient |
| Frontend type generation from OpenAPI | Consider for v3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DTO-01 | 9 | Complete |
| DTO-02 | 9 | Complete |
| DTO-03 | 9 | Complete |
| DTO-04 | 9 | Complete |
| DTO-05 | 9 | Complete |
| DTO-06 | 9 | Complete |
| DTO-07 | 9 | Complete |
| SVC-01 | 10 | Complete |
| SVC-02 | 10 | Complete |
| SVC-03 | 10 | Complete |
| SVC-04 | 10 | Complete |
| SVC-05 | 10 | Complete |
| SVC-06 | 10 | Complete |
| TST-01 | 11 | Pending |
| TST-02 | 11 | Pending |
| TST-03 | 11 | Pending |
| TST-04 | 11 | Pending |
| TST-05 | 11 | Pending |
| SLC-01 | 12 | Pending |
| SLC-02 | 12 | Pending |
| SLC-03 | 12 | Pending |
| SLC-04 | 12 | Pending |
| SLC-05 | 12 | Pending |
| STR-01 | 13 | Pending |
| STR-02 | 13 | Pending |
| STR-03 | 13 | Pending |
| STR-04 | 13 | Pending |
| STR-05 | 13 | Pending |

**Coverage:**
- v2 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-22*
