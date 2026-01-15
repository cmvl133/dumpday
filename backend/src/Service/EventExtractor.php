<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\Event;

class EventExtractor
{
    /**
     * @return Event[]
     */
    public function extract(array $aiResponse, DailyNote $dailyNote): array
    {
        $events = [];

        foreach ($aiResponse['events'] ?? [] as $item) {
            if (! isset($item['title'], $item['startTime']) || empty(trim($item['title']))) {
                continue;
            }

            try {
                $event = new Event();
                $event->setTitle(trim($item['title']));
                $event->setDailyNote($dailyNote);

                if (isset($item['date'])) {
                    $date = \DateTime::createFromFormat('Y-m-d', $item['date']);
                    if ($date === false) {
                        $date = $dailyNote->getDate();
                    } else {
                        $date->setTime(12, 0, 0); // Set to noon to avoid timezone edge cases
                    }
                } else {
                    $date = $dailyNote->getDate();
                }
                $event->setDate($date);

                $startTime = \DateTime::createFromFormat('H:i', $item['startTime']);
                if ($startTime === false) {
                    continue;
                }
                $event->setStartTime($startTime);

                if (isset($item['endTime'])) {
                    $endTime = \DateTime::createFromFormat('H:i', $item['endTime']);
                    if ($endTime !== false) {
                        $event->setEndTime($endTime);
                    }
                } elseif (isset($item['duration'])) {
                    $endTime = clone $startTime;
                    $endTime->modify('+' . (int) $item['duration'] . ' minutes');
                    $event->setEndTime($endTime);
                }

                $events[] = $event;
            } catch (\Exception) {
                continue;
            }
        }

        return $events;
    }
}
