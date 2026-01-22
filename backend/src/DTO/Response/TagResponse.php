<?php

declare(strict_types=1);

namespace App\DTO\Response;

use App\Entity\Tag;

final readonly class TagResponse
{
    public function __construct(
        public int $id,
        public string $name,
        public string $color,
    ) {
    }

    public static function fromEntity(Tag $tag): self
    {
        return new self(
            id: $tag->getId(),
            name: $tag->getName(),
            color: $tag->getColor(),
        );
    }
}
