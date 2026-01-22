# Project State — Dopaminder

**Updated:** 2026-01-22

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Struktura z elastycznoscia — AI sugeruje, uzytkownik decyduje
**Current focus:** v1.1 Bugfixes

## Current Status

**Milestone:** v1.1 Bugfixes
**Phase:** 8 (AI Planning Fixes) - In Progress
**Activity:** Completed 08-02-PLAN.md (PLAN-02/PLAN-03 investigation)

Progress: [Phase 08] 2/? plans complete

## Milestones

| Version | Name | Status | Shipped |
|---------|------|--------|---------|
| v1 | Time Blocks | Complete | 2026-01-20 |
| v1.1 | Bugfixes | In Progress | — |

## Completed Work

- [x] v1 Time Blocks milestone (5 phases, 15 plans)
- [x] Phase 06-01: Fix Notes Panel Bugs (NOTE-01 through NOTE-04)
- [x] Phase 06-02: Gap Closure (empty content API, typography plugin, dual buttons UX)
- [x] Phase 07-01: UI Behavior Fixes (CHKN-01 modal dismiss, UIST-01 task list sync)
- [x] Phase 08-01: Event Overlap Control (PLAN-01 - allowOverlap property and AI prompt enforcement)
- [x] Phase 08-02: PLAN-02/PLAN-03 Investigation (task splitting verified OK, overdue tasks bug fixed)

## Active Work

Phase 08: AI Planning Fixes - continuing with remaining plans if any.

## Next Action

**PLAN 08-02 COMPLETE**

Investigation results:
1. PLAN-02 (task splitting): Works as designed - no changes needed
2. PLAN-03 (scheduled tasks): Bug fixed - overdue tasks now included in planning view

Fix applied:
- Changed `dueDate = :today` to `dueDate <= :today` in TaskRepository queries
- Affects findUnplannedTasksForToday() and findPlannedTasksForToday()

Ready for:
1. Manual testing of planning with overdue tasks
2. Continue to next plan in Phase 08 if any

## Context Notes

**Decisions from 08-02:**
- Use dueDate <= today to include overdue tasks in planning view
- Apply consistent fix to both planned and unplanned task queries
- Task splitting works as designed - no changes needed

**Decisions from 08-01:**
- Default allowOverlap=false (conservative - events block tasks unless explicitly allowed)
- Optional property in frontend for backward compatibility
- Added event ID to prompt event listings for better AI task-event matching

**Decisions from 07-01:**
- Use extraReducer addCase pattern for cross-slice coordination (no circular imports)
- Update lastModalAt on close, not just on open/complete, to respect dismiss intent

**Decisions from 06-02:**
- Use isset() instead of empty() for content validation - allows empty string
- Add triggerNewNote prop to NotesExpandedModal for auto-creation on open
- Keep inline 'Quick note' and expanded 'Add Note' as separate UX flows

**Decisions from 06-01:**
- hideCloseButton prop for DialogContent when using custom close button
- Auto-select new notes based on sortOrder='newest'
- HTML rendering with dangerouslySetInnerHTML and prose classes

**Archived from v1:**
- v1-ROADMAP.md, v1-REQUIREMENTS.md, v1-MILESTONE-AUDIT.md

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 08-02-PLAN.md
Resume file: None

---

*Last updated: 2026-01-22*
