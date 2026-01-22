<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\PlanningScheduleGenerator;
use App\Service\PlanningService;
use App\Service\TaskBlockMatchingService;
use App\Service\TaskService;
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
        private readonly PlanningService $planningService,
        private readonly TaskService $taskService,
        private readonly PlanningScheduleGenerator $scheduleGenerator,
        private readonly TaskBlockMatchingService $taskBlockMatchingService,
    ) {
    }

    #[Route('/tasks', name: 'planning_tasks', methods: ['GET'])]
    public function getTasks(#[CurrentUser] User $user): JsonResponse
    {
        $today = new \DateTime('today');
        $currentTime = new \DateTime();
        $data = $this->planningService->getTasksForPlanning($user, $today);

        $conflictingTasksData = [];
        foreach ($data['conflicts'] as $conflict) {
            $task = $conflict['task'];
            $event = $conflict['conflictingEvent'];
            $matchingBlock = $this->taskBlockMatchingService->findFirstAvailableBlock($task, $data['activeBlocks'], $currentTime);
            $conflictingTasksData[] = $this->serializeTaskForPlanning($task, true, $event, $matchingBlock);
        }

        return $this->json([
            'tasks' => array_map(function ($task) use ($data, $currentTime) {
                $matchingBlock = $this->taskBlockMatchingService->findFirstAvailableBlock($task, $data['activeBlocks'], $currentTime);
                return $this->serializeTaskForPlanning($task, false, null, $matchingBlock);
            }, $data['unplannedTasks']),
            'conflictingTasks' => $conflictingTasksData,
            'events' => array_map(fn ($event) => [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'startTime' => $event->getStartTime()?->format('H:i'),
                'endTime' => $event->getEndTime()?->format('H:i'),
            ], $data['events']),
            'timeBlocks' => $data['activeBlocks'],
        ]);
    }

    #[Route('/task/{id}', name: 'planning_task_save', methods: ['POST'])]
    public function saveTaskPlanning(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskService->findByIdAndUser($id, $user);
        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $task = $this->planningService->updatePlanningFields($task, $data);

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
        $planningData = $this->planningService->getTasksForPlanning($user, $today);

        $tasksToSchedule = array_filter(
            array_map(fn ($id) => $this->taskService->findByIdAndUser($id, $user), $taskIds),
            fn ($task) => $task !== null
        );

        $taskIdsToSchedule = array_map(fn ($t) => $t->getId(), $tasksToSchedule);
        $existingPlannedTasks = array_filter(
            $planningData['plannedTasks'],
            fn ($t) => !in_array($t->getId(), $taskIdsToSchedule, true)
        );

        $schedule = $this->scheduleGenerator->generate(
            array_values($tasksToSchedule),
            $planningData['events'],
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
        $this->planningService->acceptSchedule($user, $data['schedule'] ?? []);
        return $this->json(['success' => true]);
    }

    /**
     * @param array<string, mixed>|null $matchingBlock
     */
    private function serializeTaskForPlanning(
        \App\Entity\Task $task,
        bool $hasConflict,
        ?\App\Entity\Event $conflictingEvent,
        ?array $matchingBlock
    ): array {
        return [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            'category' => $task->getCategory()->value,
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'canCombineWithEvents' => $task->getCanCombineWithEvents(),
            'needsFullFocus' => $task->isNeedsFullFocus(),
            'hasConflict' => $hasConflict,
            'conflictingEvent' => $conflictingEvent ? [
                'id' => $conflictingEvent->getId(),
                'title' => $conflictingEvent->getTitle(),
                'startTime' => $conflictingEvent->getStartTime()?->format('H:i'),
                'endTime' => $conflictingEvent->getEndTime()?->format('H:i'),
            ] : null,
            'matchingBlock' => $matchingBlock ? [
                'id' => $matchingBlock['id'],
                'name' => $matchingBlock['name'],
                'color' => $matchingBlock['color'],
            ] : null,
        ];
    }
}
