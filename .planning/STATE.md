# Project State — Dopaminder

**Updated:** 2026-01-22

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Struktura z elastycznoscia — AI sugeruje, uzytkownik decyduje
**Current focus:** v2 Architecture Refactoring

## Current Status

**Milestone:** v2 Architecture Refactoring
**Phase:** 11 (Backend Tests) - COMPLETE
**Activity:** Completed 11-04-PLAN.md (PlanningService Unit Tests)

Progress: [Phase 11] 4/4 plans COMPLETE | [Milestone v2] 3/5 phases

## Milestones

| Version | Name | Status | Shipped |
|---------|------|--------|---------|
| v1 | Time Blocks | Complete | 2026-01-20 |
| v1.1 | Bugfixes | Complete | 2026-01-22 |
| v2 | Architecture | In Progress | - |

## Completed Work

- [x] v1 Time Blocks milestone (5 phases, 15 plans)
- [x] v1.1 Bugfixes milestone (3 phases, 5 plans)
- [x] Phase 9: Backend DTOs (6 plans)
- [x] Phase 10: Backend Services (5 plans)
- [x] Phase 11: Backend Tests (4 plans)

## Active Work

**v2 Architecture Refactoring:**
- Phase 9: Backend DTOs (6 plans) - VERIFIED
  - [x] 09-01: Base Response DTOs (Tag, Event, Note, JournalEntry)
  - [x] 09-02: Task Request DTOs
  - [x] 09-03: Task and TimeBlock Response DTOs
  - [x] 09-04: Schedule & DailyNote Response DTOs
  - [x] 09-05: Controller Integration - Response DTOs
  - [x] 09-06: Controller Integration - Request DTOs
- Phase 10: Backend Services - VERIFIED
  - [x] 10-01: Pure Logic Services (RecurrenceService, DuplicateDetectionService)
  - [x] 10-02: TaskService (task CRUD, completion, tag management)
  - [x] 10-03: PlanningService (planning mode operations)
  - [x] 10-04: Controller Refactoring (TaskController, PlanningController thin wrappers)
  - [x] 10-05: BrainDumpFacade Refactoring (duplicate detection delegation)
- Phase 11: Backend Tests - COMPLETE
  - [x] 11-01: Testing Infrastructure Setup (Pure Logic Services)
  - [x] 11-02: DTO Request Validation Tests
  - [x] 11-03: Service Unit Tests
  - [x] 11-04: PlanningService Unit Tests
- Phase 12: Frontend Slices (pending)
- Phase 13: Frontend Storage (pending)

## Next Action

**Continue to Phase 12:**

```
/gsd:execute-phase 12
```

Phase 11 complete with 150+ unit tests covering:
- RecurrenceService (17 tests)
- DuplicateDetectionService (24 tests)
- DTO validation (81 tests)
- PlanningService (28 tests)

## Context Notes

**Architecture Analysis (2026-01-22):**
- Backend: Task serializacja zduplikowana 6+ razy - RESOLVED (DTOs)
- Backend: matchesRecurrencePattern() w 2 miejscach - RESOLVED (RecurrenceService)
- Backend: 30+ EntityManager calls w kontrolerach - RESOLVED (Services)
- Frontend: howAreYouSlice 583 linii (CheckIn+Planning+Rebuild)
- Frontend: localStorage rozrzucony po modulach

**v2 Approach:**
- DTOs first (foundation for services) - COMPLETE
- Services extract logic (controllers become thin) - COMPLETE
- Tests verify services work - COMPLETE
- Frontend slices split (parallel with backend) - NEXT
- Storage centralization last (may need slice changes)

**Patterns Established (09-01 through 09-06):**
- Response DTO: final readonly class with fromEntity() static factory
- Request DTO: final readonly class with #[Assert\*] attributes
- String types for dates in DTOs (convert in service layer)
- HH:MM regex for time validation
- Nested DTO composition: Use array_map with ChildDTO::fromEntity() for nested collections
- fromArray() factory: Use for DTOs created from AI/service output (not entities)
- Complex container DTOs: Let facade/service handle assembly, DTO is typed container
- MapRequestPayload: Use for POST/PUT endpoints with validated Request DTOs

**Patterns Established (10-01):**
- Pure logic service: final readonly class with no constructor dependencies
- Pattern matching consolidated: single source of truth for recurrence logic

**Patterns Established (11-01):**
- PHPUnit 11 attributes: #[Test] and #[DataProvider] instead of annotations
- Static data provider methods with iterable return type and yield syntax
- Direct entity instantiation for pure logic service tests (no mocks needed)

**Patterns Established (11-02):**
- DTO validation test pattern: Validation::createValidatorBuilder()->enableAttributeMapping()
- DataProvider pattern for format validation (valid/invalid date, time formats)
- Standalone Validator for unit testing without Symfony kernel

**Patterns Established (11-04):**
- Service mock pattern: Mock all constructor dependencies in setUp()
- Ownership test pattern: Mock User.getId() and DailyNote.getUser() chain
- Private property helper: Reusable setTaskDailyNote() for entity relationship setup

**Key Decisions (09-06):**
- PlanningController keeps inline serialization - planning-specific fields don't fit base DTOs
- TaskUpdateRequest integration deferred to Phase 10 - PATCH null vs missing field semantics
- Events/notes/journal keep inline format in BrainDumpFacade - different API contract

**Key Decisions (10-01):**
- RecurrenceService as pure logic service (no EntityManager) for testability
- DuplicateDetectionService extracts timesOverlap and duplicate checks from BrainDumpFacade
- TaskController also refactored to use RecurrenceService (not just RecurringSyncService)

**Key Decisions (10-02):**
- TaskService handles all task CRUD, completion, and tag management
- TaskUpdateResult returns task + optional generatedNextTask for complex updates
- PATCH semantics use array_key_exists() to distinguish null vs missing fields

**Key Decisions (10-03):**
- PlanningService returns raw entities/arrays - controller handles serialization with planning-specific fields
- PATCH semantics via array_key_exists for explicit null vs missing field distinction
- Single flush at end of acceptSchedule for atomic batch updates

**Key Decisions (10-05):**
- BrainDumpFacade at 299 lines acceptable - target was 200 but remaining is orchestration logic
- Pass original strings to DuplicateDetectionService - service handles normalization
- getDailyNoteData() stays in facade - complex aggregation is facade's responsibility

**Key Decisions (10-04):**
- TaskController reduced to single dependency (TaskService)
- PlanningController keeps planning-specific serialization (hasConflict, matchingBlock)
- Line count targets aspirational - key goal was zero EntityManager calls (achieved)

**Key Decisions (11-04):**
- Used Reflection to set private dailyNote property on Task for ownership tests
- Testing PATCH semantics via array_key_exists behavior validation

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 11-04-PLAN.md (PlanningService Unit Tests)
Resume file: None

---

*Last updated: 2026-01-22*
