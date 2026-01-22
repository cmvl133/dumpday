<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\Request\TaskCreateRequest;
use App\DTO\Response\TaskResponse;
use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\TaskCategory;
use App\Repository\DailyNoteRepository;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use App\Service\RecurrenceService;
use App\Service\RecurringSyncService;
use Doctrine\ORM\EntityManagerInterface;
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
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TagRepository $tagRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly RecurringSyncService $recurringSyncService,
        private readonly RecurrenceService $recurrenceService,
    ) {
    }

    #[Route('', name: 'task_create', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] TaskCreateRequest $request
    ): JsonResponse {
        // No manual json_decode needed - MapRequestPayload handles it
        // No manual validation needed - constraints are checked automatically (returns 422 on failure)

        $date = new \DateTime($request->date);
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDailyNote($dailyNote);

        if ($request->category !== null && TaskCategory::tryFrom($request->category) !== null) {
            $task->setCategory(TaskCategory::from($request->category));
        }

        if ($request->dueDate !== null) {
            $task->setDueDate(new \DateTime($request->dueDate));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $this->json(TaskResponse::fromEntity($task), Response::HTTP_CREATED);
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

        $generatedNextTask = null;
        if (isset($data['isCompleted'])) {
            $isCompleted = (bool) $data['isCompleted'];
            $wasCompleted = $task->isCompleted();
            $task->setIsCompleted($isCompleted);
            if ($isCompleted && $task->getCompletedAt() === null) {
                $task->setCompletedAt(new \DateTimeImmutable());
            } elseif (! $isCompleted) {
                $task->setCompletedAt(null);
            }

            // Generate next occurrence if completing a recurring task
            if ($isCompleted && ! $wasCompleted && $task->getRecurringTask() !== null) {
                $recurringTask = $task->getRecurringTask();
                $nextDate = $this->recurrenceService->findNextOccurrenceDate($recurringTask);
                if ($nextDate !== null) {
                    $generatedNextTask = $this->recurringSyncService->generateTask($recurringTask, $nextDate);
                    if ($generatedNextTask !== null) {
                        $recurringTask->setLastGeneratedDate($nextDate);
                    }
                }
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

        // Use DTO for task serialization, handle generatedNextTask separately for backward compatibility
        $taskData = json_decode(json_encode(TaskResponse::fromEntity($task)), true);

        // Include generated next task info if one was created
        if ($generatedNextTask !== null) {
            $taskData['generatedNextTask'] = [
                'id' => $generatedNextTask->getId(),
                'title' => $generatedNextTask->getTitle(),
                'date' => $generatedNextTask->getDailyNote()?->getDate()?->format('Y-m-d'),
            ];
        }

        return $this->json($taskData);
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

    #[Route('/{id}/tags', name: 'task_assign_tags', methods: ['POST'])]
    public function assignTags(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
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
        $tagIds = $data['tagIds'] ?? [];

        if (!is_array($tagIds)) {
            return $this->json([
                'error' => 'tagIds must be an array',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Clear existing tags
        foreach ($task->getTags() as $existingTag) {
            $task->removeTag($existingTag);
        }

        // Add new tags
        foreach ($tagIds as $tagId) {
            $tag = $this->tagRepository->find($tagId);
            if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
                $task->addTag($tag);
            }
        }

        $this->entityManager->flush();

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

        $tag = $this->tagRepository->find($tagId);
        if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
            $task->removeTag($tag);
            $this->entityManager->flush();
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
