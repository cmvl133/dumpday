<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class DailyNoteResponse
{
    /**
     * @param array{today: array<array-key, mixed>, scheduled: array<array-key, mixed>, someday: array<array-key, mixed>, overdue: array<array-key, mixed>} $tasks
     * @param array<array-key, mixed> $events
     * @param array<array-key, mixed> $notes
     * @param array<array-key, mixed> $journal
     * @param array<array-key, mixed> $schedule
     * @param array<array-key, mixed> $timeBlocks
     */
    public function __construct(
        public ?int $id,
        public string $date,
        public ?string $rawContent,
        public array $tasks,
        public array $events,
        public array $notes,
        public array $journal,
        public array $schedule,
        public array $timeBlocks,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }
}
