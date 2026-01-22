<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Pure logic service for duplicate detection.
 * No dependencies, no EntityManager - easily testable.
 */
final readonly class DuplicateDetectionService
{
    /**
     * Check if a task title already exists in the list of existing titles.
     *
     * @param string   $newTitle       The new task title to check
     * @param string[] $existingTitles Array of existing task titles
     */
    public function isTaskDuplicate(string $newTitle, array $existingTitles): bool
    {
        $normalizedNewTitle = mb_strtolower(trim($newTitle));

        $normalizedExisting = array_map(
            fn (string $title) => mb_strtolower(trim($title)),
            $existingTitles
        );

        return in_array($normalizedNewTitle, $normalizedExisting, true);
    }

    /**
     * Check if an event already exists (same title and overlapping times).
     *
     * @param string                  $newTitle       The new event title
     * @param \DateTimeInterface|null $newStart       The new event start time
     * @param \DateTimeInterface|null $newEnd         The new event end time
     * @param array<array{title: string, startTime: ?\DateTimeInterface, endTime: ?\DateTimeInterface}> $existingEvents Array of existing events
     */
    public function isEventDuplicate(
        string $newTitle,
        ?\DateTimeInterface $newStart,
        ?\DateTimeInterface $newEnd,
        array $existingEvents
    ): bool {
        $normalizedNewTitle = mb_strtolower(trim($newTitle));

        foreach ($existingEvents as $existing) {
            $existingTitle = mb_strtolower(trim($existing['title']));

            if ($normalizedNewTitle === $existingTitle) {
                $existingStart = $existing['startTime'];
                $existingEnd = $existing['endTime'];

                if ($this->timesOverlap($newStart, $newEnd, $existingStart, $existingEnd)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if two time ranges overlap.
     *
     * @param \DateTimeInterface|null $start1 Start time of first range
     * @param \DateTimeInterface|null $end1   End time of first range
     * @param \DateTimeInterface|null $start2 Start time of second range
     * @param \DateTimeInterface|null $end2   End time of second range
     */
    public function timesOverlap(
        ?\DateTimeInterface $start1,
        ?\DateTimeInterface $end1,
        ?\DateTimeInterface $start2,
        ?\DateTimeInterface $end2
    ): bool {
        if ($start1 === null || $start2 === null) {
            return false;
        }

        // If no end time, assume 1 hour duration
        if ($end1 === null) {
            $end1 = \DateTime::createFromInterface($start1)->modify('+1 hour');
        }
        if ($end2 === null) {
            $end2 = \DateTime::createFromInterface($start2)->modify('+1 hour');
        }

        // Convert to minutes for comparison
        $s1 = (int) $start1->format('H') * 60 + (int) $start1->format('i');
        $e1 = (int) $end1->format('H') * 60 + (int) $end1->format('i');
        $s2 = (int) $start2->format('H') * 60 + (int) $start2->format('i');
        $e2 = (int) $end2->format('H') * 60 + (int) $end2->format('i');

        return $s1 < $e2 && $s2 < $e1;
    }

    /**
     * Check if content already exists in the list of existing contents.
     * Used for journal entries and notes.
     *
     * @param string   $newContent        The new content to check
     * @param string[] $existingContents  Array of existing content strings
     */
    public function isContentDuplicate(string $newContent, array $existingContents): bool
    {
        $normalizedNew = mb_strtolower(trim($newContent));

        $normalizedExisting = array_map(
            fn (string $content) => mb_strtolower(trim($content)),
            $existingContents
        );

        return in_array($normalizedNew, $normalizedExisting, true);
    }
}
