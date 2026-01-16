<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/task')]
class TaskController extends AbstractController
{
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/{id}', name: 'task_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json([
                'error' => 'Task not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['isCompleted'])) {
            $isCompleted = (bool) $data['isCompleted'];
            $task->setIsCompleted($isCompleted);
            if ($isCompleted && $task->getCompletedAt() === null) {
                $task->setCompletedAt(new \DateTimeImmutable());
            } elseif (! $isCompleted) {
                $task->setCompletedAt(null);
            }
        }

        if (isset($data['title'])) {
            $task->setTitle((string) $data['title']);
        }

        if (array_key_exists('dueDate', $data)) {
            if ($data['dueDate'] === null || $data['dueDate'] === '') {
                $task->setDueDate(null);
            } else {
                $task->setDueDate(new \DateTime($data['dueDate']));
            }
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'isCompleted' => $task->isCompleted(),
            'isDropped' => $task->isDropped(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            'category' => $task->getCategory()->value,
            'completedAt' => $task->getCompletedAt()?->format('c'),
        ]);
    }

    #[Route('/{id}', name: 'task_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json([
                'error' => 'Task not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($task);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
