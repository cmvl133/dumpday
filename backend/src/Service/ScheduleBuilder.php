<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Event;

class ScheduleBuilder
{
    private const SCHEDULE_START_HOUR = 6;

    private const SCHEDULE_END_HOUR = 22;

    private const TOTAL_HOURS = self::SCHEDULE_END_HOUR - self::SCHEDULE_START_HOUR;

    /**
     * @param Event[] $events
     * @return array<array{id: int|null, title: string, startTime: string, endTime: string|null, topPercent: float, heightPercent: float}>
     */
    public function buildSchedule(array $events, \DateTimeInterface $date): array
    {
        $filteredEvents = array_filter($events, function (Event $event) use ($date) {
            return $event->getDate()?->format('Y-m-d') === $date->format('Y-m-d');
        });

        usort($filteredEvents, function (Event $a, Event $b) {
            return $a->getStartTime() <=> $b->getStartTime();
        });

        return array_values(array_map(function (Event $event) {
            $startTime = $event->getStartTime();
            $endTime = $event->getEndTime();

            return [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'startTime' => $startTime?->format('H:i'),
                'endTime' => $endTime?->format('H:i'),
                'topPercent' => $this->calculateTopPosition($startTime),
                'heightPercent' => $this->calculateHeight($startTime, $endTime),
            ];
        }, $filteredEvents));
    }

    /**
     * @param array $analysisEvents Raw events from AI analysis
     * @return array<array{title: string, startTime: string, endTime: string|null, date: string, topPercent: float, heightPercent: float}>
     */
    public function buildScheduleFromAnalysis(array $analysisEvents, \DateTimeInterface $date): array
    {
        $result = [];

        foreach ($analysisEvents as $event) {
            if (! isset($event['startTime'])) {
                continue;
            }

            $eventDate = isset($event['date']) ? $event['date'] : $date->format('Y-m-d');

            if ($eventDate !== $date->format('Y-m-d')) {
                continue;
            }

            $startTime = \DateTime::createFromFormat('H:i', $event['startTime']);
            if ($startTime === false) {
                continue;
            }

            $endTime = null;
            if (isset($event['endTime'])) {
                $endTime = \DateTime::createFromFormat('H:i', $event['endTime']);
            } elseif (isset($event['duration'])) {
                $endTime = clone $startTime;
                $endTime->modify('+' . (int) $event['duration'] . ' minutes');
            }

            $result[] = [
                'title' => $event['title'] ?? '',
                'startTime' => $event['startTime'],
                'endTime' => $endTime?->format('H:i'),
                'date' => $eventDate,
                'topPercent' => $this->calculateTopPosition($startTime),
                'heightPercent' => $this->calculateHeight($startTime, $endTime),
            ];
        }

        usort($result, fn ($a, $b) => strcmp($a['startTime'], $b['startTime']));

        return $result;
    }

    private function calculateTopPosition(?\DateTimeInterface $startTime): float
    {
        if ($startTime === null) {
            return 0;
        }

        $hour = (int) $startTime->format('H');
        $minute = (int) $startTime->format('i');

        $hoursFromStart = max(0, $hour - self::SCHEDULE_START_HOUR) + ($minute / 60);

        return ($hoursFromStart / self::TOTAL_HOURS) * 100;
    }

    private function calculateHeight(?\DateTimeInterface $startTime, ?\DateTimeInterface $endTime): float
    {
        if ($startTime === null || $endTime === null) {
            return (1 / self::TOTAL_HOURS) * 100;
        }

        $startMinutes = ((int) $startTime->format('H') * 60) + (int) $startTime->format('i');
        $endMinutes = ((int) $endTime->format('H') * 60) + (int) $endTime->format('i');

        $durationMinutes = max(30, $endMinutes - $startMinutes);
        $durationHours = $durationMinutes / 60;

        return ($durationHours / self::TOTAL_HOURS) * 100;
    }
}
