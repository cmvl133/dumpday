<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Task;

/**
 * Result object for task updates that may produce side effects.
 * Allows the update method to return both the updated task AND any generated recurring task.
 */
final readonly class TaskUpdateResult
{
    public function __construct(
        public Task $task,
        public ?Task $generatedNextTask = null,
    ) {
    }
}
