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
use App\Service\TimeBlockService;
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
        private readonly TimeBlockService $timeBlockService,
    ) {
    }

    public function analyze(User $user, string $rawContent, \DateTimeInterface $date): array
    {
        // Get active time blocks for this date to provide context for AI analysis
        $timeBlocks = $this->timeBlockService->getActiveBlocksForDate($user, $date);

        // Serialize time blocks for the AI prompt
        $serializedTimeBlocks = array_map(fn ($tb) => [
            'id' => $tb->getId(),
            'name' => $tb->getName(),
            'startTime' => $tb->getStartTime()?->format('H:i'),
            'endTime' => $tb->getEndTime()?->format('H:i'),
            'tags' => array_map(fn ($tag) => [
                'name' => $tag->getName(),
            ], $tb->getTags()->toArray()),
        ], $timeBlocks);

        $aiResponse = $this->analyzer->analyze($rawContent, $date, $user->getLanguage(), $serializedTimeBlocks);

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
            if (! in_array($normalizedTitle, $existingTaskTitles, true)) {
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

            if (! $isDuplicate) {
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
            if (! in_array($normalizedContent, $existingJournalContents, true)) {
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
            if (! in_array($normalizedContent, $existingNoteContents, true)) {
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
            'overdue' => [],
        ];

        // Add overdue tasks - only when viewing today's date
        $today = new \DateTime('today');
        $isViewingToday = $date->format('Y-m-d') === $today->format('Y-m-d');
        $overdueTaskIds = [];

        if ($isViewingToday) {
            $overdueTasks = $this->taskRepository->findOverdueTasks($user, $today);
            foreach ($overdueTasks as $task) {
                $overdueTaskIds[] = $task->getId();
                $tasks['overdue'][] = $this->serializeTask($task);
            }
        }

        // Add tasks scheduled for this date to the "today" category
        // (they become "today's tasks" on their due date)
        foreach ($scheduledTasksForDate as $task) {
            // Skip if already in overdue
            if (in_array($task->getId(), $overdueTaskIds, true)) {
                continue;
            }
            $scheduledTaskIds[] = $task->getId();
            $tasks['today'][] = $this->serializeTask($task);
        }

        // Get active time blocks for this date
        $timeBlocks = $this->timeBlockService->getActiveBlocksForDate($user, $date);
        $serializedTimeBlocks = array_map(fn ($tb) => [
            'id' => $tb->getId(),
            'name' => $tb->getName(),
            'color' => $tb->getColor(),
            'startTime' => $tb->getStartTime()?->format('H:i'),
            'endTime' => $tb->getEndTime()?->format('H:i'),
            'tags' => array_map(fn ($tag) => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'color' => $tag->getColor(),
            ], $tb->getTags()->toArray()),
        ], $timeBlocks);

        // If no DailyNote exists but we have scheduled tasks or time blocks, return minimal data
        if ($dailyNote === null) {
            if (empty($scheduledTasksForDate) && empty($serializedTimeBlocks)) {
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
                'timeBlocks' => $serializedTimeBlocks,
                'createdAt' => null,
                'updatedAt' => null,
            ];
        }

        // Add tasks from the DailyNote (excluding already added scheduled/overdue tasks)
        $dateString = $date->format('Y-m-d');
        foreach ($dailyNote->getTasks() as $task) {
            // Skip if already added from scheduledTasksForDate or overdue
            if (in_array($task->getId(), $scheduledTaskIds, true) || in_array($task->getId(), $overdueTaskIds, true)) {
                continue;
            }

            // Skip if task has a dueDate that doesn't match current date
            // (it will appear on its dueDate instead)
            $taskDueDate = $task->getDueDate()?->format('Y-m-d');
            if ($taskDueDate !== null && $taskDueDate !== $dateString) {
                continue;
            }

            $category = $task->getCategory()->value;
            $tasks[$category][] = $this->serializeTask($task);
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
            'timeBlocks' => $serializedTimeBlocks,
            'createdAt' => $dailyNote->getCreatedAt()?->format('c'),
            'updatedAt' => $dailyNote->getUpdatedAt()?->format('c'),
        ];
    }

    /**
     * Serialize a task to array including subtask fields.
     */
    private function serializeTask($task): array
    {
        return [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'isCompleted' => $task->isCompleted(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            'reminderTime' => $task->getReminderTime()?->format('H:i'),
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'canCombineWithEvents' => $task->getCanCombineWithEvents(),
            'needsFullFocus' => $task->isNeedsFullFocus(),
            'recurringTaskId' => $task->getRecurringTask()?->getId(),
            'parentTaskId' => $task->getParentTask()?->getId(),
            'isPart' => $task->isPart(),
            'partNumber' => $task->getPartNumber(),
            'progress' => $task->getProgress(),
            'hasSubtasks' => $task->hasSubtasks(),
            'tags' => array_map(fn ($tag) => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'color' => $tag->getColor(),
            ], $task->getTags()->toArray()),
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
