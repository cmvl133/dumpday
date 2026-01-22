<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\Request\TaskCreateRequest;
use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\TaskCategory;
use App\Repository\DailyNoteRepository;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service for all task business logic.
 * Handles CRUD, completion, and tag management operations.
 */
class TaskService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TagRepository $tagRepository,
        private readonly RecurrenceService $recurrenceService,
        private readonly RecurringSyncService $recurringSyncService,
    ) {
    }

    /**
     * Find a task by ID, verifying user ownership via DailyNote.
     */
    public function findByIdAndUser(int $id, User $user): ?Task
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return null;
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return null;
        }

        return $task;
    }

    /**
     * Create a new task from a validated request.
     */
    public function create(User $user, TaskCreateRequest $request): Task
    {
        $date = new \DateTime($request->date);
        $dailyNote = $this->getOrCreateDailyNote($user, $date);

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDailyNote($dailyNote);

        if ($request->category !== null && TaskCategory::tryFrom($request->category) !== null) {
            $task->setCategory(TaskCategory::from($request->category));
        }

        if ($request->dueDate !== null) {
            $task->setDueDate(new \DateTime($request->dueDate));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $task;
    }

    /**
     * Update a task using PATCH semantics.
     * Uses array_key_exists() to distinguish between "set to null" and "don't change".
     *
     * @param array<string, mixed> $data
     */
    public function update(Task $task, array $data): TaskUpdateResult
    {
        $generatedNextTask = null;

        if (array_key_exists('isCompleted', $data)) {
            $generatedNextTask = $this->handleCompletion($task, (bool) $data['isCompleted']);
        }

        if (array_key_exists('title', $data)) {
            $task->setTitle((string) $data['title']);
        }

        if (array_key_exists('dueDate', $data)) {
            $task->setDueDate($this->parseNullableDate($data['dueDate']));
        }

        if (array_key_exists('reminderTime', $data)) {
            $task->setReminderTime($this->parseNullableDateTimeImmutable($data['reminderTime']));
        }

        if (array_key_exists('estimatedMinutes', $data)) {
            $task->setEstimatedMinutes($data['estimatedMinutes'] !== null ? (int) $data['estimatedMinutes'] : null);
        }

        if (array_key_exists('fixedTime', $data)) {
            $task->setFixedTime($this->parseNullableDateTimeImmutable($data['fixedTime']));
        }

        if (array_key_exists('canCombineWithEvents', $data)) {
            $task->setCanCombineWithEvents($data['canCombineWithEvents']);
        }

        if (array_key_exists('needsFullFocus', $data)) {
            $task->setNeedsFullFocus((bool) $data['needsFullFocus']);
        }

        $this->entityManager->flush();

        return new TaskUpdateResult($task, $generatedNextTask);
    }

    /**
     * Delete a task.
     */
    public function delete(Task $task): void
    {
        $this->entityManager->remove($task);
        $this->entityManager->flush();
    }

    /**
     * Assign tags to a task, replacing existing tags.
     *
     * @param int[] $tagIds
     */
    public function assignTags(Task $task, User $user, array $tagIds): Task
    {
        // Clear existing tags
        foreach ($task->getTags() as $existingTag) {
            $task->removeTag($existingTag);
        }

        // Add new tags (verify each tag belongs to user)
        foreach ($tagIds as $tagId) {
            $tag = $this->tagRepository->find($tagId);
            if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
                $task->addTag($tag);
            }
        }

        $this->entityManager->flush();

        return $task;
    }

    /**
     * Remove a specific tag from a task.
     */
    public function removeTag(Task $task, User $user, int $tagId): void
    {
        $tag = $this->tagRepository->find($tagId);
        if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
            $task->removeTag($tag);
            $this->entityManager->flush();
        }
    }

    /**
     * Handle task completion state changes.
     * Generates next recurring task if completing a recurring task.
     *
     * @return Task|null The generated next task, or null if none was generated
     */
    private function handleCompletion(Task $task, bool $isCompleted): ?Task
    {
        $wasCompleted = $task->isCompleted();
        $task->setIsCompleted($isCompleted);

        if ($isCompleted && $task->getCompletedAt() === null) {
            $task->setCompletedAt(new \DateTimeImmutable());
        } elseif (! $isCompleted) {
            $task->setCompletedAt(null);
        }

        // Generate next occurrence if completing a recurring task
        if ($isCompleted && ! $wasCompleted && $task->getRecurringTask() !== null) {
            $recurringTask = $task->getRecurringTask();
            $nextDate = $this->recurrenceService->findNextOccurrenceDate($recurringTask);

            if ($nextDate !== null) {
                $generatedTask = $this->recurringSyncService->generateTask($recurringTask, $nextDate);
                if ($generatedTask !== null) {
                    $recurringTask->setLastGeneratedDate($nextDate);

                    return $generatedTask;
                }
            }
        }

        return null;
    }

    /**
     * Get an existing DailyNote or create a new one for the given user and date.
     */
    private function getOrCreateDailyNote(User $user, \DateTimeInterface $date): DailyNote
    {
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        return $dailyNote;
    }

    /**
     * Parse a nullable date value from request data.
     */
    private function parseNullableDate(mixed $value): ?\DateTime
    {
        if ($value === null || $value === '') {
            return null;
        }

        return new \DateTime($value);
    }

    /**
     * Parse a nullable DateTimeImmutable value from request data.
     */
    private function parseNullableDateTimeImmutable(mixed $value): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        return new \DateTimeImmutable($value);
    }
}
