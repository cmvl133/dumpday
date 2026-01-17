<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\TaskRepository;
use App\Service\PlanningScheduleGenerator;
use App\Service\TaskEventConflictResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/planning')]
class PlanningController extends AbstractController
{
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly EventRepository $eventRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly PlanningScheduleGenerator $scheduleGenerator,
        private readonly TaskEventConflictResolver $conflictResolver,
    ) {
    }

    #[Route('/tasks', name: 'planning_tasks', methods: ['GET'])]
    public function getTasks(#[CurrentUser] User $user): JsonResponse
    {
        $today = new \DateTime('today');

        $unplannedTasks = $this->taskRepository->findUnplannedTasksForToday($user, $today);
        $plannedTasks = $this->taskRepository->findPlannedTasksForToday($user, $today);
        $events = $this->eventRepository->findByUserAndDate($user, $today);

        // Find tasks with conflicts (have fixedTime but overlap with events)
        $conflicts = $this->conflictResolver->findConflictingTasks($plannedTasks, $events);
        $conflictingTasksData = [];

        foreach ($conflicts as $conflict) {
            $task = $conflict['task'];
            $event = $conflict['conflictingEvent'];
            $conflictingTasksData[] = [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
                'category' => $task->getCategory()->value,
                'estimatedMinutes' => $task->getEstimatedMinutes(),
                'fixedTime' => $task->getFixedTime()?->format('H:i'),
                'canCombineWithEvents' => $task->getCanCombineWithEvents(),
                'needsFullFocus' => $task->isNeedsFullFocus(),
                'hasConflict' => true,
                'conflictingEvent' => [
                    'id' => $event->getId(),
                    'title' => $event->getTitle(),
                    'startTime' => $event->getStartTime()?->format('H:i'),
                    'endTime' => $event->getEndTime()?->format('H:i'),
                ],
            ];
        }

        return $this->json([
            'tasks' => array_map(fn ($task) => [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
                'category' => $task->getCategory()->value,
                'estimatedMinutes' => $task->getEstimatedMinutes(),
                'fixedTime' => $task->getFixedTime()?->format('H:i'),
                'canCombineWithEvents' => $task->getCanCombineWithEvents(),
                'needsFullFocus' => $task->isNeedsFullFocus(),
                'hasConflict' => false,
                'conflictingEvent' => null,
            ], $unplannedTasks),
            'conflictingTasks' => $conflictingTasksData,
            'events' => array_map(fn ($event) => [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'startTime' => $event->getStartTime()?->format('H:i'),
                'endTime' => $event->getEndTime()?->format('H:i'),
            ], $events),
        ]);
    }

    #[Route('/task/{id}', name: 'planning_task_save', methods: ['POST'])]
    public function saveTaskPlanning(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (array_key_exists('estimatedMinutes', $data)) {
            $task->setEstimatedMinutes($data['estimatedMinutes'] !== null ? (int) $data['estimatedMinutes'] : null);
        }

        if (array_key_exists('fixedTime', $data)) {
            if ($data['fixedTime'] === null || $data['fixedTime'] === '') {
                $task->setFixedTime(null);
            } else {
                $task->setFixedTime(new \DateTimeImmutable($data['fixedTime']));
            }
        }

        if (array_key_exists('canCombineWithEvents', $data)) {
            $task->setCanCombineWithEvents($data['canCombineWithEvents']);
        }

        if (array_key_exists('needsFullFocus', $data)) {
            $task->setNeedsFullFocus((bool) $data['needsFullFocus']);
        }

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'task' => [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'estimatedMinutes' => $task->getEstimatedMinutes(),
                'fixedTime' => $task->getFixedTime()?->format('H:i'),
                'canCombineWithEvents' => $task->getCanCombineWithEvents(),
                'needsFullFocus' => $task->isNeedsFullFocus(),
            ],
        ]);
    }

    #[Route('/generate', name: 'planning_generate', methods: ['POST'])]
    public function generateSchedule(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $taskIds = $data['taskIds'] ?? [];

        if (empty($taskIds)) {
            return $this->json(['error' => 'No tasks provided'], Response::HTTP_BAD_REQUEST);
        }

        $today = new \DateTime('today');
        $tasksToSchedule = [];

        foreach ($taskIds as $taskId) {
            $task = $this->taskRepository->find($taskId);
            if ($task !== null && $task->getDailyNote()?->getUser()?->getId() === $user->getId()) {
                $tasksToSchedule[] = $task;
            }
        }

        $events = $this->eventRepository->findByUserAndDate($user, $today);

        // Get already planned tasks (with fixedTime) that are NOT being rescheduled
        $existingPlannedTasks = $this->taskRepository->findPlannedTasksForToday($user, $today);
        $taskIdsToSchedule = array_map(fn ($t) => $t->getId(), $tasksToSchedule);
        $existingPlannedTasks = array_filter(
            $existingPlannedTasks,
            fn ($t) => !in_array($t->getId(), $taskIdsToSchedule, true)
        );

        $schedule = $this->scheduleGenerator->generate(
            $tasksToSchedule,
            $events,
            array_values($existingPlannedTasks),
            $today,
            $user->getLanguage()
        );

        return $this->json($schedule);
    }

    #[Route('/accept', name: 'planning_accept', methods: ['POST'])]
    public function acceptSchedule(#[CurrentUser] User $user, Request $request): JsonResponse
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
            }

            if (isset($item['duration'])) {
                $task->setEstimatedMinutes((int) $item['duration']);
            }

            if (isset($item['combinedWithEventId'])) {
                $currentCombine = $task->getCanCombineWithEvents() ?? [];
                if (! in_array($item['combinedWithEventId'], $currentCombine, true)) {
                    $currentCombine[] = $item['combinedWithEventId'];
                    $task->setCanCombineWithEvents($currentCombine);
                }
            }
        }

        $this->entityManager->flush();

        return $this->json(['success' => true]);
    }
}
