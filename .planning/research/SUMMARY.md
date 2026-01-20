# Project Research Summary

**Project:** Dopaminder - Time Blocks Feature
**Domain:** Time blocking for ADHD planning application
**Researched:** 2026-01-20
**Confidence:** HIGH

## Executive Summary

Time blocking for Dopaminder is a **brownfield feature** that fits cleanly into the existing architecture. The current stack (React 19, Redux Toolkit, @dnd-kit, Tailwind CSS, Symfony 7.4, Doctrine) handles all requirements with **no new major dependencies needed**. The implementation should follow the established `RecurringTask` pattern: a `TimeBlock` entity as a user-level template with computed instances per day, plus a `TimeBlockException` entity for per-day modifications.

The recommended approach treats time blocks as **soft constraints, not rigid schedules**. This is critical for ADHD users who need structure with escape hatches. Blocks guide task placement through tag matching, but tasks can exist without blocks, and users can override any AI suggestion. Visual design must remain subtle (narrow strips with diagonal patterns) to avoid overwhelming ADHD users who already struggle with cognitive load.

The primary risks are: (1) building rigid scheduling that causes ADHD users to abandon the feature when their day inevitably changes, (2) visual complexity that creates anxiety instead of reducing it, and (3) exception handling becoming too complex. Mitigation: keep blocks as suggestions, maintain visual subtlety, simplify exceptions to "just today" vs "change template."

## Key Findings

### Recommended Stack

**No new dependencies required for MVP.** The existing stack covers all needs.

**Core technologies already in place:**
- **@dnd-kit/core + sortable** (^6.3.1, ^10.0.0): Drag-and-drop for schedule interactions - already integrated
- **Tailwind CSS** (^3.4.17): Diagonal stripe patterns via `repeating-linear-gradient` - no library needed
- **Redux Toolkit** (^2.5.0): State management - add new slice following `recurringSlice.ts` pattern
- **Symfony/Doctrine**: Backend - follow `RecurringTask.php` entity pattern

**Not needed for MVP:**
- `rrule` library - existing `recurrenceDays` pattern sufficient for weekly schedules
- `date-fns`/`dayjs` - time blocks use simple HH:MM strings, not complex date math
- Calendar libraries (react-big-calendar, FullCalendar) - existing `DaySchedule.tsx` sufficient

### Expected Features

**Must have (table stakes):**
- Visual block display on schedule (distinct from events/tasks)
- Create/edit blocks with name, color, start/end time
- Recurring blocks (daily, weekdays, custom day selection)
- Single-occurrence exceptions (skip/modify a specific day)

**Should have (differentiators):**
- Tag-based task matching - auto-suggest which block fits a task (unique to Dopaminder)
- AI block suggestion during brain dump (reduces ADHD decision fatigue)
- Visual distinction via diagonal stripe patterns (skosne wzory)
- Inline exception editing on schedule view
- Block hover preview

**Defer (v2+):**
- Buffer time configuration (use 15min default first)
- Block utilization analytics
- Energy-based block types (can prototype with tags)
- Overcommitment warnings (needs capacity calculation)

### Architecture Approach

Time blocks follow the existing `RecurringTask` pattern: `TimeBlock` is a user-owned template entity that defines recurring schedules, not a DailyNote child. Instances are computed at query time for the requested date, not stored. Per-day exceptions are sparse overrides stored in `TimeBlockException`.

**Major components:**
1. **TimeBlock entity** - Recurring template: name, color, startTime, endTime, recurrenceDays[], tags[]
2. **TimeBlockException entity** - Per-day overrides: skip or modify times for specific date
3. **TimeBlockService** - Computes active blocks for a given date, applies exceptions
4. **timeBlockSlice (Redux)** - Template management (CRUD) separate from daily instances
5. **TimeBlockBackground component** - Visual layer in DaySchedule, rendered behind events/tasks

### Critical Pitfalls

1. **Rigidity defeating ADHD flexibility needs** - Build blocks as suggestions, not constraints. Allow "skip today" one-click. Never show "failed" blocks. Tasks can have no block.

2. **Visual complexity overwhelming users** - Use narrow strips with diagonal patterns, not full-width backgrounds. Progressive disclosure: hover for details. Limited color palette.

3. **Recurring block performance degradation** - Store templates, not instances. Compute on-the-fly for requested date. Only store exceptions.

4. **Exception handling complexity** - Simplify to two options: "just today" (inline) vs "change template" (Settings). No "this and all future" option.

5. **AI over-automation removing agency** - AI suggests, user confirms. Show reasoning. Easy reject. Never auto-assign without confirmation.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Backend Foundation
**Rationale:** Entity and API must exist before frontend can display anything. Following `RecurringTask` pattern reduces uncertainty.
**Delivers:** TimeBlock entity, repository, CRUD API endpoints, integration with DailyNote response
**Addresses:** Table stakes CRUD functionality
**Avoids:** Pitfall #3 (performance) by starting with correct template-not-instances model

### Phase 2: Schedule Visualization
**Rationale:** Users need to see blocks before they can interact with them. Visualization informs UX decisions for later phases.
**Delivers:** TimeBlockBackground component, integration into DaySchedule, visual styling with diagonal patterns
**Addresses:** Visual block display (table stakes), visual distinction (differentiator)
**Avoids:** Pitfall #2 (visual complexity) by keeping blocks as subtle background layer

### Phase 3: Settings Management UI
**Rationale:** Template management is complex enough to warrant dedicated UI. Separating from schedule view keeps each phase focused.
**Delivers:** Time block settings page, CRUD interface for templates, tag association
**Addresses:** Create/edit blocks with recurring schedule, tag-based organization
**Avoids:** Pitfall #4 (exception complexity) by keeping template editing in Settings only

### Phase 4: Exception Handling
**Rationale:** Exceptions depend on having working templates and visualization. This is the most complex interaction pattern.
**Delivers:** TimeBlockException entity, skip/modify single occurrence, inline editing on schedule
**Addresses:** Single-occurrence editing (table stakes), inline exception editing (differentiator)
**Avoids:** Pitfall #4 by limiting inline edits to "just today" only

### Phase 5: Task-Block Matching
**Rationale:** AI features build on having blocks with tags. This is the key differentiator for Dopaminder.
**Delivers:** Auto-suggest block for tagged tasks, visual indicator for task-block match
**Addresses:** Tag-based task matching (differentiator), AI block suggestion (differentiator)
**Avoids:** Pitfall #6 (rigid categorization) by allowing tasks without blocks, multiple block suggestions

### Phase Ordering Rationale

- **Entity before UI:** Backend foundation must exist before frontend displays anything
- **Visualization before management:** Users need to see results before configuring
- **Core before exceptions:** Exceptions are modifications to the happy path
- **Manual before AI:** Tag matching builds on existing tag system and block templates
- **Pitfall mitigation:** Each phase addresses specific pitfalls before they compound

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Exceptions):** UX patterns for inline editing need prototyping. Edge cases (what if block was already used today?)
- **Phase 5 (Matching):** AI suggestion prompts need experimentation. May need to adjust based on actual tag usage patterns.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backend):** Direct copy of RecurringTask pattern. Well-documented in codebase.
- **Phase 2 (Visualization):** CSS patterns proven. Schedule component exists.
- **Phase 3 (Settings):** Standard CRUD form. No novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified existing packages in package.json, no new dependencies |
| Features | HIGH | Multiple competitor analysis, clear table stakes vs differentiators |
| Architecture | HIGH | Directly follows existing RecurringTask pattern in codebase |
| Pitfalls | HIGH | ADHD-specific sources + general calendar implementation sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Block overlap behavior:** What happens if user creates overlapping blocks? Research suggests allowing max 1 block per time slot - needs design decision.
- **Hover interaction on mobile:** Block hover preview assumes desktop. Mobile needs alternative (tap or simplified view).
- **Historical blocks:** Should past days show their blocks or just template? Affects reporting/retrospective features.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: RecurringTask.php, DaySchedule.tsx, recurringSlice.ts, package.json
- [dnd-kit documentation](https://dndkit.com/)
- [Tailwind CSS arbitrary values](https://www.bavaga.com/blog/2025/02/13/css-tricks-striped-background-pure-css-tailwind/)

### Secondary (MEDIUM confidence)
- [Sunsama Time Blocking](https://www.sunsama.com/blog/time-blocking) - feature expectations
- [Reclaim Time Blocking Guide](https://reclaim.ai/blog/time-blocking-guide) - competitor features
- [Apriorit: Recurring Events Calendar Development](https://www.apriorit.com/dev-blog/web-recurring-events-feature-calendar-app-development) - storage patterns
- [CodeGenes: Calendar Storage](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/) - technical patterns

### ADHD-Specific (HIGH confidence)
- [ADDitude Magazine: ADHD Time Management](https://www.additudemag.com/time-management-skills-adhd-brain/)
- [FlowSavvy: Why Time-Blocking Systems Fail](https://flowsavvy.app/why-most-time-blocking-systems-fail)
- [Healthline: Time Blocking with ADHD](https://www.healthline.com/health/adhd/how-to-time-block-with-adhd)
- [Life Skills Advocate: Time Blocking for ADHD](https://lifeskillsadvocate.com/blog/time-blocking-for-adhd/)

---
*Research completed: 2026-01-20*
*Ready for roadmap: yes*
