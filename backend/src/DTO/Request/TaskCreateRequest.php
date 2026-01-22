<?php

declare(strict_types=1);

namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TaskCreateRequest
{
    public function __construct(
        #[Assert\NotBlank(message: 'Title is required')]
        #[Assert\Length(max: 500, maxMessage: 'Title cannot exceed 500 characters')]
        public string $title,

        #[Assert\NotBlank(message: 'Date is required')]
        #[Assert\Date(message: 'Invalid date format. Use YYYY-MM-DD')]
        public string $date,

        #[Assert\Choice(
            choices: ['today', 'scheduled', 'someday'],
            message: 'Invalid category. Must be one of: today, scheduled, someday'
        )]
        public ?string $category = null,

        #[Assert\Date(message: 'Invalid due date format. Use YYYY-MM-DD')]
        public ?string $dueDate = null,
    ) {
    }
}
