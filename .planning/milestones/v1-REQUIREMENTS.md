# Requirements Archive: v1 Time Blocks

**Archived:** 2026-01-22
**Status:** SHIPPED

This is the archived requirements specification for v1 Time Blocks.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements — Time Blocks Milestone

**Project:** Dopaminder
**Milestone:** Time Blocks (v1)
**Created:** 2026-01-20

## Scope Summary

Time blocks introduce a third entity type on the schedule (alongside events and tasks) that represents contextual time containers. Blocks are **soft constraints** that guide task placement through tag matching, respecting ADHD users' need for structure with flexibility.

---

## V1 Requirements (This Milestone)

### Backend Foundation (Phase 1 — Complete)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | TimeBlock entity with name, color, startTime, endTime | Must | [x] Complete |
| REQ-002 | TimeBlock recurrence (daily, weekly, weekdays, custom days) | Must | [x] Complete |
| REQ-003 | TimeBlock <-> Tag ManyToMany relationship | Must | [x] Complete |
| REQ-004 | TimeBlockException entity for per-day overrides | Must | [x] Complete (Phase 4) |
| REQ-005 | TimeBlock belongs to User (not DailyNote) | Must | [x] Complete |
| REQ-006 | CRUD API endpoints for TimeBlock | Must | [x] Complete |
| REQ-007 | Endpoint to get active blocks for a date | Must | [x] Complete |
| REQ-008 | Include blocks in DailyNote response | Should | [x] Complete |

### Schedule Visualization (Phase 2 — Complete)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-009 | Display blocks as narrow strips on left side of schedule | Must | [x] Complete |
| REQ-010 | Diagonal stripe pattern for block backgrounds | Must | [x] Complete |
| REQ-011 | Color coding per block type | Must | [x] Complete |
| REQ-012 | Hover shows block name + edit option | Must | [x] Complete |
| REQ-013 | Block duration visible (implicitly via position) | Should | [x] Complete |

### Settings Management (Phase 3 — Complete)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-014 | Time block settings page in Settings | Must | [x] Complete |
| REQ-015 | Configure recurring schedule (days + times) | Must | [x] Complete |
| REQ-016 | Associate tags with blocks | Must | [x] Complete |
| REQ-017 | Preview of weekly schedule | Should | [ ] Deferred to v2 |

### Exception Handling (Phase 4 — Complete)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-004 | TimeBlockException entity for per-day overrides | Must | [x] Complete |
| REQ-018 | Skip block for single day ("just today") | Must | [x] Complete |
| REQ-019 | Modify block times for single day | Must | [x] Complete |
| REQ-020 | Exceptions don't affect template | Must | [x] Complete |
| REQ-021 | Visual indicator for modified blocks | Should | [x] Complete |

### Task-Block Matching (Phase 5 — Complete)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-022 | Task can have multiple matching blocks (via tags) | Must | [x] Complete |
| REQ-023 | Task can exist without any block | Must | [x] Complete |
| REQ-024 | Planning puts task in first available matching block | Must | [x] Complete |
| REQ-025 | AI suggests block during brain dump | Should | [x] Complete |
| REQ-026 | Visual indicator of task-block association | Should | [x] Complete |

---

## V2 Candidates (Deferred)

| ID | Feature | Rationale for Deferring |
|----|---------|------------------------|
| DEF-001 | Buffer time between blocks | Use 15min default first, configurable later |
| DEF-002 | Block utilization statistics | Analytics feature, needs usage data |
| DEF-003 | Energy-based block types | Can prototype with tags first |
| DEF-004 | Overcommitment warnings | Needs capacity calculation, complex |
| DEF-005 | "Playlist mode" (no blocks day) | Alternative UX, not core |
| DEF-006 | Mobile-specific hover alternative | Desktop-first for MVP |
| DEF-007 | Historical block display | Decide after core implementation |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Overlapping blocks | Max 1 block per time slot — prevents decision paralysis |
| Block creation from events | Blocks != events, different semantics |
| Blocks as hard constraints | AI suggests, user decides — ADHD flexibility |
| Shared/team blocks | Personal app, not team features |
| Complex block rules/dependencies | Keep simple for ADHD cognitive load |
| Block notifications/alarms | Existing task/event notifications sufficient |
| Minute-level precision | 15-30 minute increments only |

---

## Success Criteria

Milestone is complete when:

1. [x] User can create recurring time blocks in Settings (name, color, schedule, tags)
2. [x] Blocks appear on schedule view as narrow colored strips with diagonal patterns
3. [x] User can hover to see block name and access edit
4. [x] User can skip or modify a single occurrence inline on schedule
5. [x] Tasks with matching tags are automatically placed in first available block during planning
6. [x] AI suggests block assignment during brain dump, user confirms
7. [x] Tasks without matching tags remain unassigned to blocks (allowed)
8. [x] All existing functionality (events, tasks, notes, brain dump) continues working

---

## Acceptance Tests

| Test | Expected Result | Status |
|------|-----------------|--------|
| Create "Work" block 9-17 weekdays with "work" tag | Block appears in Settings, saved to DB | [x] Pass |
| View schedule for weekday | Work block visible as colored strip on left | [x] Pass |
| Hover over block | Name "Work" and edit option shown | [x] Pass |
| Click "skip today" on block | Block hidden for today, back tomorrow | [x] Pass |
| Change block to 10-18 for today | Modified times shown, template unchanged | [x] Pass |
| Brain dump: "finish ING report" (has "work" tag) | AI suggests "Work" block, user confirms | [x] Pass |
| Plan day with "work" tagged task | Task placed during 9-17 work block | [x] Pass |
| Create task with no tags | Task scheduled without block association | [x] Pass |

---

## Milestone Summary

**Shipped:** 25 of 26 v1 requirements (96%)
**Adjusted:** None
**Dropped:** REQ-017 (Preview of weekly schedule) — deferred to v2, lower priority

---

*Archived: 2026-01-22 as part of v1 milestone completion*
