# Feature Landscape: Time Blocking

**Domain:** Time blocking for ADHD planning app (Dopaminder)
**Researched:** 2026-01-20
**Focus:** Time blocks as contextual containers, not general task management

## Table Stakes

Features users expect from time blocking. Missing = feature feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Visual block display on schedule** | Core UX - users need to see their time blocks as distinct regions | Low | All apps (Sunsama, Motion, Reclaim) show blocks visually. Must be distinguishable from events/tasks |
| **Create/edit blocks with start/end time** | Basic CRUD functionality | Low | Minimum viable interaction |
| **Block name/label** | Users need to identify what each block represents | Low | "Work", "Family", "Deep Focus", etc. |
| **Color coding per block type** | Visual differentiation is universal in calendar apps | Low | Google Calendar, Clockwise, all competitors use color |
| **Recurring blocks (daily/weekly schedule)** | Time blocking loses value without recurring patterns | Medium | Sunsama, Reclaim, Clockwise all have recurring blocks. Core to "ideal week" concept |
| **Edit single occurrence (exceptions)** | Real life requires flexibility - meetings, sick days, etc. | Medium | "This Tuesday my work block starts at 10am instead of 9am" |
| **Delete single occurrence** | Skip a block on holiday, etc. | Low | Linked to exceptions handling |
| **Block duration visible** | Users must know how long each block lasts | Low | Either implicit (visual) or explicit (label) |

## Differentiators

Features that set product apart. Not expected but valued, especially for ADHD users.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Tag-based task matching** | Auto-suggest which block a task belongs to based on tags | Medium | Sunsama users request this (roadmap.sunsama.com). Not common yet. **Aligns with user's requirements** |
| **AI block suggestion for new tasks** | Reduces cognitive load - AI says "this looks like a work task" | Medium | Motion does this at task level. Applying to blocks is novel. **Requested by user** |
| **Buffer time between blocks** | ADHD brains need transition time | Low | Reclaim has explicit buffer feature. Critical for ADHD |
| **Energy-based block types** | High/medium/low energy blocks, not just contexts | Low | Research shows energy-based scheduling works better for ADHD |
| **Block utilization stats** | "You only used 60% of your work block" - awareness building | Medium | Reclaim, Clockwise have analytics. Helps ADHD users understand their patterns |
| **Flexible blocks (soft constraints)** | AI suggests but user can override | Low | **Already in user requirements** - blocks guide, don't dictate |
| **Tasks without blocks allowed** | Not everything fits a context | Low | **Already in user requirements** - critical for flexibility |
| **Visual distinction (patterns/stripes)** | Different visual treatment than events/tasks | Low | **In user requirements** - "skosne wzory" (diagonal patterns) |
| **Inline exception editing** | Change block timing directly on schedule view | Medium | **In user requirements** - fast UX without settings navigation |
| **"Playlist mode" alternative** | Some days don't need rigid blocks | Medium | Sunsama offers this. Good for ADHD low-structure days |
| **Warning when overcommitting a block** | "You've scheduled 6 hours of tasks in a 4 hour block" | Low | Sunsama has workload warnings. Prevents ADHD optimism bias |
| **Block hover preview** | See block details without clicking | Low | **In user requirements** - quick info access |

## Anti-Features

Features to explicitly NOT build. Common mistakes in time blocking apps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Overlapping blocks** | Cognitive overload, decision paralysis | Max 1 block at a time. **Already in scope exclusion** |
| **Minute-level block precision** | False precision, anxiety-inducing | 15-30 minute increments. Round to manageable units |
| **Mandatory block assignment** | Kills flexibility, user resistance | Tasks CAN have no block. **Already in requirements** |
| **Complex block rules/dependencies** | Feature bloat, rarely used | Keep it simple: time + recurring pattern |
| **Automatic block creation from events** | Confuses blocks vs events semantically | Blocks are user-defined contexts, not derived. **Already excluded** |
| **Rigid scheduling (hard constraints)** | ADHD users need flexibility | AI suggests, user confirms. **Already in requirements** |
| **Too many block types** | Decision fatigue | Recommend 3-5 block types max in UX |
| **Block notifications/alarms** | Overwhelming for ADHD | Let existing task/event notifications handle this |
| **Shared/team blocks** | Out of scope for personal ADHD app | Keep it individual |
| **Block templates marketplace** | Premature optimization | Maybe v2, not MVP |

## ADHD-Specific Considerations

Research shows ADHD users need:

| Need | How Time Blocks Address It | Implementation Note |
|------|---------------------------|---------------------|
| **Reduced decision fatigue** | Pre-planned blocks eliminate "what should I do now?" | AI suggestions amplify this benefit |
| **Visual structure** | Blocks create visible day architecture | Color coding + patterns essential |
| **Time blindness mitigation** | Blocks make time concrete and visible | Show duration prominently |
| **Transition support** | Buffer time between contexts | Build in 5-15 min buffers by default |
| **Flexibility without chaos** | Soft constraints, not rigid rules | Always allow override |
| **Context batching** | Group similar tasks to reduce switching | Tag-based matching enables this |
| **Realistic planning** | Overcommitment warnings | Compare scheduled vs block capacity |
| **Low cognitive load** | Simple system, few rules | Max 5 block types, simple recurring patterns |

Sources:
- [Akiflow - ADHD Time Blocking Apps](https://akiflow.com/blog/adhd-time-management-apps)
- [Tiimo - Time Blocking for ADHD](https://www.tiimoapp.com/resource-hub/time-blocking-productivity)
- [Life Skills Advocate - Time Blocking for ADHD](https://lifeskillsadvocate.com/blog/time-blocking-for-adhd/)

## Feature Dependencies

```
Block CRUD (table stakes)
    |
    +-- Recurring blocks
    |       |
    |       +-- Exception editing
    |
    +-- Tag association
    |       |
    |       +-- Task-block matching
    |               |
    |               +-- AI block suggestion
    |
    +-- Visual display on schedule
            |
            +-- Block hover preview
            +-- Inline exception editing
```

## MVP Recommendation

For MVP, prioritize:

1. **Block entity with CRUD** - name, color, start_time, end_time
2. **Recurring schedule in settings** - day-of-week + times
3. **Visual display on schedule** - colored regions with diagonal pattern
4. **Tag association** - link blocks to existing tags
5. **Task matching based on tags** - auto-suggest block for tasks
6. **Exception editing** - change single occurrence inline
7. **Hover preview** - block name + edit option

Defer to post-MVP:
- AI block suggestion at brain dump (requires prompt engineering)
- Block utilization stats (analytics feature)
- Buffer time configuration (use default 15min first)
- Energy-based block types (can add as tag convention first)
- Overcommitment warnings (needs capacity calculation)

## Competitor Feature Matrix

| Feature | Sunsama | Reclaim | Motion | Clockwise | Dopaminder Target |
|---------|---------|---------|--------|-----------|-------------------|
| Visual blocks | Yes | Yes | Yes | Yes | Yes |
| Recurring blocks | Yes | Yes | Yes | Yes | Yes |
| Exception editing | Yes | Yes | Yes | Limited | Yes |
| Tag-based matching | Requested | No | No | No | **Yes (differentiator)** |
| AI suggestion | Coming 2026 | Partial | Yes | No | Yes |
| Buffer time | Manual | Yes | Yes | Yes | Later |
| ADHD-specific UX | Partial | No | No | No | **Yes (core)** |
| Soft constraints | Yes | Yes | Yes | No | Yes |
| Energy-based | No | No | No | No | Later |

## Sources

- [Sunsama Time Blocking Guide](https://www.sunsama.com/blog/time-blocking)
- [Sunsama Timeboxing Documentation](https://help.sunsama.com/docs/timeboxing)
- [Sunsama Roadmap - Time Slots Feature Request](https://roadmap.sunsama.com/improvements/p/time-slots-visualized-blocks-of-time-to-schedule-timebox-multiple-tasks-into)
- [Reclaim Time Blocking Guide 2026](https://reclaim.ai/blog/time-blocking-guide)
- [Reclaim Use Cases](https://reclaim.ai/use-cases)
- [Motion AI Task Manager](https://www.usemotion.com/features/ai-task-manager)
- [Clockwise Focus Time](https://www.getclockwise.com/focus-time)
- [Zapier - Best Time Blocking Apps 2026](https://zapier.com/blog/best-time-blocking-app/)
- [Todoist Time Blocking Guide](https://www.todoist.com/productivity-methods/time-blocking)
- [Asana Time Blocking Tips](https://asana.com/resources/what-is-time-blocking)
