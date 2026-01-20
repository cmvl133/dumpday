<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Task;

class TaskBlockMatchingService
{
    /**
     * Find all time blocks that match the given task's tags.
     *
     * @param Task $task Task to find matches for
     * @param array<array<string, mixed>> $activeBlocks Active time blocks (from TimeBlockService::getActiveBlocksForDate)
     * @return array<array<string, mixed>> Matching blocks (subset of activeBlocks)
     */
    public function findMatchingBlocks(Task $task, array $activeBlocks): array
    {
        // Extract task tag IDs
        $taskTagIds = $task->getTags()->map(fn ($t) => $t->getId())->toArray();

        // Return empty array if task has no tags
        if (empty($taskTagIds)) {
            return [];
        }

        // Filter blocks where at least one tag matches
        return array_values(array_filter($activeBlocks, function (array $block) use ($taskTagIds): bool {
            $blockTags = $block['tags'] ?? [];
            foreach ($blockTags as $tag) {
                if (in_array($tag['id'], $taskTagIds, true)) {
                    return true;
                }
            }
            return false;
        }));
    }

    /**
     * Find the first available matching block for the task.
     *
     * @param Task $task Task to find match for
     * @param array<array<string, mixed>> $activeBlocks Active time blocks
     * @param \DateTimeInterface $currentTime Current time for availability check
     * @return array<string, mixed>|null First available block or null
     */
    public function findFirstAvailableBlock(Task $task, array $activeBlocks, \DateTimeInterface $currentTime): ?array
    {
        $matchingBlocks = $this->findMatchingBlocks($task, $activeBlocks);

        if (empty($matchingBlocks)) {
            return null;
        }

        // Sort by startTime ascending (blocks already sorted by TimeBlockService, but ensure)
        usort($matchingBlocks, fn (array $a, array $b) =>
            ($a['startTime'] ?? '') <=> ($b['startTime'] ?? '')
        );

        // Format current time as H:i for comparison
        $currentTimeStr = $currentTime->format('H:i');

        // Find first block where endTime > currentTime
        foreach ($matchingBlocks as $block) {
            $endTime = $block['endTime'] ?? null;
            if ($endTime !== null && $endTime > $currentTimeStr) {
                return $block;
            }
        }

        return null;
    }
}
