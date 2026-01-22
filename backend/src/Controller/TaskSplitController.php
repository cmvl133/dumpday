<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\Response\TaskResponse;
use App\Entity\User;
use App\Repository\TaskRepository;
use App\Service\TaskSplitService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class TaskSplitController extends AbstractController
{
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly TaskSplitService $taskSplitService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Split a task into multiple subtasks.
     */
    #[Route('/api/task/{id}/split', name: 'task_split', methods: ['POST'])]
    public function split(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        if ($task->hasSubtasks()) {
            return $this->json(['error' => 'Task is already split'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $parts = $data['parts'] ?? [];

        if (empty($parts)) {
            return $this->json(['error' => 'Parts array is required'], Response::HTTP_BAD_REQUEST);
        }

        // Validate parts
        foreach ($parts as $part) {
            if (!isset($part['startTime'], $part['duration'], $part['date'])) {
                return $this->json([
                    'error' => 'Each part must have startTime, duration, and date',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        try {
            $subtasks = $this->taskSplitService->splitTask($task, $parts);

            return $this->json([
                'parentTask' => TaskResponse::fromEntity($task),
                'subtasks' => array_map(fn($t) => TaskResponse::fromEntity($t), $subtasks),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Merge subtasks back into parent task.
     */
    #[Route('/api/task/{id}/merge', name: 'task_merge', methods: ['POST'])]
    public function merge(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        if (!$task->hasSubtasks()) {
            return $this->json(['error' => 'Task has no subtasks to merge'], Response::HTTP_BAD_REQUEST);
        }

        $mergedTask = $this->taskSplitService->mergeSubtasks($task);

        return $this->json(TaskResponse::fromEntity($mergedTask));
    }

    /**
     * Get subtasks of a parent task.
     */
    #[Route('/api/task/{id}/subtasks', name: 'task_subtasks', methods: ['GET'])]
    public function getSubtasks(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $subtasks = $task->getSubtasks()->toArray();

        return $this->json([
            'subtasks' => array_map(fn($t) => TaskResponse::fromEntity($t), $subtasks),
        ]);
    }

    /**
     * Get available time slots for a date.
     */
    #[Route('/api/schedule/available-slots', name: 'schedule_available_slots', methods: ['GET'])]
    public function getAvailableSlots(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $dateStr = $request->query->get('date');

        if (empty($dateStr)) {
            return $this->json(['error' => 'Date parameter is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $date = new \DateTime($dateStr);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid date format'], Response::HTTP_BAD_REQUEST);
        }

        $slots = $this->taskSplitService->findAvailableSlots($user, $date);

        return $this->json([
            'date' => $date->format('Y-m-d'),
            'slots' => $slots,
            'totalAvailable' => array_sum(array_column($slots, 'duration')),
        ]);
    }

    /**
     * Propose how to split a task.
     */
    #[Route('/api/schedule/propose-split', name: 'schedule_propose_split', methods: ['POST'])]
    public function proposeSplit(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $taskId = $data['taskId'] ?? null;
        $dateStr = $data['date'] ?? null;

        if (empty($taskId) || empty($dateStr)) {
            return $this->json([
                'error' => 'taskId and date are required',
            ], Response::HTTP_BAD_REQUEST);
        }

        $task = $this->taskRepository->find($taskId);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        try {
            $date = new \DateTime($dateStr);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid date format'], Response::HTTP_BAD_REQUEST);
        }

        $proposal = $this->taskSplitService->proposeSplit($task, $date, $user);

        return $this->json([
            'taskId' => $task->getId(),
            'taskTitle' => $task->getTitle(),
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'date' => $date->format('Y-m-d'),
            'proposal' => $proposal,
        ]);
    }
}
