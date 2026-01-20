# Phase 5: Task-Block Matching - Research

**Researched:** 2026-01-20
**Domain:** Tag-based task scheduling with TimeBlock constraints
**Confidence:** HIGH

## Summary

Phase 5 implements the core value proposition of TimeBlocks: automatically suggesting and placing tasks into appropriate time blocks based on shared tags. The system uses a tag-based matching approach where Tasks and TimeBlocks share common Tags, enabling the AI and planning system to suggest optimal block placement.

The architecture is straightforward: both Task and TimeBlock already have ManyToMany relationships with Tag (implemented in Phase 1). The "first available block" algorithm is a simple time-based filter that finds the earliest block matching a task's tags that has not ended. AI integration extends the existing BrainDumpAnalyzer prompt to include time block context and suggest block assignments.

**Primary recommendation:** Implement matching logic as a dedicated service (TaskBlockMatchingService) with three responsibilities: (1) find matching blocks for a task, (2) suggest the first available block for scheduling, and (3) provide block context to AI prompts.

## Standard Stack

The phase uses existing technology - no new libraries required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Doctrine ORM | 3.x | Entity relationships, queries | Already in use for Task/TimeBlock/Tag |
| Symfony 7.4 | 7.4 | Services, controllers | Existing backend framework |
| OpenAI API | gpt-4o-mini | AI suggestions | Already integrated in BrainDumpAnalyzer |
| Redux Toolkit | 2.x | Frontend state management | Existing planningSlice pattern |
| React | 19 | UI components | Existing frontend framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Twig | 3.x | Prompt templates | Modify brain_dump_analysis prompts |
| i18next | 24.x | Translations | New UI strings for block suggestions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tag matching | AI semantic matching | Tag matching is deterministic, simpler, already has data |
| First available | Capacity-based | First available is simpler, capacity needs utilization tracking |
| Service class | Repository method | Service can combine multiple concerns (matching, availability) |

**Installation:**
```bash
# No new packages needed - all dependencies exist
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── Service/
│   └── TaskBlockMatchingService.php  # NEW: Tag matching + availability logic
├── Controller/
│   └── PlanningController.php        # MODIFY: Add timeBlocks to response
templates/prompts/
├── brain_dump_analysis_en.twig       # MODIFY: Add block suggestion
├── brain_dump_analysis_pl.twig       # MODIFY: Add block suggestion
├── schedule_optimization_en.twig     # MODIFY: Add block constraints
└── schedule_optimization_pl.twig     # MODIFY: Add block constraints

frontend/src/
├── store/
│   └── planningSlice.ts              # MODIFY: Add block suggestion state
├── components/
│   ├── schedule/
│   │   └── TaskBlock.tsx             # MODIFY: Add block indicator
│   └── planning/
│       └── BlockSuggestionStep.tsx   # NEW: User confirmation UI
└── types/
    └── index.ts                      # MODIFY: Add suggestedBlockId to Task
```

### Pattern 1: Tag-Based Matching Service
**What:** Centralized service for computing task-block compatibility
**When to use:** Any code needing to know which blocks match a task
**Example:**
```php
// Source: New service following existing TimeBlockService pattern
class TaskBlockMatchingService
{
    public function findMatchingBlocks(Task $task, array $activeBlocks): array
    {
        $taskTagIds = $task->getTags()->map(fn($t) => $t->getId())->toArray();
        if (empty($taskTagIds)) {
            return []; // Tasks without tags have no matching blocks
        }

        return array_filter($activeBlocks, function ($block) use ($taskTagIds) {
            foreach ($block['tags'] as $tag) {
                if (in_array($tag['id'], $taskTagIds, true)) {
                    return true; // At least one tag matches
                }
            }
            return false;
        });
    }

    public function findFirstAvailableBlock(
        Task $task,
        array $activeBlocks,
        \DateTimeInterface $currentTime
    ): ?array {
        $matching = $this->findMatchingBlocks($task, $activeBlocks);

        // Sort by start time
        usort($matching, fn($a, $b) => $a['startTime'] <=> $b['startTime']);

        $currentTimeStr = $currentTime->format('H:i');

        foreach ($matching as $block) {
            // Block hasn't ended yet (or hasn't started)
            if ($block['endTime'] > $currentTimeStr) {
                return $block;
            }
        }

        return null; // No available matching block
    }
}
```

### Pattern 2: AI Prompt Enhancement for Block Suggestion
**What:** Include time block context in brain dump analysis
**When to use:** When AI analyzes brain dump to extract tasks
**Example:**
```twig
{# Source: Extend brain_dump_analysis_en.twig #}

USER'S TIME BLOCKS FOR TODAY:
{% if time_blocks|length > 0 %}
{% for block in time_blocks %}
- {{ block.name }} ({{ block.startTime }} - {{ block.endTime }}): tags [{{ block.tags|join(', ') }}]
{% endfor %}
{% else %}
(No time blocks configured)
{% endif %}

TASK OUTPUT FORMAT:
{
  "tasks": {
    "today": [
      {
        "title": "...",
        "suggestedBlockId": 123,  // ID of matching block, or null
        "suggestedBlockName": "Work"  // Name for display, or null
      }
    ],
    ...
  }
}

BLOCK SUGGESTION RULES:
- If a task's context suggests it belongs to a time block (e.g., "work on report" matches "Work" block with "work" tag), suggest that block
- Use tag matching: if the task relates to tags associated with a block, suggest it
- If no clear match, leave suggestedBlockId as null
- User will confirm or reject the suggestion
```

### Pattern 3: Visual Task-Block Association
**What:** Subtle visual indicator showing task belongs to a block
**When to use:** Tasks displayed in schedule view
**Example:**
```tsx
// Source: Extend existing TaskBlock.tsx pattern
interface TaskBlockProps {
  task: Task;
  matchingBlock?: TimeBlock | null; // NEW: associated block
  // ... existing props
}

// Visual: small colored dot or border matching block color
{matchingBlock && (
  <div
    className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
    style={{ backgroundColor: matchingBlock.color }}
    title={matchingBlock.name}
  />
)}
```

### Anti-Patterns to Avoid
- **Complex matching algorithms:** Don't try semantic matching or AI-based tag suggestions. Use simple tag ID comparison.
- **Hard constraints:** Don't prevent tasks from being scheduled outside blocks. Blocks are suggestions, not requirements.
- **Automatic assignment without confirmation:** Always show user the suggestion, let them accept/reject.
- **Overloading Task entity:** Don't add blockId to Task entity. The match is computed dynamically from tags.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time comparison | Custom time parsing | DateTimeInterface comparison | Edge cases, timezone handling |
| Tag intersection | Manual array loops | array_intersect with IDs | PHP native, optimized |
| Block availability | Custom scheduling algorithm | Simple time filter | "First available" is trivial |
| AI prompts | Complex prompt engineering | Extend existing Twig templates | Consistent patterns |

**Key insight:** The tag-based matching is intentionally simple. Tasks share tags with blocks - find intersection, filter by time. No ML, no complex algorithms.

## Common Pitfalls

### Pitfall 1: Over-Engineering the Matching
**What goes wrong:** Building complex algorithms for matching when simple tag intersection suffices
**Why it happens:** Temptation to add semantic matching, ML, priority weighting
**How to avoid:** Start with exact tag ID matching. Add complexity only if users request it.
**Warning signs:** Discussing "smart" matching, context analysis, or weighted tags

### Pitfall 2: Making Blocks Mandatory
**What goes wrong:** Preventing task scheduling without a matching block
**Why it happens:** Misunderstanding requirement REQ-023 (tasks without blocks allowed)
**How to avoid:** Always allow null/no block. Block suggestions are optional.
**Warning signs:** Validation errors for tasks without tags, required block selection

### Pitfall 3: Modifying Task Entity for Block Association
**What goes wrong:** Adding suggestedBlockId column to tasks table
**Why it happens:** Wanting to persist the AI suggestion
**How to avoid:** Block association is computed from tags, not stored. suggestedBlockId only exists in AI response, not database.
**Warning signs:** Migrations adding block_id to tasks, ORM relationships between Task and TimeBlock

### Pitfall 4: Ignoring Block End Time
**What goes wrong:** Suggesting blocks that have already ended
**Why it happens:** Not considering current time in "first available" logic
**How to avoid:** Always filter by currentTime < blockEndTime before suggesting
**Warning signs:** Suggesting past blocks, schedule placing tasks in finished blocks

### Pitfall 5: Missing Polish Translations
**What goes wrong:** New UI strings only in English
**Why it happens:** Forgetting the app is bilingual
**How to avoid:** Add translations to both en.json and pl.json for every new string
**Warning signs:** Untranslated text appearing in UI

## Code Examples

Verified patterns from existing codebase:

### Tag Retrieval from Task (Existing Pattern)
```php
// Source: backend/src/Facade/BrainDumpFacade.php:326-330
'tags' => array_map(fn ($tag) => [
    'id' => $tag->getId(),
    'name' => $tag->getName(),
    'color' => $tag->getColor(),
], $task->getTags()->toArray()),
```

### TimeBlock Serialization (Existing Pattern)
```php
// Source: backend/src/Service/TimeBlockService.php:69-89
$tags = array_map(fn ($tag) => [
    'id' => $tag->getId(),
    'name' => $tag->getName(),
    'color' => $tag->getColor(),
], $block->getTags()->toArray());

$result[] = [
    'id' => $blockId,
    'name' => $block->getName(),
    'color' => $block->getColor(),
    'startTime' => $effectiveStartTime,
    'endTime' => $effectiveEndTime,
    // ... other fields
    'tags' => $tags,
];
```

### AI Prompt Context (Existing Pattern)
```twig
{# Source: backend/templates/prompts/schedule_optimization_en.twig #}
FIXED EVENTS (cannot be moved):
{% if events|length > 0 %}
{% for event in events %}
- {{ event.title }}: {{ event.startTime }}{% if event.endTime %} - {{ event.endTime }}{% endif %}
{% endfor %}
{% else %}
(No events scheduled)
{% endif %}
```

### Task Type with Tags (Existing Pattern)
```typescript
// Source: frontend/src/types/index.ts:44-64
export interface Task {
  id?: number;
  title: string;
  // ... other fields
  tags?: Tag[];
}
```

### Planning Response Structure (Existing Pattern)
```php
// Source: backend/src/Controller/PlanningController.php:67-87
return $this->json([
    'tasks' => array_map(fn ($task) => [
        'id' => $task->getId(),
        'title' => $task->getTitle(),
        // ... fields
    ], $unplannedTasks),
    'conflictingTasks' => $conflictingTasksData,
    'events' => array_map(fn ($event) => [
        // ... event data
    ], $events),
]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual task assignment | AI suggestion with user confirmation | This phase | User retains control, AI assists |
| No block-task relationship | Tag-based dynamic matching | This phase | Flexible, no schema changes |

**Deprecated/outdated:**
- N/A - This is new functionality

## Open Questions

Things that couldn't be fully resolved:

1. **Should AI suggest tags for new tasks?**
   - What we know: AI can see available tags and time blocks
   - What's unclear: Should AI also suggest which tags to add to a task?
   - Recommendation: Out of scope for Phase 5. Focus on matching existing tags. Tag suggestion is a V2 feature.

2. **Block overlap with task time**
   - What we know: "First available" finds a block that hasn't ended
   - What's unclear: Should the task's estimated duration fit within the block's remaining time?
   - Recommendation: Keep it simple for V1. Don't check capacity. Block is a suggestion, not a constraint. Users can override.

3. **Multiple matching blocks**
   - What we know: A task can match multiple blocks (via different tags)
   - What's unclear: Should we show all matches or just the first available?
   - Recommendation: Show first available in the suggestion, but UI could show alternatives. Start with simple first-available.

## Sources

### Primary (HIGH confidence)
- `/home/kamil/Code/dumpday/backend/src/Entity/Task.php` - Task entity with tags relationship
- `/home/kamil/Code/dumpday/backend/src/Entity/TimeBlock.php` - TimeBlock entity with tags relationship
- `/home/kamil/Code/dumpday/backend/src/Service/TimeBlockService.php` - Block availability logic
- `/home/kamil/Code/dumpday/backend/src/Service/BrainDumpAnalyzer.php` - AI integration pattern
- `/home/kamil/Code/dumpday/backend/templates/prompts/brain_dump_analysis_en.twig` - Prompt structure
- `/home/kamil/Code/dumpday/backend/src/Controller/PlanningController.php` - Planning API pattern
- `/home/kamil/Code/dumpday/frontend/src/store/planningSlice.ts` - Frontend planning state
- `/home/kamil/Code/dumpday/.planning/REQUIREMENTS.md` - REQ-022 through REQ-026

### Secondary (MEDIUM confidence)
- Existing codebase patterns for service classes, controllers, and Redux slices

### Tertiary (LOW confidence)
- N/A - All findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, using existing patterns
- Architecture: HIGH - Extends existing services and prompts
- Pitfalls: HIGH - Based on requirements and codebase analysis

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable domain, no external dependencies)

---

## Implementation Guidance for Planner

### Plan 1: Backend Matching Service & API
- Create TaskBlockMatchingService with findMatchingBlocks() and findFirstAvailableBlock()
- Modify PlanningController.getTasks() to include timeBlocks in response
- Include matching block info in task serialization

### Plan 2: AI Prompt Enhancement
- Modify brain_dump_analysis prompts to include time blocks context
- Add suggestedBlockId and suggestedBlockName to AI response format
- Modify TaskExtractor to parse and pass through block suggestions
- Modify BrainDumpFacade to provide time blocks to analyzer

### Plan 3: Frontend UI
- Add BlockSuggestionStep to planning flow (or integrate into existing steps)
- Add visual indicator to TaskBlock component
- Add i18n translations (en/pl)
- Modify planningSlice for block suggestion state
