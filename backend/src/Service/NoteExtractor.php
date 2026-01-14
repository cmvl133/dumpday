<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\Note;

class NoteExtractor
{
    /**
     * @return Note[]
     */
    public function extract(array $aiResponse, DailyNote $dailyNote): array
    {
        $notes = [];

        foreach ($aiResponse['notes'] ?? [] as $item) {
            if (! isset($item['content']) || empty(trim($item['content']))) {
                continue;
            }

            $note = new Note();
            $note->setContent(trim($item['content']));
            $note->setDailyNote($dailyNote);
            $notes[] = $note;
        }

        return $notes;
    }
}
