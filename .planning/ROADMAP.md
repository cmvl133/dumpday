# Roadmap — Time Blocks Milestone

**Project:** Dopaminder
**Milestone:** Time Blocks (v1)
**Created:** 2026-01-20
**Phases:** 5

---

## Phase 1: Backend Foundation

**Goal:** Create TimeBlock entity and API following RecurringTask pattern

**Delivers:**
- TimeBlock entity with name, color, startTime, endTime, recurrenceType, recurrenceDays
- TimeBlock ↔ Tag ManyToMany relationship
- TimeBlock ↔ User ManyToOne relationship
- TimeBlockRepository with query methods
- CRUD API endpoints (GET/POST/PUT/DELETE)
- TimeBlockService for computing active blocks for a date

**Requirements Addressed:**
- REQ-001: TimeBlock entity
- REQ-002: Recurrence support
- REQ-003: Tag relationship
- REQ-005: User ownership
- REQ-006: CRUD API
- REQ-007: Get blocks for date endpoint
- REQ-008: Include blocks in DailyNote response

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — TimeBlock entity, Tag inverse relationship, repository, migration
- [x] 01-02-PLAN.md — CRUD controller (list, create, update, delete)
- [x] 01-03-PLAN.md — TimeBlockService, date endpoint, DailyNote integration

**Success Criteria:**
- [x] TimeBlock entity created with Doctrine ORM
- [x] Migration generated and applied
- [x] API endpoints return correct JSON structure
- [x] TimeBlockService computes active blocks for date

**Dependencies:** None (foundation phase)

**Status:** complete
**Completed:** 2026-01-20

---

## Phase 2: Schedule Visualization

**Goal:** Display time blocks on DaySchedule as visual background layer

**Delivers:**
- TimeBlock TypeScript type matching backend response
- TimeBlockStrip component with diagonal stripe pattern
- TimeBlockBackground container component
- Integration into DaySchedule.tsx
- Integration into ScheduleExpandedModal.tsx
- Hover tooltip with block name, times, and edit option

**Requirements Addressed:**
- REQ-009: Narrow strips on left side
- REQ-010: Diagonal stripe pattern
- REQ-011: Color coding
- REQ-012: Hover shows block name + edit option
- REQ-013: Duration visible

**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — TimeBlock type, TimeBlockStrip component with diagonal stripes and hover tooltip
- [ ] 02-02-PLAN.md — TimeBlockBackground container, DaySchedule and ScheduleExpandedModal integration

**Success Criteria:**
- [ ] Blocks appear as colored strips on schedule
- [ ] Diagonal stripe pattern visible
- [ ] Position aligns with time grid
- [ ] Multiple blocks display correctly
- [ ] No visual interference with events/tasks
- [ ] Hover tooltip shows block details

**Dependencies:** Phase 1 (needs API)

**Status:** planning

---

## Phase 3: Settings Management UI

**Goal:** Build Settings page for TimeBlock template CRUD

**Delivers:**
- TimeBlock settings section in Settings page
- Create/edit block form (name, color, times, recurrence)
- Tag association multi-select
- List view of existing blocks
- Delete block with confirmation
- i18n translations (en/pl)

**Requirements Addressed:**
- REQ-014: Settings page for blocks
- REQ-015: Configure recurring schedule
- REQ-016: Associate tags
- REQ-017: Preview of weekly schedule

**Success Criteria:**
- [ ] Can create new time block from Settings
- [ ] Can edit existing block
- [ ] Can select multiple tags for block
- [ ] Can configure days of week
- [ ] Changes persist and appear on schedule

**Dependencies:** Phase 1 (needs entity), Phase 2 (visual feedback)

**Status:** pending

---

## Phase 4: Exception Handling

**Goal:** Allow per-day modifications to blocks without changing template

**Delivers:**
- TimeBlockException entity
- Exception API endpoints
- "Skip today" one-click action
- Inline time modification on schedule
- Visual indicator for exceptions
- Exception stored separately from template

**Requirements Addressed:**
- REQ-004: TimeBlockException entity
- REQ-018: Skip single day
- REQ-019: Modify times for single day
- REQ-020: Template unchanged by exceptions
- REQ-021: Visual indicator

**Success Criteria:**
- [ ] Can skip block for today only
- [ ] Can modify block times for today only
- [ ] Next day shows original template
- [ ] Modified blocks visually distinguishable
- [ ] Template in Settings unchanged

**Dependencies:** Phase 2 (visualization), Phase 3 (templates exist)

**Status:** pending

---

## Phase 5: Task-Block Matching

**Goal:** Auto-assign tasks to blocks based on tag matching

**Delivers:**
- Tag-based matching logic in planning service
- "First available block" algorithm
- AI block suggestion in brain dump prompt
- User confirmation UI for suggestions
- Visual indicator of task-block match
- Tasks without blocks allowed

**Requirements Addressed:**
- REQ-022: Multiple matching blocks via tags
- REQ-023: Tasks without blocks
- REQ-024: First available matching block
- REQ-025: AI suggestion at brain dump
- REQ-026: Visual indicator

**Success Criteria:**
- [ ] Tagged tasks auto-assigned to matching block
- [ ] First available block selected when multiple match
- [ ] Untagged tasks remain unassigned
- [ ] AI suggests block during brain dump
- [ ] User can accept/reject suggestion
- [ ] Visual shows task-block association

**Dependencies:** Phase 1-4 (full block system)

**Status:** pending

---

## Phase Summary

| Phase | Name | Requirements | Dependencies |
|-------|------|--------------|--------------|
| 1 | Backend Foundation | REQ-001,002,003,005,006,007,008 | — |
| 2 | Schedule Visualization | REQ-009,010,011,012,013 | Phase 1 |
| 3 | Settings Management UI | REQ-014,015,016,017 | Phase 1,2 |
| 4 | Exception Handling | REQ-004,018,019,020,021 | Phase 2,3 |
| 5 | Task-Block Matching | REQ-022,023,024,025,026 | Phase 1-4 |

---

## Execution Notes

**Parallelization opportunities:**
- Phase 2 & 3 can partially overlap (frontend work after API ready)
- Within phases, backend and frontend tasks can run in parallel

**Research flags:**
- Phase 4: UX patterns for inline editing need prototyping
- Phase 5: AI prompts need experimentation

**Pattern references:**
- Phase 1: Follow `RecurringTask.php` entity pattern
- Phase 2: Follow existing `DaySchedule.tsx` component patterns
- Phase 3: Follow existing Settings page structure
- Phase 5: Follow `BrainDumpAnalyzer` prompt patterns

---

*Roadmap created: 2026-01-20*
