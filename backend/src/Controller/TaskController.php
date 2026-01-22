<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\Request\TaskCreateRequest;
use App\DTO\Response\TaskResponse;
use App\Entity\User;
use App\Service\TaskService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/task')]
class TaskController extends AbstractController
{
    public function __construct(private readonly TaskService $taskService)
    {
    }

    #[Route('', name: 'task_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, #[MapRequestPayload] TaskCreateRequest $request): JsonResponse
    {
        $task = $this->taskService->create($user, $request);
        return $this->json(TaskResponse::fromEntity($task), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'task_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskService->findByIdAndUser($id, $user);
        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $result = $this->taskService->update($task, $data);
        $taskData = json_decode(json_encode(TaskResponse::fromEntity($result->task)), true);

        if ($result->generatedNextTask !== null) {
            $taskData['generatedNextTask'] = [
                'id' => $result->generatedNextTask->getId(),
                'title' => $result->generatedNextTask->getTitle(),
                'date' => $result->generatedNextTask->getDailyNote()?->getDate()?->format('Y-m-d'),
            ];
        }

        return $this->json($taskData);
    }

    #[Route('/{id}', name: 'task_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->taskService->findByIdAndUser($id, $user);
        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $this->taskService->delete($task);
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/tags', name: 'task_assign_tags', methods: ['POST'])]
    public function assignTags(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskService->findByIdAndUser($id, $user);
        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $tagIds = $data['tagIds'] ?? [];
        if (!is_array($tagIds)) {
            return $this->json(['error' => 'tagIds must be an array'], Response::HTTP_BAD_REQUEST);
        }

        $task = $this->taskService->assignTags($task, $user, $tagIds);
        return $this->json([
            'id' => $task->getId(),
            'tags' => array_map(fn ($tag) => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'color' => $tag->getColor(),
            ], $task->getTags()->toArray()),
        ]);
    }

    #[Route('/{id}/tags/{tagId}', name: 'task_remove_tag', methods: ['DELETE'])]
    public function removeTag(#[CurrentUser] User $user, int $id, int $tagId): JsonResponse
    {
        $task = $this->taskService->findByIdAndUser($id, $user);
        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $this->taskService->removeTag($task, $user, $tagId);
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
