<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\Task;

final readonly class TaskResponse
{
    /**
     * @param TagResponse[] $tags
     */
    public function __construct(
        public int $id,
        public string $title,
        public bool $isCompleted,
        public bool $isDropped,
        public ?string $dueDate,
        public string $category,
        public ?string $completedAt,
        public ?string $reminderTime,
        public ?int $estimatedMinutes,
        public ?string $fixedTime,
        public ?array $canCombineWithEvents,
        public bool $needsFullFocus,
        public ?int $recurringTaskId,
        public ?int $parentTaskId,
        public bool $isPart,
        public ?int $partNumber,
        public ?string $progress,
        public bool $hasSubtasks,
        public array $tags,
    ) {
    }

    public static function fromEntity(Task $task): self
    {
        return new self(
            id: $task->getId(),
            title: $task->getTitle(),
            isCompleted: $task->isCompleted(),
            isDropped: $task->isDropped(),
            dueDate: $task->getDueDate()?->format('Y-m-d'),
            category: $task->getCategory()->value,
            completedAt: $task->getCompletedAt()?->format('c'),
            reminderTime: $task->getReminderTime()?->format('H:i'),
            estimatedMinutes: $task->getEstimatedMinutes(),
            fixedTime: $task->getFixedTime()?->format('H:i'),
            canCombineWithEvents: $task->getCanCombineWithEvents(),
            needsFullFocus: $task->isNeedsFullFocus(),
            recurringTaskId: $task->getRecurringTask()?->getId(),
            parentTaskId: $task->getParentTask()?->getId(),
            isPart: $task->isPart(),
            partNumber: $task->getPartNumber(),
            progress: $task->getProgress(),
            hasSubtasks: $task->hasSubtasks(),
            tags: array_map(
                fn($tag) => TagResponse::fromEntity($tag),
                $task->getTags()->toArray()
            ),
        );
    }
}
