<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\RecurringTask;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
use App\Repository\RecurringTaskRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;

class RecurringSyncService
{
    public function __construct(
        private readonly RecurringTaskRepository $recurringTaskRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TaskRepository $taskRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly RecurrenceService $recurrenceService,
    ) {
    }

    /**
     * Generate tasks from recurring task definitions for a specific date.
     *
     * @return Task[] Array of generated tasks
     */
    public function syncForDate(\DateTimeInterface $date, ?User $user = null): array
    {
        $generatedTasks = [];
        $recurringTasks = $this->recurringTaskRepository->findDueForGeneration($date, $user);

        foreach ($recurringTasks as $recurringTask) {
            if ($this->shouldGenerateForDate($recurringTask, $date)) {
                $task = $this->generateTask($recurringTask, $date);
                if ($task !== null) {
                    $generatedTasks[] = $task;
                    $recurringTask->setLastGeneratedDate(clone $date);
                }
            }
        }

        $this->entityManager->flush();

        return $generatedTasks;
    }

    /**
     * Check if a recurring task should generate a task for the given date.
     */
    public function shouldGenerateForDate(RecurringTask $recurringTask, \DateTimeInterface $date): bool
    {
        // Check if date is within valid range
        if ($date < $recurringTask->getStartDate()) {
            return false;
        }

        $endDate = $recurringTask->getEndDate();
        if ($endDate !== null && $date > $endDate) {
            return false;
        }

        // Check if already generated for this date
        $lastGenerated = $recurringTask->getLastGeneratedDate();
        if ($lastGenerated !== null && $date->format('Y-m-d') <= $lastGenerated->format('Y-m-d')) {
            return false;
        }

        // Don't generate if there's still an incomplete task for this recurring task
        if ($this->taskRepository->hasIncompleteTaskForRecurring($recurringTask)) {
            return false;
        }

        // Check recurrence pattern using RecurrenceService
        return $this->recurrenceService->matchesPattern($recurringTask, $date);
    }

    /**
     * Generate a task from a recurring task definition.
     */
    public function generateTask(RecurringTask $recurringTask, \DateTimeInterface $date): ?Task
    {
        $user = $recurringTask->getUser();
        if ($user === null) {
            return null;
        }

        // Check if a task already exists for this recurring task and date
        $existingTask = $this->taskRepository->findByRecurringTaskAndDate($recurringTask, $date);
        if ($existingTask !== null) {
            return null; // Don't create duplicate
        }

        // Find or create the DailyNote for this user and date
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate(clone $date);
            $this->entityManager->persist($dailyNote);
        }

        // Create the task
        $task = new Task();
        $task->setTitle($recurringTask->getTitle());
        $task->setCategory($recurringTask->getCategory());
        $task->setRecurringTask($recurringTask);

        // Set optional fields
        if ($recurringTask->getEstimatedMinutes() !== null) {
            $task->setEstimatedMinutes($recurringTask->getEstimatedMinutes());
        }

        if ($recurringTask->getFixedTime() !== null) {
            $task->setFixedTime($recurringTask->getFixedTime());
        }

        // Add task to the daily note
        $dailyNote->addTask($task);
        $this->entityManager->persist($task);

        return $task;
    }

    /**
     * Delete all future generated tasks for a recurring task.
     */
    public function deleteFutureGeneratedTasks(RecurringTask $recurringTask, \DateTimeInterface $fromDate): int
    {
        $tasks = $this->recurringTaskRepository->findFutureGeneratedTasks($recurringTask, $fromDate);
        $count = count($tasks);

        foreach ($tasks as $task) {
            $this->entityManager->remove($task);
        }

        return $count;
    }
}
