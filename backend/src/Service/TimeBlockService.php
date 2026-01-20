<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\TimeBlock;
use App\Entity\User;
use App\Enum\RecurrenceType;
use App\Repository\TimeBlockExceptionRepository;
use App\Repository\TimeBlockRepository;

class TimeBlockService
{
    public function __construct(
        private readonly TimeBlockRepository $timeBlockRepository,
        private readonly TimeBlockExceptionRepository $exceptionRepository,
    ) {
    }

    /**
     * Get all active time blocks for a user that are active on the given date.
     * Returns arrays with exception data applied (skipped blocks excluded, modified times applied).
     *
     * @return array<array<string, mixed>>
     */
    public function getActiveBlocksForDate(User $user, \DateTimeInterface $date): array
    {
        $allBlocks = $this->timeBlockRepository->findActiveByUser($user);

        // Load exceptions for this user and date
        $exceptions = $this->exceptionRepository->findByUserAndDate($user, $date);
        $exceptionMap = [];
        foreach ($exceptions as $exception) {
            $blockId = $exception->getTimeBlock()?->getId();
            if ($blockId !== null) {
                $exceptionMap[$blockId] = $exception;
            }
        }

        $result = [];

        foreach ($allBlocks as $block) {
            if (!$this->isActiveOnDate($block, $date)) {
                continue;
            }

            $blockId = $block->getId();
            $exception = $exceptionMap[$blockId] ?? null;

            // Skip blocks that have been skipped for this date
            if ($exception !== null && $exception->isSkipped()) {
                continue;
            }

            // Determine effective times (override if exception exists)
            $hasOverride = $exception !== null &&
                ($exception->getOverrideStartTime() !== null || $exception->getOverrideEndTime() !== null);

            $effectiveStartTime = $hasOverride && $exception->getOverrideStartTime() !== null
                ? $exception->getOverrideStartTime()->format('H:i')
                : $block->getStartTime()?->format('H:i');

            $effectiveEndTime = $hasOverride && $exception->getOverrideEndTime() !== null
                ? $exception->getOverrideEndTime()->format('H:i')
                : $block->getEndTime()?->format('H:i');

            // Serialize tags
            $tags = array_map(fn ($tag) => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'color' => $tag->getColor(),
            ], $block->getTags()->toArray());

            $result[] = [
                'id' => $blockId,
                'name' => $block->getName(),
                'color' => $block->getColor(),
                'startTime' => $effectiveStartTime,
                'endTime' => $effectiveEndTime,
                'recurrenceType' => $block->getRecurrenceType()->value,
                'recurrenceDays' => $block->getRecurrenceDays(),
                'isActive' => $block->isActive(),
                'createdAt' => $block->getCreatedAt()?->format('c'),
                'tags' => $tags,
                'isException' => $exception !== null,
                'originalStartTime' => $hasOverride ? $block->getStartTime()?->format('H:i') : null,
                'originalEndTime' => $hasOverride ? $block->getEndTime()?->format('H:i') : null,
            ];
        }

        // Sort by effective startTime (string comparison works for H:i format)
        usort($result, fn (array $a, array $b) =>
            ($a['startTime'] ?? '') <=> ($b['startTime'] ?? '')
        );

        return $result;
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
