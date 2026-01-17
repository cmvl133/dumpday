<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Event;
use App\Entity\Task;

class TaskEventConflictResolver
{
    /**
     * Find tasks with fixedTime that conflict with events on the same day.
     * Returns array of tasks with their conflicting event info.
     *
     * @param Task[] $tasks Tasks to check for conflicts
     * @param Event[] $events Events to check against
     * @return array<array{task: Task, conflictingEvent: Event}>
     */
    public function findConflictingTasks(array $tasks, array $events): array
    {
        $conflicts = [];

        foreach ($tasks as $task) {
            if ($task->getFixedTime() === null) {
                continue;
            }

            // Skip completed tasks
            if ($task->isCompleted()) {
                continue;
            }

            // Check against all events
            foreach ($events as $event) {
                if ($this->taskConflictsWithEvent($task, $event)) {
                    $conflicts[] = [
                        'task' => $task,
                        'conflictingEvent' => $event,
                    ];
                    break; // One conflict is enough to flag the task
                }
            }
        }

        return $conflicts;
    }

    /**
     * Check if a specific task conflicts with a specific event.
     */
    public function taskConflictsWithEvent(Task $task, Event $event): bool
    {
        $taskStart = $task->getFixedTime();
        $eventStart = $event->getStartTime();

        if ($taskStart === null || $eventStart === null) {
            return false;
        }

        $taskStartMinutes = $this->timeToMinutes($taskStart);
        $taskDuration = $task->getEstimatedMinutes() ?? 30;
        $taskEndMinutes = $taskStartMinutes + $taskDuration;

        $eventStartMinutes = $this->timeToMinutes($eventStart);
        $eventEnd = $event->getEndTime();
        $eventEndMinutes = $eventEnd !== null
            ? $this->timeToMinutes($eventEnd)
            : $eventStartMinutes + 60; // Default 1 hour

        // Overlap: task starts before event ends AND task ends after event starts
        return $taskStartMinutes < $eventEndMinutes && $taskEndMinutes > $eventStartMinutes;
    }

    private function timeToMinutes(\DateTimeInterface $time): int
    {
        return (int) $time->format('H') * 60 + (int) $time->format('i');
    }
}
