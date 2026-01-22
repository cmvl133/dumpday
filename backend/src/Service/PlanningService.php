<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Task;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service for planning mode operations.
 * Handles task queries, planning field updates, and schedule acceptance.
 */
class PlanningService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
        private readonly EventRepository $eventRepository,
        private readonly TimeBlockService $timeBlockService,
        private readonly TaskBlockMatchingService $taskBlockMatchingService,
        private readonly TaskEventConflictResolver $conflictResolver,
    ) {
    }

    /**
     * Get all data needed for planning mode.
     *
     * Returns raw entities and arrays for controller to serialize with
     * planning-specific fields (hasConflict, conflictingEvent, matchingBlock).
     *
     * @return array{
     *     unplannedTasks: Task[],
     *     plannedTasks: Task[],
     *     events: \App\Entity\Event[],
     *     activeBlocks: array<array<string, mixed>>,
     *     conflicts: array<array{task: Task, conflictingEvent: \App\Entity\Event}>
     * }
     */
    public function getTasksForPlanning(User $user, \DateTimeInterface $date): array
    {
        $unplannedTasks = $this->taskRepository->findUnplannedTasksForToday($user, $date);
        $plannedTasks = $this->taskRepository->findPlannedTasksForToday($user, $date);
        $events = $this->eventRepository->findByUserAndDate($user, $date);
        $activeBlocks = $this->timeBlockService->getActiveBlocksForDate($user, $date);
        $conflicts = $this->conflictResolver->findConflictingTasks($plannedTasks, $events);

        return [
            'unplannedTasks' => $unplannedTasks,
            'plannedTasks' => $plannedTasks,
            'events' => $events,
            'activeBlocks' => $activeBlocks,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Update planning-specific fields on a task using PATCH semantics.
     *
     * Only updates fields that are present in the data array (array_key_exists).
     * This allows explicit null values to clear fields.
     *
     * @param Task $task The task to update
     * @param array<string, mixed> $data Planning field data
     * @return Task The updated task
     */
    public function updatePlanningFields(Task $task, array $data): Task
    {
        if (array_key_exists('estimatedMinutes', $data)) {
            $task->setEstimatedMinutes(
                $data['estimatedMinutes'] !== null ? (int) $data['estimatedMinutes'] : null
            );
        }

        if (array_key_exists('fixedTime', $data)) {
            if ($data['fixedTime'] === null || $data['fixedTime'] === '') {
                $task->setFixedTime(null);
            } else {
                $task->setFixedTime(new \DateTimeImmutable($data['fixedTime']));
            }
        }

        if (array_key_exists('canCombineWithEvents', $data)) {
            $task->setCanCombineWithEvents($data['canCombineWithEvents']);
        }

        if (array_key_exists('needsFullFocus', $data)) {
            $task->setNeedsFullFocus((bool) $data['needsFullFocus']);
        }

        $this->entityManager->flush();

        return $task;
    }

    /**
     * Accept a generated schedule and apply it to tasks.
     *
     * Processes an array of schedule items, updating each task with:
     * - fixedTime from suggestedTime
     * - dueDate to today if overdue
     * - estimatedMinutes from duration
     * - combinedWithEventId added to canCombineWithEvents array
     *
     * Flushes once at the end for atomic operation.
     *
     * @param User $user The user accepting the schedule
     * @param array<array{taskId: int, suggestedTime?: string, duration?: int, combinedWithEventId?: int}> $scheduleItems
     */
    public function acceptSchedule(User $user, array $scheduleItems): void
    {
        $today = new \DateTime('today');

        foreach ($scheduleItems as $item) {
            $task = $this->taskRepository->find($item['taskId']);

            // Skip if task not found or not owned by user
            if ($task === null || $task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
                continue;
            }

            // Set fixed time from suggested time
            if (!empty($item['suggestedTime'])) {
                $task->setFixedTime(new \DateTimeImmutable($item['suggestedTime']));
            }

            // Update dueDate to today for overdue tasks
            $taskDueDate = $task->getDueDate();
            if ($taskDueDate !== null && $taskDueDate < $today) {
                $task->setDueDate($today);
            }

            // Set estimated minutes from duration
            if (isset($item['duration'])) {
                $task->setEstimatedMinutes((int) $item['duration']);
            }

            // Add combined event ID to canCombineWithEvents array
            if (isset($item['combinedWithEventId'])) {
                $currentCombine = $task->getCanCombineWithEvents() ?? [];
                if (!in_array($item['combinedWithEventId'], $currentCombine, true)) {
                    $currentCombine[] = $item['combinedWithEventId'];
                    $task->setCanCombineWithEvents($currentCombine);
                }
            }
        }

        $this->entityManager->flush();
    }
}
