<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\Event;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\TaskRepository;
use App\Repository\DailyNoteRepository;
use Doctrine\ORM\EntityManagerInterface;

class TaskSplitService
{
    private const SCHEDULE_START_HOUR = 6;
    private const SCHEDULE_END_HOUR = 22;
    private const MIN_SLOT_MINUTES = 30;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
        private readonly EventRepository $eventRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
    ) {
    }

    /**
     * Split a task into multiple subtasks.
     *
     * @param Task $task The task to split
     * @param array $parts Array of parts, each with ['startTime' => 'HH:MM', 'duration' => minutes, 'date' => 'Y-m-d']
     * @return Task[] Array of created subtasks
     */
    public function splitTask(Task $task, array $parts): array
    {
        if (empty($parts)) {
            throw new \InvalidArgumentException('At least one part is required');
        }

        $user = $task->getDailyNote()?->getUser();
        if ($user === null) {
            throw new \InvalidArgumentException('Task must belong to a DailyNote with a User');
        }

        $subtasks = [];
        $partNumber = 1;
        $originalTitle = $task->getTitle();

        foreach ($parts as $part) {
            $partDate = new \DateTime($part['date']);
            $dailyNote = $this->getOrCreateDailyNote($user, $partDate);

            $subtask = new Task();
            $subtask->setTitle(sprintf('%s (część %d)', $originalTitle, $partNumber));
            $subtask->setDailyNote($dailyNote);
            $subtask->setCategory($task->getCategory());
            $subtask->setParentTask($task);
            $subtask->setIsPart(true);
            $subtask->setPartNumber($partNumber);
            $subtask->setEstimatedMinutes($part['duration']);

            // Set fixed time
            $fixedTime = \DateTimeImmutable::createFromFormat('H:i', $part['startTime']);
            if ($fixedTime !== false) {
                $subtask->setFixedTime($fixedTime);
            }

            // Copy tags from parent
            foreach ($task->getTags() as $tag) {
                $subtask->addTag($tag);
            }

            $task->addSubtask($subtask);
            $dailyNote->addTask($subtask);
            $this->entityManager->persist($subtask);

            $subtasks[] = $subtask;
            $partNumber++;
        }

        // Clear fixed time from parent (parts have the times now)
        $task->setFixedTime(null);

        $this->entityManager->flush();

        return $subtasks;
    }

    /**
     * Merge all subtasks back into the parent task.
     */
    public function mergeSubtasks(Task $parentTask): Task
    {
        $subtasks = $parentTask->getSubtasks();

        if ($subtasks->isEmpty()) {
            return $parentTask;
        }

        // Calculate total estimated time from subtasks
        $totalMinutes = 0;
        foreach ($subtasks as $subtask) {
            $totalMinutes += $subtask->getEstimatedMinutes() ?? 0;
            $parentTask->removeSubtask($subtask);
            $this->entityManager->remove($subtask);
        }

        // Update parent with combined time
        if ($totalMinutes > 0) {
            $parentTask->setEstimatedMinutes($totalMinutes);
        }

        $this->entityManager->flush();

        return $parentTask;
    }

    /**
     * Find available time slots for a given date.
     *
     * @return array Array of slots: ['startTime' => 'HH:MM', 'endTime' => 'HH:MM', 'duration' => minutes]
     */
    public function findAvailableSlots(User $user, \DateTimeInterface $date): array
    {
        // Get all events for the date
        $events = $this->eventRepository->findByUserAndDate($user, $date);

        // Get all planned tasks for the date
        $plannedTasks = $this->taskRepository->findPlannedTasksForToday($user, $date);

        // Build list of occupied time ranges
        $occupied = [];

        foreach ($events as $event) {
            $startTime = $event->getStartTime();
            $endTime = $event->getEndTime();

            if ($startTime !== null) {
                $startMinutes = $this->timeToMinutes($startTime);
                $endMinutes = $endTime !== null
                    ? $this->timeToMinutes($endTime)
                    : $startMinutes + 60; // Default 1 hour duration

                $occupied[] = ['start' => $startMinutes, 'end' => $endMinutes];
            }
        }

        foreach ($plannedTasks as $task) {
            $fixedTime = $task->getFixedTime();
            if ($fixedTime !== null) {
                $startMinutes = $this->timeToMinutes($fixedTime);
                $duration = $task->getEstimatedMinutes() ?? 30;
                $occupied[] = ['start' => $startMinutes, 'end' => $startMinutes + $duration];
            }
        }

        // Sort occupied slots by start time
        usort($occupied, fn($a, $b) => $a['start'] <=> $b['start']);

        // Find gaps between occupied slots
        $slots = [];
        $scheduleStart = self::SCHEDULE_START_HOUR * 60;
        $scheduleEnd = self::SCHEDULE_END_HOUR * 60;
        $currentPosition = $scheduleStart;

        foreach ($occupied as $block) {
            // If there's a gap before this block
            if ($block['start'] > $currentPosition) {
                $gapDuration = $block['start'] - $currentPosition;
                if ($gapDuration >= self::MIN_SLOT_MINUTES) {
                    $slots[] = [
                        'startTime' => $this->minutesToTime($currentPosition),
                        'endTime' => $this->minutesToTime($block['start']),
                        'duration' => $gapDuration,
                    ];
                }
            }
            // Move position past this block
            $currentPosition = max($currentPosition, $block['end']);
        }

        // Check for gap at end of day
        if ($currentPosition < $scheduleEnd) {
            $gapDuration = $scheduleEnd - $currentPosition;
            if ($gapDuration >= self::MIN_SLOT_MINUTES) {
                $slots[] = [
                    'startTime' => $this->minutesToTime($currentPosition),
                    'endTime' => $this->minutesToTime($scheduleEnd),
                    'duration' => $gapDuration,
                ];
            }
        }

        return $slots;
    }

    /**
     * Propose how to split a task across available slots.
     *
     * @return array|null Array with 'canSplit', 'parts', 'reason', 'overflowToNextDay' or null if can't split
     */
    public function proposeSplit(Task $task, \DateTimeInterface $date, User $user): ?array
    {
        $estimatedMinutes = $task->getEstimatedMinutes();

        if ($estimatedMinutes === null || $estimatedMinutes <= 0) {
            return [
                'canSplit' => false,
                'reason' => 'Task has no estimated duration',
                'parts' => [],
                'overflowToNextDay' => false,
            ];
        }

        $slots = $this->findAvailableSlots($user, $date);
        $totalAvailable = array_sum(array_column($slots, 'duration'));

        // Check if task fits in any single slot
        foreach ($slots as $slot) {
            if ($slot['duration'] >= $estimatedMinutes) {
                return [
                    'canSplit' => false,
                    'reason' => 'Task fits in a single slot',
                    'parts' => [],
                    'overflowToNextDay' => false,
                    'suggestedSlot' => $slot,
                ];
            }
        }

        // Check if total available time is enough
        if ($totalAvailable < $estimatedMinutes) {
            // Not enough time today - propose overflow
            $tomorrowDate = (clone $date)->modify('+1 day');
            $tomorrowSlots = $this->findAvailableSlots($user, $tomorrowDate);
            $tomorrowAvailable = array_sum(array_column($tomorrowSlots, 'duration'));

            // Try to fill today and overflow rest to tomorrow
            $parts = $this->fillSlots($slots, $estimatedMinutes, $date->format('Y-m-d'));
            $remainingMinutes = $estimatedMinutes - array_sum(array_column($parts, 'duration'));

            if ($remainingMinutes > 0 && $tomorrowAvailable >= $remainingMinutes) {
                $tomorrowParts = $this->fillSlots($tomorrowSlots, $remainingMinutes, $tomorrowDate->format('Y-m-d'));
                $parts = array_merge($parts, $tomorrowParts);
            }

            if (array_sum(array_column($parts, 'duration')) >= $estimatedMinutes) {
                return [
                    'canSplit' => true,
                    'reason' => 'Not enough time today, split across days',
                    'parts' => $parts,
                    'overflowToNextDay' => true,
                ];
            }

            return [
                'canSplit' => false,
                'reason' => sprintf('Not enough time available (need %d min, have %d min today + %d min tomorrow)',
                    $estimatedMinutes, $totalAvailable, $tomorrowAvailable),
                'parts' => [],
                'overflowToNextDay' => false,
            ];
        }

        // Enough time today - propose split across slots
        $parts = $this->fillSlots($slots, $estimatedMinutes, $date->format('Y-m-d'));

        return [
            'canSplit' => true,
            'reason' => 'Task can be split across available slots',
            'parts' => $parts,
            'overflowToNextDay' => false,
        ];
    }

    /**
     * Fill slots with task time, returning parts.
     *
     * @return array Array of parts with startTime, duration, date
     */
    private function fillSlots(array $slots, int $remainingMinutes, string $date): array
    {
        $parts = [];

        foreach ($slots as $slot) {
            if ($remainingMinutes <= 0) {
                break;
            }

            $useDuration = min($slot['duration'], $remainingMinutes);

            // Don't create parts shorter than minimum
            if ($useDuration < self::MIN_SLOT_MINUTES && $remainingMinutes >= self::MIN_SLOT_MINUTES) {
                continue;
            }

            $parts[] = [
                'startTime' => $slot['startTime'],
                'duration' => $useDuration,
                'date' => $date,
            ];

            $remainingMinutes -= $useDuration;
        }

        return $parts;
    }

    private function timeToMinutes(\DateTimeInterface $time): int
    {
        return (int) $time->format('H') * 60 + (int) $time->format('i');
    }

    private function minutesToTime(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    private function getOrCreateDailyNote(User $user, \DateTimeInterface $date): DailyNote
    {
        $dailyNote = $this->dailyNoteRepository->findOneBy([
            'user' => $user,
            'date' => $date,
        ]);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        return $dailyNote;
    }
}
