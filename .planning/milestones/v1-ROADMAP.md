# Milestone v1: Time Blocks

**Status:** SHIPPED 2026-01-20
**Phases:** 1-5
**Total Plans:** 15

## Overview

Time blocks introduce a third entity type on the schedule (alongside events and tasks) that represents contextual time containers. Blocks are soft constraints that guide task placement through tag matching, respecting ADHD users' need for structure with flexibility.

## Phases

### Phase 1: Backend Foundation

**Goal**: Create TimeBlock entity and API following RecurringTask pattern

**Depends on**: None (foundation phase)

**Plans**: 3 plans

- [x] 01-01-PLAN.md — TimeBlock entity, Tag inverse relationship, repository, migration
- [x] 01-02-PLAN.md — CRUD controller (list, create, update, delete)
- [x] 01-03-PLAN.md — TimeBlockService, date endpoint, DailyNote integration

**Details:**
- TimeBlock entity with name, color, startTime, endTime, recurrenceType, recurrenceDays
- TimeBlock <-> Tag ManyToMany relationship
- TimeBlock <-> User ManyToOne relationship
- TimeBlockRepository with query methods
- CRUD API endpoints (GET/POST/PUT/DELETE)
- TimeBlockService for computing active blocks for a date

**Completed:** 2026-01-20

---

### Phase 2: Schedule Visualization

**Goal**: Display time blocks on DaySchedule as visual background layer

**Depends on**: Phase 1

**Plans**: 3 plans

- [x] 02-01-PLAN.md — TimeBlock type, TimeBlockStrip component with diagonal stripes and hover tooltip
- [x] 02-02-PLAN.md — TimeBlockBackground container, DaySchedule and ScheduleExpandedModal integration
- [x] 02-03-PLAN.md — Wire timeBlocks from dailyNote to schedule components in App.tsx

**Details:**
- TimeBlock TypeScript type matching backend response
- TimeBlockStrip component with diagonal stripe pattern
- TimeBlockBackground container component
- Integration into DaySchedule.tsx and ScheduleExpandedModal.tsx
- Hover tooltip with block name, times, and edit option

**Completed:** 2026-01-20

---

### Phase 3: Settings Management UI

**Goal**: Build Settings page for TimeBlock template CRUD

**Depends on**: Phase 1, Phase 2

**Plans**: 3 plans

- [x] 03-01-PLAN.md — Redux slice and API client for TimeBlock CRUD
- [x] 03-02-PLAN.md — TimeBlockForm component with all input fields
- [x] 03-03-PLAN.md — TimeBlockSettings component, SettingsModal integration, i18n

**Details:**
- TimeBlock settings section in Settings page
- Create/edit block form (name, color, times, recurrence)
- Tag association multi-select
- List view of existing blocks
- Delete block with confirmation
- i18n translations (en/pl)

**Completed:** 2026-01-20

---

### Phase 4: Exception Handling

**Goal**: Allow per-day modifications to blocks without changing template

**Depends on**: Phase 2, Phase 3

**Plans**: 3 plans

- [x] 04-01-PLAN.md — TimeBlockException entity, repository, migration
- [x] 04-02-PLAN.md — Backend API and service modification for exceptions
- [x] 04-03-PLAN.md — Frontend types, API, TimeBlockStrip UI, i18n

**Details:**
- TimeBlockException entity
- Exception API endpoints
- "Skip today" one-click action
- Inline time modification on schedule
- Visual indicator (dashed border) for exceptions
- Exception stored separately from template

**Completed:** 2026-01-20

---

### Phase 5: Task-Block Matching

**Goal**: Auto-assign tasks to blocks based on tag matching

**Depends on**: Phase 1-4

**Plans**: 3 plans

- [x] 05-01-PLAN.md — TaskBlockMatchingService, PlanningController integration
- [x] 05-02-PLAN.md — AI prompt enhancement for block suggestions
- [x] 05-03-PLAN.md — Frontend visual indicator, i18n translations

**Details:**
- Tag-based matching logic in planning service
- "First available block" algorithm
- AI block suggestion in brain dump prompt
- Visual indicator (colored dot) of task-block match
- Tasks without blocks allowed

**Completed:** 2026-01-20

---

## Milestone Summary

**Key Decisions:**

- TimeBlock follows RecurringTask pattern (template, not instance)
- Tag-based task matching (TimeBlock <-> Tag <-> Task)
- Blocks as soft constraints (AI suggests, user decides)
- "First available block" for task placement
- Exceptions limited to "just today" (no complex rules)
- Soft delete for time blocks (isActive=false, not hard delete)
- Skipped blocks completely excluded from for-date response

**Issues Resolved:**

- EventBlock leftOffset increased from 64px to 84px to avoid overlap with TimeBlockStrip
- Route /for-date/{date} avoids conflict with /{id} routes
- DailyNote returns timeBlocks even when no DailyNote entity exists

**Issues Deferred:**

- REQ-017: Preview of weekly schedule (deferred to v2)
- Settings modal getting crowded -> consider tabs organization in future

**Technical Debt Incurred:**

- PlanningTasksResponse type missing timeBlocks field (minor, data flows correctly)
- AI block suggestions (suggestedBlockId/Name) not surfaced in UI yet (by design)

---

*For current project status, see .planning/ROADMAP.md (created for next milestone)*

---

*Archived: 2026-01-22 as part of v1 milestone completion*
