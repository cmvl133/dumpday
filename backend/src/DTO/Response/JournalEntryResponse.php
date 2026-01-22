<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\JournalEntry;

final readonly class JournalEntryResponse
{
    public function __construct(
        public int $id,
        public string $content,
    ) {
    }

    public static function fromEntity(JournalEntry $entry): self
    {
        return new self(
            id: $entry->getId(),
            content: $entry->getContent(),
        );
    }
}
