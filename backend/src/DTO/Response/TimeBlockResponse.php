<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\TimeBlock;

final readonly class TimeBlockResponse
{
    /**
     * @param TagResponse[] $tags
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $color,
        public ?string $startTime,
        public ?string $endTime,
        public string $recurrenceType,
        public ?array $recurrenceDays,
        public bool $isActive,
        public ?string $createdAt,
        public array $tags,
    ) {
    }

    public static function fromEntity(TimeBlock $timeBlock): self
    {
        return new self(
            id: $timeBlock->getId(),
            name: $timeBlock->getName(),
            color: $timeBlock->getColor(),
            startTime: $timeBlock->getStartTime()?->format('H:i'),
            endTime: $timeBlock->getEndTime()?->format('H:i'),
            recurrenceType: $timeBlock->getRecurrenceType()->value,
            recurrenceDays: $timeBlock->getRecurrenceDays(),
            isActive: $timeBlock->isActive(),
            createdAt: $timeBlock->getCreatedAt()?->format('c'),
            tags: array_map(
                fn($tag) => TagResponse::fromEntity($tag),
                $timeBlock->getTags()->toArray()
            ),
        );
    }
}
