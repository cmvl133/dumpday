<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\Note;

final readonly class NoteResponse
{
    public function __construct(
        public int $id,
        public string $content,
        public ?string $title,
        public string $format,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }

    public static function fromEntity(Note $note): self
    {
        return new self(
            id: $note->getId(),
            content: $note->getContent(),
            title: $note->getTitle(),
            format: $note->getFormat(),
            createdAt: $note->getCreatedAt()?->format('c'),
            updatedAt: $note->getUpdatedAt()?->format('c'),
        );
    }
}
