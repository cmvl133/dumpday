<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\RecurringTask;
use App\Enum\RecurrenceType;

/**
 * Pure logic service for recurrence pattern matching.
 * No dependencies, no EntityManager - easily testable.
 */
final readonly class RecurrenceService
{
    /**
     * Check if a date matches the recurrence pattern of a recurring task.
     */
    public function matchesPattern(RecurringTask $recurringTask, \DateTimeInterface $date): bool
    {
        $dayOfWeek = (int) $date->format('w'); // 0 = Sunday, 6 = Saturday
        $dayOfMonth = (int) $date->format('j');
        $startDayOfWeek = (int) $recurringTask->getStartDate()->format('w');
        $startDayOfMonth = (int) $recurringTask->getStartDate()->format('j');

        return match ($recurringTask->getRecurrenceType()) {
            RecurrenceType::DAILY => true,
            RecurrenceType::WEEKLY => $dayOfWeek === $startDayOfWeek,
            RecurrenceType::WEEKDAYS => $dayOfWeek >= 1 && $dayOfWeek <= 5, // Mon-Fri
            RecurrenceType::MONTHLY => $dayOfMonth === $startDayOfMonth,
            RecurrenceType::CUSTOM => $this->matchesCustomPattern($recurringTask, $dayOfWeek),
        };
    }

    /**
     * Find the next occurrence date for a recurring task starting from tomorrow.
     *
     * @param int $maxDaysAhead Maximum number of days to search ahead (default 365)
     *
     * @return \DateTimeInterface|null Next occurrence date, or null if none found within range
     */
    public function findNextOccurrenceDate(RecurringTask $recurringTask, int $maxDaysAhead = 365): ?\DateTimeInterface
    {
        $today = new \DateTime('today');
        $endDate = $recurringTask->getEndDate();

        // Check up to maxDaysAhead days starting from tomorrow
        for ($i = 1; $i <= $maxDaysAhead; $i++) {
            $date = (clone $today)->modify("+{$i} days");

            // Stop if we're past the end date
            if ($endDate !== null && $date > $endDate) {
                return null;
            }

            if ($this->matchesPattern($recurringTask, $date)) {
                return $date;
            }
        }

        return null;
    }

    /**
     * Check if a day of week matches the custom recurrence pattern.
     */
    private function matchesCustomPattern(RecurringTask $recurringTask, int $dayOfWeek): bool
    {
        $customDays = $recurringTask->getRecurrenceDays();

        if ($customDays === null || $customDays === []) {
            return false;
        }

        return in_array($dayOfWeek, $customDays, true);
    }
}
