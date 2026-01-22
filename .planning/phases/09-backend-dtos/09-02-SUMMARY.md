---
phase: 09-backend-dtos
plan: 02
subsystem: api
tags: [symfony, dto, validation, php8, readonly-class]

# Dependency graph
requires:
  - phase: 09-01
    provides: BaseResponse DTO foundation
provides:
  - TaskCreateRequest DTO with validation constraints
  - TaskUpdateRequest DTO with validation constraints
affects: [09-03, 09-04, controller-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Request DTO pattern: readonly class with constructor promotion"
    - "Validation via Symfony Assert attributes"
    - "String dates in DTOs (convert to DateTime in service layer)"

key-files:
  created:
    - backend/src/DTO/Request/TaskCreateRequest.php
    - backend/src/DTO/Request/TaskUpdateRequest.php
  modified: []

key-decisions:
  - "String types for dates (not DateTime) - Symfony serializer issues with date handling"
  - "HH:MM regex for time fields - matches frontend format"
  - "All UpdateRequest fields optional - PATCH semantics"

patterns-established:
  - "Request DTO: final readonly class with #[Assert\\*] attributes"
  - "Create vs Update: required fields vs all optional"
  - "Time validation: /^([01]\\d|2[0-3]):([0-5]\\d)$/ pattern"

# Metrics
duration: 2min
completed: 2026-01-22
---

# Phase 9 Plan 02: Task Request DTOs Summary

**TaskCreateRequest and TaskUpdateRequest DTOs with Symfony validation constraints for type-safe API input handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-22T09:19:58Z
- **Completed:** 2026-01-22T09:21:17Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- TaskCreateRequest DTO with NotBlank, Length, Date, and Choice constraints
- TaskUpdateRequest DTO with all optional fields for PATCH operations
- HH:MM regex validation for reminderTime and fixedTime fields
- PositiveOrZero constraint for estimatedMinutes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DTO Request directory and TaskCreateRequest** - `ec90e13` (feat)
2. **Task 2: Create TaskUpdateRequest DTO** - `d18acac` (feat)

## Files Created/Modified

- `backend/src/DTO/Request/TaskCreateRequest.php` - Task creation input validation with required title/date
- `backend/src/DTO/Request/TaskUpdateRequest.php` - Task update input validation with all optional fields

## Decisions Made

- **String types for dates:** Used string instead of DateTime due to Symfony serializer date handling issues noted in research. Conversion to DateTime happens in service/controller layer.
- **HH:MM regex pattern:** `/^([01]\d|2[0-3]):([0-5]\d)$/` validates 24-hour time format matching frontend expectations.
- **Optional array for canCombineWithEvents:** No validation beyond type check - empty array is valid, event ID validation happens in controller.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PHPStan not installed in project - skipped static analysis verification, but PHP syntax check and instantiation tests passed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Request DTOs ready for MapRequestPayload integration
- Pattern established for remaining entity Request DTOs (Event, Note, JournalEntry)
- Controller integration will require handling null vs missing field distinction for PATCH

---
*Phase: 09-backend-dtos*
*Completed: 2026-01-22*
