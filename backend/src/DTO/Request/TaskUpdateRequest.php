<?php

declare(strict_types=1);

namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TaskUpdateRequest
{
    public function __construct(
        #[Assert\Length(max: 500, maxMessage: 'Title cannot exceed 500 characters')]
        public ?string $title = null,

        public ?bool $isCompleted = null,

        #[Assert\Date(message: 'Invalid due date format. Use YYYY-MM-DD')]
        public ?string $dueDate = null,

        #[Assert\Regex(
            pattern: '/^([01]\d|2[0-3]):([0-5]\d)$/',
            message: 'Invalid time format. Use HH:MM'
        )]
        public ?string $reminderTime = null,

        #[Assert\PositiveOrZero(message: 'Estimated minutes must be zero or positive')]
        public ?int $estimatedMinutes = null,

        #[Assert\Regex(
            pattern: '/^([01]\d|2[0-3]):([0-5]\d)$/',
            message: 'Invalid time format. Use HH:MM'
        )]
        public ?string $fixedTime = null,

        public ?array $canCombineWithEvents = null,

        public ?bool $needsFullFocus = null,
    ) {
    }
}
