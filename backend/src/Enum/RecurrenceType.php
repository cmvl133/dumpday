<?php

declare(strict_types=1);

namespace App\Enum;

enum RecurrenceType: string
{
    case DAILY = 'daily';
    case WEEKLY = 'weekly';
    case WEEKDAYS = 'weekdays';
    case MONTHLY = 'monthly';
    case CUSTOM = 'custom';
}
