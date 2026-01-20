<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\Task;
use App\Enum\TaskCategory;

/**
 * Extracts Task entities from AI brain dump analysis response.
 *
 * Note: The AI response may include suggestedBlockId and suggestedBlockName fields
 * for "today" and "scheduled" tasks. These suggest which TimeBlock a task might
 * belong to based on block names and tags. However, these suggestions are NOT
 * stored in the Task entity - they're passed through to the frontend in the
 * analyze preview response for user acceptance/rejection. The actual block-task
 * association is computed dynamically based on tag matching, not persisted.
 *
 * @see BrainDumpFacade::analyze() - returns AI response with suggestions to frontend
 * @see TimeBlockService::getActiveBlocksForDate() - provides blocks to AI for context
 */
class TaskExtractor
{
    /**
     * Extract Task entities from AI response.
     *
     * Note: suggestedBlockId/suggestedBlockName from AI response are intentionally
     * not extracted here - they flow directly to frontend for preview display.
     *
     * @return Task[]
     */
    public function extract(array $aiResponse, DailyNote $dailyNote): array
    {
        $tasks = [];

        foreach ($aiResponse['tasks']['today'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::TODAY);
            $task->setDailyNote($dailyNote);
            $tasks[] = $task;
        }

        foreach ($aiResponse['tasks']['scheduled'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::SCHEDULED);
            $task->setDailyNote($dailyNote);

            if (isset($item['dueDate'])) {
                try {
                    $dueDate = new \DateTime($item['dueDate']);
                    $task->setDueDate($dueDate);
                } catch (\Exception) {
                    // Invalid date, skip setting it
                }
            }

            $tasks[] = $task;
        }

        foreach ($aiResponse['tasks']['someday'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::SOMEDAY);
            $task->setDailyNote($dailyNote);
            $tasks[] = $task;
        }

        return $tasks;
    }
}
