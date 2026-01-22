<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class ScheduleItemResponse
{
    public function __construct(
        public int $taskId,
        public ?string $suggestedTime,
        public int $duration,
        public ?int $combinedWithEventId = null,
        public string $reasoning = '',
    ) {
    }

    /**
     * Create from array (AI service returns arrays).
     *
     * @param array{taskId: int, suggestedTime?: string|null, duration?: int, combinedWithEventId?: int|null, reasoning?: string} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            taskId: (int) ($data['taskId'] ?? 0),
            suggestedTime: $data['suggestedTime'] ?? null,
            duration: (int) ($data['duration'] ?? 30),
            combinedWithEventId: $data['combinedWithEventId'] ?? null,
            reasoning: $data['reasoning'] ?? '',
        );
    }
}
