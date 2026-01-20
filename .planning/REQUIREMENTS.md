# Requirements — Time Blocks Milestone

**Project:** Dopaminder
**Milestone:** Time Blocks (v1)
**Created:** 2026-01-20

## Scope Summary

Time blocks introduce a third entity type on the schedule (alongside events and tasks) that represents contextual time containers. Blocks are **soft constraints** that guide task placement through tag matching, respecting ADHD users' need for structure with flexibility.

---

## V1 Requirements (This Milestone)

### Backend Foundation (Phase 1 — Complete ✓)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | TimeBlock entity with name, color, startTime, endTime | Must | ✓ Complete |
| REQ-002 | TimeBlock recurrence (daily, weekly, weekdays, custom days) | Must | ✓ Complete |
| REQ-003 | TimeBlock ↔ Tag ManyToMany relationship | Must | ✓ Complete |
| REQ-004 | TimeBlockException entity for per-day overrides | Must | ✓ Complete (Phase 4) |
| REQ-005 | TimeBlock belongs to User (not DailyNote) | Must | ✓ Complete |
| REQ-006 | CRUD API endpoints for TimeBlock | Must | ✓ Complete |
| REQ-007 | Endpoint to get active blocks for a date | Must | ✓ Complete |
| REQ-008 | Include blocks in DailyNote response | Should | ✓ Complete |

### Schedule Visualization (Phase 2 — Complete ✓)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-009 | Display blocks as narrow strips on left side of schedule | Must | ✓ Complete |
| REQ-010 | Diagonal stripe pattern for block backgrounds | Must | ✓ Complete |
| REQ-011 | Color coding per block type | Must | ✓ Complete |
| REQ-012 | Hover shows block name + edit option | Must | ✓ Complete |
| REQ-013 | Block duration visible (implicitly via position) | Should | ✓ Complete |

### Settings Management (Phase 3 — Complete ✓)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-014 | Time block settings page in Settings | Must | ✓ Complete |
| REQ-015 | Configure recurring schedule (days + times) | Must | ✓ Complete |
| REQ-016 | Associate tags with blocks | Must | ✓ Complete |
| REQ-017 | Preview of weekly schedule | Should | Deferred |

### Exception Handling (Phase 4 — Complete ✓)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-004 | TimeBlockException entity for per-day overrides | Must | ✓ Complete |
| REQ-018 | Skip block for single day ("just today") | Must | ✓ Complete |
| REQ-019 | Modify block times for single day | Must | ✓ Complete |
| REQ-020 | Exceptions don't affect template | Must | ✓ Complete |
| REQ-021 | Visual indicator for modified blocks | Should | ✓ Complete |

### Task-Block Matching (Phase 5 — Complete ✓)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-022 | Task can have multiple matching blocks (via tags) | Must | ✓ Complete |
| REQ-023 | Task can exist without any block | Must | ✓ Complete |
| REQ-024 | Planning puts task in first available matching block | Must | ✓ Complete |
| REQ-025 | AI suggests block during brain dump | Should | ✓ Complete |
| REQ-026 | Visual indicator of task-block association | Should | ✓ Complete |

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
| Block creation from events | Blocks ≠ events, different semantics |
| Blocks as hard constraints | AI suggests, user decides — ADHD flexibility |
| Shared/team blocks | Personal app, not team features |
| Complex block rules/dependencies | Keep simple for ADHD cognitive load |
| Block notifications/alarms | Existing task/event notifications sufficient |
| Minute-level precision | 15-30 minute increments only |

---

## Success Criteria

Milestone is complete when:

1. User can create recurring time blocks in Settings (name, color, schedule, tags)
2. Blocks appear on schedule view as narrow colored strips with diagonal patterns
3. User can hover to see block name and access edit
4. User can skip or modify a single occurrence inline on schedule
5. Tasks with matching tags are automatically placed in first available block during planning
6. AI suggests block assignment during brain dump, user confirms
7. Tasks without matching tags remain unassigned to blocks (allowed)
8. All existing functionality (events, tasks, notes, brain dump) continues working

---

## Acceptance Tests

| Test | Expected Result |
|------|-----------------|
| Create "Work" block 9-17 weekdays with "work" tag | Block appears in Settings, saved to DB |
| View schedule for weekday | Work block visible as colored strip on left |
| Hover over block | Name "Work" and edit option shown |
| Click "skip today" on block | Block hidden for today, back tomorrow |
| Change block to 10-18 for today | Modified times shown, template unchanged |
| Brain dump: "finish ING report" (has "work" tag) | AI suggests "Work" block, user confirms |
| Plan day with "work" tagged task | Task placed during 9-17 work block |
| Create task with no tags | Task scheduled without block association |

---

*Requirements defined: 2026-01-20*
