<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\JournalEntry;

class JournalExtractor
{
    /**
     * @return JournalEntry[]
     */
    public function extract(array $aiResponse, DailyNote $dailyNote): array
    {
        $entries = [];

        foreach ($aiResponse['journal'] ?? [] as $item) {
            if (! isset($item['content']) || empty(trim($item['content']))) {
                continue;
            }

            $entry = new JournalEntry();
            $entry->setContent(trim($item['content']));
            $entry->setDailyNote($dailyNote);
            $entries[] = $entry;
        }

        return $entries;
    }
}
