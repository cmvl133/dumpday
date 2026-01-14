<?php

declare(strict_types=1);

namespace App\Enum;

enum TaskCategory: string
{
    case TODAY = 'today';
    case SCHEDULED = 'scheduled';
    case SOMEDAY = 'someday';
}
