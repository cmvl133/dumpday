<?php

declare(strict_types=1);

namespace App\Facade;

use App\Entity\DailyNote;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
use App\Repository\TaskRepository;
use App\Service\BrainDumpAnalyzer;
use App\Service\EventExtractor;
use App\Service\JournalExtractor;
use App\Service\NoteExtractor;
use App\Service\ScheduleBuilder;
use App\Service\TaskExtractor;
use Doctrine\ORM\EntityManagerInterface;

class BrainDumpFacade
{
    public function __construct(
        private readonly BrainDumpAnalyzer $analyzer,
        private readonly TaskExtractor $taskExtractor,
        private readonly EventExtractor $eventExtractor,
        private readonly JournalExtractor $journalExtractor,
        private readonly NoteExtractor $noteExtractor,
        private readonly ScheduleBuilder $scheduleBuilder,
        private readonly EntityManagerInterface $entityManager,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TaskRepository $taskRepository,
    ) {
    }

    public function analyze(User $user, string $rawContent, \DateTimeInterface $date): array
    {
        $aiResponse = $this->analyzer->analyze($rawContent, $date);

        $schedule = $this->scheduleBuilder->buildScheduleFromAnalysis(
            $aiResponse['events'] ?? [],
            $date
        );

        return [
            'tasks' => $aiResponse['tasks'] ?? [
                'today' => [],
                'scheduled' => [],
                'someday' => [],
            ],
            'events' => $aiResponse['events'] ?? [],
            'notes' => $aiResponse['notes'] ?? [],
            'journal' => $aiResponse['journal'] ?? [],
            'schedule' => $schedule,
        ];
    }

    public function saveAnalysis(
        User $user,
        string $rawContent,
        array $analysisResult,
        \DateTimeInterface $date
    ): DailyNote {
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
        }

        // Append rawContent instead of replacing
        $existingRawContent = $dailyNote->getRawContent();
        if ($existingRawContent !== null && $existingRawContent !== '') {
            $dailyNote->setRawContent($existingRawContent . "\n\n---\n\n" . $rawContent);
        } else {
            $dailyNote->setRawContent($rawContent);
        }

        // Add new items WITHOUT clearing existing ones, with duplicate detection
        $existingTaskTitles = array_map(
            fn ($t) => mb_strtolower(trim($t->getTitle())),
            $dailyNote->getTasks()->toArray()
        );

        foreach ($this->taskExtractor->extract($analysisResult, $dailyNote) as $task) {
            $normalizedTitle = mb_strtolower(trim($task->getTitle()));
            if (!in_array($normalizedTitle, $existingTaskTitles, true)) {
                $dailyNote->addTask($task);
                $existingTaskTitles[] = $normalizedTitle;
            }
        }

        // For events, check title + overlapping time
        $existingEvents = $dailyNote->getEvents()->toArray();

        foreach ($this->eventExtractor->extract($analysisResult, $dailyNote) as $event) {
            $isDuplicate = false;
            $newTitle = mb_strtolower(trim($event->getTitle()));
            $newStart = $event->getStartTime();
            $newEnd = $event->getEndTime();

            foreach ($existingEvents as $existing) {
                $existingTitle = mb_strtolower(trim($existing->getTitle()));

                // Check if same title
                if ($newTitle === $existingTitle) {
                    // Check if times overlap
                    $existingStart = $existing->getStartTime();
                    $existingEnd = $existing->getEndTime();

                    if ($this->timesOverlap($newStart, $newEnd, $existingStart, $existingEnd)) {
                        $isDuplicate = true;
                        break;
                    }
                }
            }

            if (!$isDuplicate) {
                $dailyNote->addEvent($event);
                $existingEvents[] = $event;
            }
        }

        // For journal entries, check content similarity
        $existingJournalContents = array_map(
            fn ($j) => mb_strtolower(trim($j->getContent())),
            $dailyNote->getJournalEntries()->toArray()
        );

        foreach ($this->journalExtractor->extract($analysisResult, $dailyNote) as $journalEntry) {
            $normalizedContent = mb_strtolower(trim($journalEntry->getContent()));
            if (!in_array($normalizedContent, $existingJournalContents, true)) {
                $dailyNote->addJournalEntry($journalEntry);
                $existingJournalContents[] = $normalizedContent;
            }
        }

        // For notes, check content similarity
        $existingNoteContents = array_map(
            fn ($n) => mb_strtolower(trim($n->getContent())),
            $dailyNote->getNotes()->toArray()
        );

        foreach ($this->noteExtractor->extract($analysisResult, $dailyNote) as $note) {
            $normalizedContent = mb_strtolower(trim($note->getContent()));
            if (!in_array($normalizedContent, $existingNoteContents, true)) {
                $dailyNote->addNote($note);
                $existingNoteContents[] = $normalizedContent;
            }
        }

        $this->entityManager->persist($dailyNote);
        $this->entityManager->flush();

        return $dailyNote;
    }

    public function getDailyNote(User $user, \DateTimeInterface $date): ?DailyNote
    {
        return $this->dailyNoteRepository->findByUserAndDate($user, $date);
    }

    public function getDailyNoteData(User $user, \DateTimeInterface $date): ?array
    {
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        // Get tasks scheduled for this date (for this user)
        $scheduledTasksForDate = $this->taskRepository->findByUserAndDueDate($user, $date);
        $scheduledTaskIds = [];

        $tasks = [
            'today' => [],
            'scheduled' => [],
            'someday' => [],
        ];

        // Add tasks scheduled for this date to the "today" category
        // (they become "today's tasks" on their due date)
        foreach ($scheduledTasksForDate as $task) {
            $scheduledTaskIds[] = $task->getId();
            $tasks['today'][] = [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'isCompleted' => $task->isCompleted(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            ];
        }

        // If no DailyNote exists but we have scheduled tasks, return minimal data
        if ($dailyNote === null) {
            if (empty($scheduledTasksForDate)) {
                return null;
            }

            return [
                'id' => null,
                'date' => $date->format('Y-m-d'),
                'rawContent' => null,
                'tasks' => $tasks,
                'events' => [],
                'notes' => [],
                'journal' => [],
                'schedule' => [],
                'createdAt' => null,
                'updatedAt' => null,
            ];
        }

        // Add tasks from the DailyNote (excluding already added scheduled tasks)
        $dateString = $date->format('Y-m-d');
        foreach ($dailyNote->getTasks() as $task) {
            // Skip if already added from scheduledTasksForDate
            if (in_array($task->getId(), $scheduledTaskIds, true)) {
                continue;
            }

            // Skip if task has a dueDate that doesn't match current date
            // (it will appear on its dueDate instead)
            $taskDueDate = $task->getDueDate()?->format('Y-m-d');
            if ($taskDueDate !== null && $taskDueDate !== $dateString) {
                continue;
            }

            $taskData = [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'isCompleted' => $task->isCompleted(),
                'dueDate' => $taskDueDate,
            ];

            $category = $task->getCategory()->value;
            $tasks[$category][] = $taskData;
        }

        $events = [];
        foreach ($dailyNote->getEvents() as $event) {
            $events[] = [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'startTime' => $event->getStartTime()?->format('H:i'),
                'endTime' => $event->getEndTime()?->format('H:i'),
                'date' => $event->getDate()?->format('Y-m-d'),
            ];
        }

        $notes = [];
        foreach ($dailyNote->getNotes() as $note) {
            $notes[] = [
                'id' => $note->getId(),
                'content' => $note->getContent(),
            ];
        }

        $journal = [];
        foreach ($dailyNote->getJournalEntries() as $entry) {
            $journal[] = [
                'id' => $entry->getId(),
                'content' => $entry->getContent(),
            ];
        }

        $schedule = $this->scheduleBuilder->buildSchedule(
            $dailyNote->getEvents()->toArray(),
            $date
        );

        return [
            'id' => $dailyNote->getId(),
            'date' => $dailyNote->getDate()?->format('Y-m-d'),
            'rawContent' => $dailyNote->getRawContent(),
            'tasks' => $tasks,
            'events' => $events,
            'notes' => $notes,
            'journal' => $journal,
            'schedule' => $schedule,
            'createdAt' => $dailyNote->getCreatedAt()?->format('c'),
            'updatedAt' => $dailyNote->getUpdatedAt()?->format('c'),
        ];
    }

    /**
     * Check if two time ranges overlap.
     */
    private function timesOverlap(
        ?\DateTimeInterface $start1,
        ?\DateTimeInterface $end1,
        ?\DateTimeInterface $start2,
        ?\DateTimeInterface $end2
    ): bool {
        if ($start1 === null || $start2 === null) {
            return false;
        }

        // If no end time, assume 1 hour duration
        $end1 = $end1 ?? (clone $start1)->modify('+1 hour');
        $end2 = $end2 ?? (clone $start2)->modify('+1 hour');

        // Convert to minutes for comparison
        $s1 = (int) $start1->format('H') * 60 + (int) $start1->format('i');
        $e1 = (int) $end1->format('H') * 60 + (int) $end1->format('i');
        $s2 = (int) $start2->format('H') * 60 + (int) $start2->format('i');
        $e2 = (int) $end2->format('H') * 60 + (int) $end2->format('i');

        return $s1 < $e2 && $s2 < $e1;
    }
}
