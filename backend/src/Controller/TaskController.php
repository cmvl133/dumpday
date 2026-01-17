<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\TaskCategory;
use App\Repository\DailyNoteRepository;
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
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'task_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['title']) || empty($data['date'])) {
            return $this->json([
                'error' => 'Title and date are required',
            ], Response::HTTP_BAD_REQUEST);
        }

        $date = new \DateTime($data['date']);
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        $task = new Task();
        $task->setTitle((string) $data['title']);
        $task->setDailyNote($dailyNote);

        if (isset($data['category']) && TaskCategory::tryFrom($data['category']) !== null) {
            $task->setCategory(TaskCategory::from($data['category']));
        }

        if (isset($data['dueDate']) && $data['dueDate'] !== null && $data['dueDate'] !== '') {
            $task->setDueDate(new \DateTime($data['dueDate']));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $this->json([
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'isCompleted' => $task->isCompleted(),
            'isDropped' => $task->isDropped(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            'category' => $task->getCategory()->value,
            'completedAt' => $task->getCompletedAt()?->format('c'),
            'reminderTime' => $task->getReminderTime()?->format('H:i'),
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'canCombineWithEvents' => $task->getCanCombineWithEvents(),
            'needsFullFocus' => $task->isNeedsFullFocus(),
        ], Response::HTTP_CREATED);
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

        if (array_key_exists('reminderTime', $data)) {
            if ($data['reminderTime'] === null || $data['reminderTime'] === '') {
                $task->setReminderTime(null);
            } else {
                $task->setReminderTime(new \DateTimeImmutable($data['reminderTime']));
            }
        }

        // Planning Mode fields
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
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'isCompleted' => $task->isCompleted(),
            'isDropped' => $task->isDropped(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d'),
            'category' => $task->getCategory()->value,
            'completedAt' => $task->getCompletedAt()?->format('c'),
            'reminderTime' => $task->getReminderTime()?->format('H:i'),
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'canCombineWithEvents' => $task->getCanCombineWithEvents(),
            'needsFullFocus' => $task->isNeedsFullFocus(),
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
