<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Facade\BrainDumpFacade;
use App\Repository\EventRepository;
use App\Repository\TaskRepository;
use App\Service\PlanningScheduleGenerator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/rebuild')]
class RebuildController extends AbstractController
{
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly EventRepository $eventRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly PlanningScheduleGenerator $scheduleGenerator,
        private readonly BrainDumpFacade $brainDumpFacade,
    ) {
    }

    #[Route('', name: 'rebuild_day', methods: ['POST'])]
    public function rebuildDay(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $keepTaskIds = $data['keepTaskIds'] ?? [];
        $keepEventIds = $data['keepEventIds'] ?? [];
        $additionalInput = $data['additionalInput'] ?? null;
        $workUntilTime = $data['workUntilTime'] ?? '18:00';

        $today = new \DateTime('today');
        $parsedItems = [
            'newTasks' => [],
            'journalEntries' => 0,
            'notes' => 0,
        ];

        // 1. Get all today's tasks and clear fixedTime for tasks not in keepTaskIds
        $todayTasks = $this->taskRepository->findTodayIncompleteTasks($user, $today);
        foreach ($todayTasks as $task) {
            if (! in_array($task->getId(), $keepTaskIds, true)) {
                // Clear the fixedTime so it can be rescheduled
                $task->setFixedTime(null);
            }
        }

        // 2. Process additional input if provided
        if ($additionalInput !== null && trim($additionalInput) !== '') {
            $analysisResult = $this->brainDumpFacade->analyze($user, $additionalInput, $today);

            // Save the analysis (creates new tasks, journal entries, notes)
            $dailyNote = $this->brainDumpFacade->saveAnalysis($user, $additionalInput, $analysisResult, $today);

            // Count what was added
            $newTaskCount = 0;
            foreach (['today', 'scheduled', 'someday'] as $category) {
                $newTaskCount += count($analysisResult['tasks'][$category] ?? []);
            }
            $parsedItems['newTasks'] = array_map(fn ($t) => [
                'title' => $t['title'],
            ], $analysisResult['tasks']['today'] ?? []);
            $parsedItems['journalEntries'] = count($analysisResult['journal'] ?? []);
            $parsedItems['notes'] = count($analysisResult['notes'] ?? []);
        }

        $this->entityManager->flush();

        // 3. Get all tasks that need scheduling (without fixedTime)
        $tasksToSchedule = $this->taskRepository->findUnplannedTasksForToday($user, $today);

        // 4. Get remaining events
        $events = $this->eventRepository->findByUserAndDate($user, $today);
        $remainingEvents = array_filter($events, fn ($e) => in_array($e->getId(), $keepEventIds, true));

        // 5. Get existing planned tasks (for AI context)
        $existingPlannedTasks = $this->taskRepository->findPlannedTasksForToday($user, $today);

        // 6. Generate new schedule
        $schedule = $this->scheduleGenerator->generateRebuild(
            $tasksToSchedule,
            array_values($remainingEvents),
            array_values($existingPlannedTasks),
            $today,
            $workUntilTime,
            $user->getLanguage()
        );

        // 7. Enrich schedule with task titles
        $taskIds = array_map(fn ($item) => $item['taskId'], $schedule['schedule']);
        $allTasks = $this->taskRepository->findBy([
            'id' => $taskIds,
        ]);
        $taskTitles = [];
        foreach ($allTasks as $task) {
            $taskTitles[$task->getId()] = $task->getTitle();
        }
        $enrichedSchedule = array_map(function ($item) use ($taskTitles) {
            $item['taskTitle'] = $taskTitles[$item['taskId']] ?? null;
            return $item;
        }, $schedule['schedule']);

        return $this->json([
            'schedule' => $enrichedSchedule,
            'warnings' => $schedule['warnings'],
            'parsedItems' => $parsedItems,
        ]);
    }

    #[Route('/accept', name: 'rebuild_accept', methods: ['POST'])]
    public function acceptRebuild(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $schedule = $data['schedule'] ?? [];

        foreach ($schedule as $item) {
            $task = $this->taskRepository->find($item['taskId']);

            if ($task === null || $task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
                continue;
            }

            if (! empty($item['suggestedTime'])) {
                $task->setFixedTime(new \DateTimeImmutable($item['suggestedTime']));

                // Update dueDate to today for overdue tasks being scheduled
                $today = new \DateTimeImmutable('today');
                if ($task->getDueDate() !== null && $task->getDueDate() < $today) {
                    $task->setDueDate($today);
                }
            }

            if (isset($item['duration'])) {
                $task->setEstimatedMinutes((int) $item['duration']);
            }
        }

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
        ]);
    }
}
