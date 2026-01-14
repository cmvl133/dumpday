<?php

declare(strict_types=1);

namespace App\Facade;

use App\Entity\DailyNote;
use App\Repository\DailyNoteRepository;
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
    ) {
    }

    public function analyze(string $rawContent, \DateTimeInterface $date): array
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
        string $rawContent,
        array $analysisResult,
        \DateTimeInterface $date
    ): DailyNote {
        $dailyNote = $this->dailyNoteRepository->findByDate($date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setDate($date);
        }

        $dailyNote->setRawContent($rawContent);
        $dailyNote->clearAllItems();

        foreach ($this->taskExtractor->extract($analysisResult, $dailyNote) as $task) {
            $dailyNote->addTask($task);
        }

        foreach ($this->eventExtractor->extract($analysisResult, $dailyNote) as $event) {
            $dailyNote->addEvent($event);
        }

        foreach ($this->journalExtractor->extract($analysisResult, $dailyNote) as $journalEntry) {
            $dailyNote->addJournalEntry($journalEntry);
        }

        foreach ($this->noteExtractor->extract($analysisResult, $dailyNote) as $note) {
            $dailyNote->addNote($note);
        }

        $this->entityManager->persist($dailyNote);
        $this->entityManager->flush();

        return $dailyNote;
    }

    public function getDailyNote(\DateTimeInterface $date): ?DailyNote
    {
        return $this->dailyNoteRepository->findByDate($date);
    }

    public function getDailyNoteData(\DateTimeInterface $date): ?array
    {
        $dailyNote = $this->dailyNoteRepository->findByDate($date);

        if ($dailyNote === null) {
            return null;
        }

        $tasks = [
            'today' => [],
            'scheduled' => [],
            'someday' => [],
        ];

        foreach ($dailyNote->getTasks() as $task) {
            $taskData = [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'isCompleted' => $task->isCompleted(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
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
}
