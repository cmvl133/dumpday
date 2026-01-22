# Project Milestones: Dopaminder

## v1.1 Bugfixes (Shipped: 2026-01-22)

**Delivered:** Bug fixes and polish for v1 Time Blocks release - Notes panel, check-in modal, and AI planning improvements.

**Phases completed:** 6-8 (5 plans total)

**Key accomplishments:**

- Notes panel fixes: single close button, auto-select, WYSIWYG, HTML preview, empty content, dual buttons UX
- Check-in modal respects user dismiss intent (updates lastModalAt timestamp)
- Cross-slice Redux pattern for immediate task list updates
- Event allowOverlap property for AI scheduling control
- Overdue tasks now included in planning view

**Stats:**

- 39 files modified
- ~3,005 lines added (PHP + TypeScript)
- 3 phases, 5 plans, 21 commits
- 1 day from start to ship

**Git range:** `d43fcf0` → `92a71a1`

**What's next:** Planning v1.2 or v2 features

---

## v1 Time Blocks (Shipped: 2026-01-20)

**Delivered:** Time blocks for organizing the day into contexts (work, relax, family) with automatic task-block matching via tags.

**Phases completed:** 1-5 (15 plans total)

**Key accomplishments:**

- TimeBlock entity system with recurrence logic matching RecurringTask pattern
- Schedule visualization with diagonal stripe pattern and hover tooltips
- Settings Management UI with complete CRUD and tag association
- Exception handling for per-day skip/modify/restore without affecting template
- Task-Block matching via tags with "first available block" algorithm
- AI awareness of blocks during brain dump for suggestions

**Stats:**

- 72 files created/modified
- ~9,750 lines added (PHP + TypeScript)
- 5 phases, 15 plans, 67 commits
- 1 day from start to ship

**Git range:** `feat(01-01)` → `feat(05-03)`

**Deferred to v2:**
- REQ-017: Preview of weekly schedule

**What's next:** TBD

---

