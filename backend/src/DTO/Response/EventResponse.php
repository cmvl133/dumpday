<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\Event;

final readonly class EventResponse
{
    public function __construct(
        public int $id,
        public string $title,
        public ?string $date,
        public ?string $startTime,
        public ?string $endTime,
    ) {
    }

    public static function fromEntity(Event $event): self
    {
        return new self(
            id: $event->getId(),
            title: $event->getTitle(),
            date: $event->getDate()?->format('Y-m-d'),
            startTime: $event->getStartTime()?->format('H:i'),
            endTime: $event->getEndTime()?->format('H:i'),
        );
    }
}
