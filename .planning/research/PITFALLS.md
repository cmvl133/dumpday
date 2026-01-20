# Domain Pitfalls: Time Blocking for ADHD Planning App

**Domain:** Time blocking feature for ADHD planning application (Dopaminder)
**Researched:** 2026-01-20
**Confidence:** HIGH (multiple sources, verified patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, user abandonment, or fundamental feature failure.

### Pitfall 1: Rigidity That Defeats ADHD Flexibility Needs

**What goes wrong:** Building time blocks as strict constraints that users must follow exactly. When plans inevitably change, the system becomes useless and users abandon it entirely.

**Why it happens:** Developers copy traditional calendar/scheduling patterns designed for neurotypical users. The assumption is "structure helps productivity" without understanding that ADHD brains need structure *with escape hatches*.

**Consequences:**
- Users feel suffocated by rigid schedules
- One disruption creates "domino effect" where entire day feels ruined
- Users abandon time blocking entirely rather than adapting
- Increased anxiety when unable to follow the plan

**ADHD-Specific Impact:** ADHD involves rejection sensitivity dysphoria (RSD). When users see failed/missed blocks, they experience it as personal failure rather than system limitation. This triggers avoidance of the feature.

**Warning Signs:**
- Users consistently ignore or delete blocks after creating them
- Feedback about feeling "trapped" or "suffocated"
- Low engagement with block editing/modification features
- High creation rate but low actual usage

**Prevention:**
- Blocks are **suggestions, not constraints** — AI recommends, user confirms
- Task matching to blocks is soft (first available block with matching tag)
- Tasks can explicitly have no block ("flexible timing")
- Easy one-click "skip block today" or "move all to tomorrow"
- Never show "failed" blocks — show "completed" vs "active" vs "upcoming"

**Detection in Development:**
- Test with users who have actual ADHD
- Ask: "What happens when your day goes completely off-script?"
- If answer requires manual rescheduling of multiple items, you have a rigidity problem

**Sources:**
- [FlowSavvy: Why Time-Blocking Systems Fail](https://flowsavvy.app/why-most-time-blocking-systems-fail)
- [Healthline: Time Blocking with ADHD](https://www.healthline.com/health/adhd/how-to-time-block-with-adhd)
- [ADDitude Magazine: ADHD Time Management](https://www.additudemag.com/time-management-skills-adhd-brain/)

---

### Pitfall 2: Overwhelming Visual Complexity

**What goes wrong:** Adding time blocks creates visual clutter that overwhelms ADHD users who already struggle with information overload. Too many visual elements compete for attention.

**Why it happens:** Feature creep and desire to show all information at once. Blocks + events + tasks + tags + times = cognitive overload.

**Consequences:**
- ADHD paralysis triggered by schedule view
- Users avoid opening the schedule
- Important items get lost in visual noise
- Anxiety increases instead of decreases

**ADHD-Specific Impact:** ADHD brains are already overwhelmed by cognitive load. Research shows up to 50% of ADHD individuals have comorbid anxiety, and visual overwhelm directly triggers both ADHD paralysis and anxiety responses.

**Warning Signs:**
- Users say schedule looks "busy" or "stressful"
- Requests to hide/minimize elements
- Users preferring list view over schedule view
- Complaints about not knowing where to look

**Prevention:**
- Blocks as subtle visual layer (narrow strips, not full-width backgrounds)
- Use patterns/hatching instead of solid colors (already planned: skewed patterns)
- Progressive disclosure: blocks visible on hover, minimal by default
- Clear visual hierarchy: current task > current block > future items
- Color coding must be distinct but not overwhelming (limited palette)

**Existing Project Alignment:**
Per PROJECT.md: "Wizualizacja blokow na schedule (waskie paski po lewej, skose wzory)" — this is correct approach. Maintain subtlety.

**Sources:**
- [ADDA: ADHD Time Blindness](https://add.org/adhd-time-blindness/)
- [Agave Health: Time Blocking with ADHD](https://www.agavehealth.com/post/why-time-blocking-feels-impossible-with-adhd-even-if-it-s-not)

---

### Pitfall 3: Recurring Block Performance Degradation

**What goes wrong:** Storing every block instance in the database causes performance degradation as data grows. Or, computing blocks on-the-fly causes slow page loads.

**Why it happens:** Taking the naive approach of either:
1. Generating all instances upfront (database bloat)
2. Computing all instances on every request (CPU overhead)

**Consequences:**
- Schedule view becomes slow over time
- Database grows unnecessarily
- Queries become expensive with many blocks
- Users with long histories experience degraded performance

**Technical Details:**
- Google Calendar uses hybrid: precompute ~1 year, generate older/future on-the-fly
- Microsoft Outlook: iCalendar RRULE + local caching
- Recommended: precompute 30-90 days, generate beyond dynamically

**Warning Signs:**
- Schedule load time increasing over weeks/months
- Database table for blocks growing rapidly
- N+1 queries when fetching blocks for date range
- Users with many blocks experiencing slow performance

**Prevention:**
- Store **block templates** (recurrence rules), not instances
- Generate visible instances on-the-fly for requested date range
- Cache generated instances (Redis or in-memory for session)
- Use memoization for recurrence calculations
- Index on date fields if storing any instances

**Implementation Pattern:**
```
TimeBlock (template):
  - name, startTime, endTime, days[], tags[]
  - generateInstancesForRange(startDate, endDate) -> instances[]

TimeBlockException (per-day override):
  - blockId, date, newStartTime?, newEndTime?, cancelled?
```

**Dopaminder-Specific:**
Existing DailyNote is aggregate root. Blocks should reference DailyNote for exceptions, not store separate instances per day.

**Sources:**
- [Apriorit: Recurring Events Calendar Development](https://www.apriorit.com/dev-blog/web-recurring-events-feature-calendar-app-development)
- [CodeGenes: Calendar Recurring Events Storage](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/)

---

### Pitfall 4: Exception Handling Complexity

**What goes wrong:** Users need per-day exceptions (different times, skip today), but implementation becomes complex state management nightmare.

**Why it happens:** Three modification scenarios create branching logic:
1. Edit this instance only
2. Edit this and all future instances
3. Edit all instances (change template)

Each requires different handling, and users don't always understand the distinction.

**Consequences:**
- Confusing UX ("Do you want to change just today or all days?")
- Data inconsistencies between template and exceptions
- Orphaned exception records
- Users give up on customization

**ADHD-Specific Impact:** Decision fatigue is a major ADHD challenge. Asking "which instances to modify?" adds cognitive load at exactly the wrong moment (when user just wants to make a quick change).

**Warning Signs:**
- Users confused by "edit series" dialogs
- Exceptions not displaying correctly
- Data inconsistency bugs
- Users avoiding modifications

**Prevention:**
- **Simplify to two options only:**
  1. "Just today" (create exception for this date)
  2. "Change the block" (modify template, affects future)
- Default to "just today" for inline schedule edits
- "Change the block" only available in Settings
- Clear visual indication when viewing an exception vs template
- Exceptions stored as sparse overrides (only store what changed)

**PROJECT.md Alignment:**
"Edycja wyjatkow blokow inline na schedule (zmiana godzin na konkretny dzien)" — this is inline exception editing. Keep it simple: inline = this day only.

**Sources:**
- [Zoom Community: Recurring Schedule Exceptions](https://community.zoom.com/t5/Zoom-Scheduler/Block-out-a-single-time-slot-from-a-recurring-schedule/td-p/193570)
- [iCalendar EXDATE standard](https://developers.google.com/workspace/calendar/api/guides/recurringevents)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or suboptimal UX.

### Pitfall 5: Planning Fallacy in Block Duration Defaults

**What goes wrong:** Default block durations are too short. Users underestimate time needs, create unrealistic schedules, then feel like failures.

**Why it happens:** Planning fallacy is universal but worse for ADHD (time blindness). Users and developers both underestimate task duration by ~40%.

**ADHD-Specific Impact:** Time optimism is an ADHD symptom. The app should compensate for this, not enable it.

**Prevention:**
- Default block minimum: 1 hour (not 30 minutes)
- AI suggests block durations based on historical task completion times
- Add automatic buffer (suggest 25% longer than user estimates)
- Show "this block is shorter than your average [category] task" warnings
- Track actual vs planned completion to improve suggestions

**Sources:**
- [Monday.com: Time Blocking Pitfalls](https://monday.com/blog/productivity/increase-your-productivity-with-time-blocking-a-step-by-step-guide/)
- [Todoist: Time Blocking Guide](https://www.todoist.com/productivity-methods/time-blocking)

---

### Pitfall 6: Tag-Block Matching Creates Rigid Categorization

**What goes wrong:** Tasks must have matching tags to fit blocks, but ADHD users often have tasks that don't fit neat categories or have multiple applicable contexts.

**Why it happens:** Clean data model (block has tags, task has tags, match = assignment) doesn't reflect messy reality of human task categorization.

**Consequences:**
- Uncategorized tasks have no blocks
- Multi-context tasks get assigned to wrong block
- Users spend time categorizing instead of doing
- System feels bureaucratic

**Prevention:**
- Tasks without tags can go in ANY block (user confirms)
- Multiple matching blocks = AI picks best fit based on time/energy
- "Flexible" pseudo-block for tasks that don't fit categories
- Easy tag assignment at planning time (not just creation time)
- AI can suggest tags during brain dump (already planned)

**PROJECT.md Note:**
"Task moze nie miec przypisanego bloku (elastyczny czasowo)" — this is the right approach. Ensure "no block" is a valid, non-penalized state.

---

### Pitfall 7: Drag-and-Drop State Management Bugs

**What goes wrong:** React drag-and-drop with calendar components has well-documented bugs: stuck drag states, duplicate events, frozen elements after drop.

**Why it happens:** Complex interaction between DnD library state and React component lifecycle. Edge cases (drop outside valid area, rapid interactions, modifier keys) cause state desync.

**Existing Risk:**
Dopaminder already uses @dnd-kit for schedule. Adding blocks as drag targets/sources increases complexity.

**Warning Signs:**
- Events/blocks "freeze" after drag
- Duplicate items appearing
- Drag state not clearing (stuck cursor)
- Different behavior on different browsers/OS

**Prevention:**
- Robust drag end handlers that reset state regardless of drop success
- Explicitly handle drops outside valid zones
- Debounce rapid drag operations
- Test on Windows + Mac (Shift+drag has known issues on Windows)
- Add "escape key cancels drag" handler
- Consider optimistic UI updates with rollback on error

**Existing Implementation:**
Check current DnD implementation in `ScheduleExpandedModal.tsx` for patterns to follow. Ensure blocks use same proven patterns.

**Sources:**
- [React Big Calendar DnD Issues](https://github.com/jquense/react-big-calendar/issues/2601)
- [FullCalendar React Duplication Bug](https://github.com/fullcalendar/fullcalendar-react/issues/118)

---

### Pitfall 8: AI Over-Automation Removes User Agency

**What goes wrong:** AI automatically assigns tasks to blocks without user confirmation, leading to unexpected scheduling and loss of user control.

**Why it happens:** Developer assumption that "smart automation = good UX." But ADHD users often need to understand and agree with scheduling decisions.

**ADHD-Specific Impact:**
- Unexpected changes trigger anxiety
- Loss of control feels disempowering
- RSD activated when AI "decides" something user disagrees with
- Trust in system erodes

**Warning Signs:**
- Users manually rearranging AI placements
- Feedback about "not understanding why X is scheduled then"
- Users turning off AI features
- Requests for "undo AI decision" functionality

**Prevention:**
- AI **suggests**, user **confirms** (already in PROJECT.md)
- Show reasoning: "Suggested for [Work] block because tagged #work"
- Easy one-tap accept/reject for each suggestion
- Batch confirmation: "Accept all" vs individual review
- User can set preference: always suggest vs auto-assign for specific tags

**PROJECT.md Alignment:**
"AI sugeruje bloki przy brain dump (user potwierdza)" and "Bloki jako hard constraints — AI sugeruje, ale user moze override" — both correct. Maintain this philosophy consistently.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable with minor effort.

### Pitfall 9: Missing Transition Time Between Blocks

**What goes wrong:** Back-to-back blocks with no gap. ADHD users struggle with task transitions, and zero-buffer scheduling sets them up for failure.

**Prevention:**
- Suggest 10-15 minute gaps between blocks by default
- Warn when creating adjacent blocks
- Or: blocks can overlap by 15 minutes (transition zone)
- "Transition time" as configurable user preference

**Sources:**
- [Asana: Time Blocking Tips](https://asana.com/resources/what-is-time-blocking)
- [Executive Function Toolkit: Time Blindness](https://executivefunctiontoolkit.com/2025/12/05/how-to-fix-time-blindness-10-strategies-that-actually-work/)

---

### Pitfall 10: Timezone and DST Edge Cases

**What goes wrong:** Block times display incorrectly during daylight saving time transitions or for users in different timezones.

**Prevention:**
- Store all times in UTC
- Convert to user timezone only for display
- Test DST transitions explicitly
- Handle "2:30 AM during spring forward" edge case (time doesn't exist)

**Sources:**
- [CodeGenes: Calendar Storage Best Practices](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/)

---

### Pitfall 11: Incomplete Mobile Responsiveness

**What goes wrong:** Block visualization works on desktop but breaks on mobile where users have less screen real estate.

**Prevention:**
- Test blocks on mobile from start
- Consider simplified mobile view (list instead of visual timeline)
- Touch-friendly controls for block modification
- Adequate tap targets (44px minimum)

---

## Phase-Specific Warnings

Based on likely implementation phases for this milestone:

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Block entity & API | #3 Performance (storage model) | Start with template model, not instances |
| Settings UI | #4 Exception complexity | Keep Settings for template only, not exceptions |
| Schedule visualization | #2 Visual complexity | Maintain subtle visual layer, test ADHD users |
| Tag matching | #6 Rigid categorization | Allow untagged tasks, flexible assignment |
| Exception editing | #4 Modification scenarios | Inline = this day only, Settings = template |
| AI integration | #8 Over-automation | Suggest, don't auto-assign |
| DnD with blocks | #7 State bugs | Follow existing DnD patterns, extensive edge case testing |

---

## Summary for Roadmap

**Top 3 Mistakes to Avoid:**

1. **Rigidity** — Build flexibility into every block feature. ADHD users need escape hatches.

2. **Visual Overwhelm** — Blocks must be subtle. Follow the "narrow strips, patterns" approach already planned.

3. **Complexity Creep** — Each feature (exceptions, matching, AI) must stay simple. When in doubt, remove options.

**Key Design Principles:**

- Blocks are **suggestions**, not constraints
- Inline edits affect **today only**, Settings affects **template**
- AI **recommends**, user **confirms**
- Tasks **can** exist without blocks
- Visual design is **subtle**, not prominent

---

## Sources Summary

### Primary Sources (HIGH confidence)
- [FlowSavvy: Why Time-Blocking Systems Fail](https://flowsavvy.app/why-most-time-blocking-systems-fail)
- [Apriorit: Recurring Events Calendar Development](https://www.apriorit.com/dev-blog/web-recurring-events-feature-calendar-app-development)
- [CodeGenes: Calendar Storage Best Practices](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/)

### ADHD-Specific Sources (HIGH confidence)
- [ADDitude Magazine: ADHD Time Management](https://www.additudemag.com/time-management-skills-adhd-brain/)
- [ADDA: ADHD Paralysis](https://add.org/adhd-paralysis/)
- [Healthline: Time Blocking with ADHD](https://www.healthline.com/health/adhd/how-to-time-block-with-adhd)
- [AuDHD Psychiatry: ADHD Task Paralysis](https://www.audhdpsychiatry.co.uk/how-to-deal-with-task-paralysis/)

### Implementation Pattern Sources (MEDIUM confidence)
- [React Big Calendar DnD Issues](https://github.com/jquense/react-big-calendar/issues/2601)
- [Google Calendar Recurring Events](https://developers.google.com/workspace/calendar/api/guides/recurringevents)

### Productivity Method Sources (MEDIUM confidence)
- [Sunsama: Time Blocking 101](https://www.sunsama.com/blog/time-blocking)
- [Todoist: Time Blocking Guide](https://www.todoist.com/productivity-methods/time-blocking)
- [Asana: Time Blocking Tips](https://asana.com/resources/what-is-time-blocking)
