<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\TimeBlock;
use App\Entity\User;
use App\Enum\RecurrenceType;
use App\Repository\TimeBlockRepository;

class TimeBlockService
{
    public function __construct(
        private readonly TimeBlockRepository $timeBlockRepository,
    ) {
    }

    /**
     * Get all active time blocks for a user that are active on the given date.
     *
     * @return TimeBlock[]
     */
    public function getActiveBlocksForDate(User $user, \DateTimeInterface $date): array
    {
        $allBlocks = $this->timeBlockRepository->findActiveByUser($user);
        $activeBlocks = [];

        foreach ($allBlocks as $block) {
            if ($this->isActiveOnDate($block, $date)) {
                $activeBlocks[] = $block;
            }
        }

        // Sort by startTime
        usort($activeBlocks, fn (TimeBlock $a, TimeBlock $b) =>
            $a->getStartTime() <=> $b->getStartTime()
        );

        return $activeBlocks;
    }

    /**
     * Check if a time block should be active on the given date.
     */
    public function isActiveOnDate(TimeBlock $block, \DateTimeInterface $date): bool
    {
        $dayOfWeek = (int) $date->format('w'); // 0 = Sunday, 6 = Saturday

        return match ($block->getRecurrenceType()) {
            RecurrenceType::DAILY => true,
            RecurrenceType::WEEKLY => $this->matchesWeeklyPattern($block, $date),
            RecurrenceType::WEEKDAYS => $dayOfWeek >= 1 && $dayOfWeek <= 5,
            RecurrenceType::MONTHLY => $this->matchesMonthlyPattern($block, $date),
            RecurrenceType::CUSTOM => $this->matchesCustomPattern($block, $dayOfWeek),
        };
    }

    private function matchesWeeklyPattern(TimeBlock $block, \DateTimeInterface $date): bool
    {
        // Same day of week as creation date
        $createdDayOfWeek = (int) $block->getCreatedAt()->format('w');
        $targetDayOfWeek = (int) $date->format('w');
        return $createdDayOfWeek === $targetDayOfWeek;
    }

    private function matchesMonthlyPattern(TimeBlock $block, \DateTimeInterface $date): bool
    {
        // Same day of month as creation date
        $createdDayOfMonth = (int) $block->getCreatedAt()->format('j');
        $targetDayOfMonth = (int) $date->format('j');
        return $createdDayOfMonth === $targetDayOfMonth;
    }

    private function matchesCustomPattern(TimeBlock $block, int $dayOfWeek): bool
    {
        $recurrenceDays = $block->getRecurrenceDays() ?? [];
        return in_array($dayOfWeek, $recurrenceDays, true);
    }
}
