# Roadmap: Dopaminder v1.1 Bugfixes

**Created:** 2026-01-22
**Milestone:** v1.1 Bugfixes
**Phases:** 6-8 (continues from v1)

## Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 6 | Notes Panel Fixes | Fix all notes-related bugs + UX improvements | NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05, NOTE-06 | In Progress |
| 7 | UI Behavior Fixes | Fix check-in modal and state updates | CHKN-01, UIST-01 | Pending |
| 8 | AI Planning Fixes | Fix planning logic issues | PLAN-01, PLAN-02, PLAN-03 | Pending |

## Phase Details

### Phase 6: Notes Panel Fixes

**Goal:** All notes panel functionality works correctly with improved UX

**Requirements:**
- NOTE-01: "Add new note" button creates a new note when clicked
- NOTE-02: Notes panel has single close button (remove duplicate X)
- NOTE-03: WYSIWYG editor displays content correctly in edit mode
- NOTE-04: Note preview renders formatted content (not raw HTML)
- NOTE-05: "Add new note" from expanded panel works (no API error)
- NOTE-06: Main screen Notes section has improved UX (dual buttons, expanded edit)

**Success Criteria:**
1. User clicks "Add new note" and a new empty note is created
2. Notes panel has exactly one close button
3. WYSIWYG editor shows formatted text while editing (bold, italic, lists)
4. Note preview displays rendered HTML, not raw tags
5. Creating note from expanded panel returns 201 (not validation error)
6. Main screen has "Quick note" (inline) and "Add Note" (expanded) buttons

**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — Fix Notes panel bugs (duplicate close button, add note flow, HTML preview)
- [ ] 06-02-PLAN.md — Fix note creation API, install typography plugin, improve main screen UX

---

### Phase 7: UI Behavior Fixes

**Goal:** UI responds correctly to user actions without refresh

**Requirements:**
- CHKN-01: Check-in modal stays closed until next scheduled interval after manual dismiss
- UIST-01: Marking task as Later/overdue updates list immediately (no refresh needed)

**Success Criteria:**
1. User closes check-in modal -> modal does not reappear until next interval
2. User marks task as Later -> task moves to Later section immediately
3. User marks task as overdue -> task appears in overdue section immediately

**Estimated Plans:** 1-2

---

### Phase 8: AI Planning Fixes

**Goal:** AI planning respects constraints and includes all relevant tasks

**Requirements:**
- PLAN-01: AI does not schedule tasks during events without overlap permission
- PLAN-02: AI task splitting behavior works as expected (investigate and fix)
- PLAN-03: Scheduled tasks (with date, no time) appear in daily planning

**Success Criteria:**
1. AI only schedules tasks during events that have `allowOverlap: true`
2. AI task splitting follows documented behavior (or behavior is documented and implemented)
3. Tasks with `scheduledDate` matching today appear in planning view

**Estimated Plans:** 2-3

---

## Requirement Coverage

All 11 requirements mapped:

| Requirement | Phase | Description |
|-------------|-------|-------------|
| NOTE-01 | 6 | Add new note button |
| NOTE-02 | 6 | Duplicate close button |
| NOTE-03 | 6 | WYSIWYG display |
| NOTE-04 | 6 | HTML preview |
| NOTE-05 | 6 | API accepts empty content |
| NOTE-06 | 6 | Main screen UX improvements |
| CHKN-01 | 7 | Check-in modal dismiss |
| UIST-01 | 7 | Later/overdue UI update |
| PLAN-01 | 8 | Event overlap respect |
| PLAN-02 | 8 | Task splitting |
| PLAN-03 | 8 | Scheduled tasks in planning |

**Coverage:** 11/11 requirements mapped (100%)

---

*Roadmap created: 2026-01-22*
*Last updated: 2026-01-22 after adding 06-02 gap closure plan*
