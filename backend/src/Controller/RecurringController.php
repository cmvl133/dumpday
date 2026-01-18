<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\RecurringTask;
use App\Entity\User;
use App\Enum\RecurrenceType;
use App\Enum\TaskCategory;
use App\Repository\RecurringTaskRepository;
use App\Repository\TaskRepository;
use App\Service\RecurringSyncService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/recurring')]
class RecurringController extends AbstractController
{
    public function __construct(
        private readonly RecurringTaskRepository $recurringTaskRepository,
        private readonly TaskRepository $taskRepository,
        private readonly RecurringSyncService $recurringSyncService,
        private readonly EntityManagerInterface $entityManager,
        private readonly string $appEnv,
    ) {
    }

    #[Route('', name: 'recurring_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $recurringTasks = $this->recurringTaskRepository->findActiveByUser($user);

        return $this->json(array_map(
            fn (RecurringTask $rt) => $this->serializeRecurringTask($rt),
            $recurringTasks
        ));
    }

    #[Route('', name: 'recurring_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['title']) || empty($data['recurrenceType'])) {
            return $this->json([
                'error' => 'Title and recurrenceType are required',
            ], Response::HTTP_BAD_REQUEST);
        }

        $recurrenceType = RecurrenceType::tryFrom($data['recurrenceType']);
        if ($recurrenceType === null) {
            return $this->json([
                'error' => 'Invalid recurrenceType',
            ], Response::HTTP_BAD_REQUEST);
        }

        $recurringTask = new RecurringTask();
        $recurringTask->setUser($user);
        $recurringTask->setTitle((string) $data['title']);
        $recurringTask->setRecurrenceType($recurrenceType);

        // Set start date (default to today)
        $startDate = isset($data['startDate']) && $data['startDate']
            ? new \DateTime($data['startDate'])
            : new \DateTime('today');
        $recurringTask->setStartDate($startDate);

        // Set optional fields
        if (isset($data['recurrenceDays']) && is_array($data['recurrenceDays'])) {
            $recurringTask->setRecurrenceDays($data['recurrenceDays']);
        }

        if (isset($data['endDate']) && $data['endDate']) {
            $recurringTask->setEndDate(new \DateTime($data['endDate']));
        }

        if (isset($data['category']) && TaskCategory::tryFrom($data['category']) !== null) {
            $recurringTask->setCategory(TaskCategory::from($data['category']));
        }

        if (isset($data['estimatedMinutes']) && $data['estimatedMinutes'] !== null) {
            $recurringTask->setEstimatedMinutes((int) $data['estimatedMinutes']);
        }

        if (isset($data['fixedTime']) && $data['fixedTime']) {
            $recurringTask->setFixedTime(new \DateTimeImmutable($data['fixedTime']));
        }

        $this->entityManager->persist($recurringTask);

        // Link existing task to the recurring task if linkTaskId is provided
        $linkedTask = null;
        if (isset($data['linkTaskId']) && $data['linkTaskId']) {
            $linkedTask = $this->taskRepository->find($data['linkTaskId']);
            if ($linkedTask !== null && $linkedTask->getDailyNote()?->getUser()?->getId() === $user->getId()) {
                $linkedTask->setRecurringTask($recurringTask);
                // Set lastGeneratedDate to prevent duplicate generation for today
                $recurringTask->setLastGeneratedDate(new \DateTime('today'));
            }
        }

        $this->entityManager->flush();

        $response = $this->serializeRecurringTask($recurringTask);
        if ($linkedTask !== null) {
            $response['linkedTaskId'] = $linkedTask->getId();
        }

        return $this->json($response, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'recurring_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $recurringTask = $this->recurringTaskRepository->find($id);

        if ($recurringTask === null) {
            return $this->json([
                'error' => 'Recurring task not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($recurringTask->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) {
            $recurringTask->setTitle((string) $data['title']);
        }

        if (isset($data['recurrenceType'])) {
            $recurrenceType = RecurrenceType::tryFrom($data['recurrenceType']);
            if ($recurrenceType !== null) {
                $recurringTask->setRecurrenceType($recurrenceType);
            }
        }

        if (array_key_exists('recurrenceDays', $data)) {
            $recurringTask->setRecurrenceDays(is_array($data['recurrenceDays']) ? $data['recurrenceDays'] : null);
        }

        if (array_key_exists('endDate', $data)) {
            $recurringTask->setEndDate($data['endDate'] ? new \DateTime($data['endDate']) : null);
        }

        if (isset($data['category']) && TaskCategory::tryFrom($data['category']) !== null) {
            $recurringTask->setCategory(TaskCategory::from($data['category']));
        }

        if (array_key_exists('estimatedMinutes', $data)) {
            $recurringTask->setEstimatedMinutes($data['estimatedMinutes'] !== null ? (int) $data['estimatedMinutes'] : null);
        }

        if (array_key_exists('fixedTime', $data)) {
            $recurringTask->setFixedTime($data['fixedTime'] ? new \DateTimeImmutable($data['fixedTime']) : null);
        }

        if (isset($data['isActive'])) {
            $recurringTask->setIsActive((bool) $data['isActive']);
        }

        $this->entityManager->flush();

        return $this->json($this->serializeRecurringTask($recurringTask));
    }

    #[Route('/{id}', name: 'recurring_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $recurringTask = $this->recurringTaskRepository->find($id);

        if ($recurringTask === null) {
            return $this->json([
                'error' => 'Recurring task not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($recurringTask->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        // Soft delete - just deactivate
        $recurringTask->setIsActive(false);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/all', name: 'recurring_delete_all', methods: ['DELETE'])]
    public function deleteAll(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $recurringTask = $this->recurringTaskRepository->find($id);

        if ($recurringTask === null) {
            return $this->json([
                'error' => 'Recurring task not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($recurringTask->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        // Delete all future generated tasks
        $today = new \DateTime('today');
        $deletedCount = $this->recurringSyncService->deleteFutureGeneratedTasks($recurringTask, $today);

        // Hard delete the recurring task
        $this->entityManager->remove($recurringTask);
        $this->entityManager->flush();

        return $this->json([
            'deletedTasks' => $deletedCount,
        ], Response::HTTP_OK);
    }

    #[Route('/sync', name: 'recurring_sync', methods: ['POST'])]
    public function sync(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        // Only allow in dev environment
        if ($this->appEnv !== 'dev') {
            return $this->json([
                'error' => 'Sync endpoint is only available in development environment',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $date = isset($data['date']) ? new \DateTime($data['date']) : new \DateTime('today');

        $generatedTasks = $this->recurringSyncService->syncForDate($date, $user);

        return $this->json([
            'generated' => count($generatedTasks),
            'tasks' => array_map(fn ($t) => [
                'id' => $t->getId(),
                'title' => $t->getTitle(),
            ], $generatedTasks),
        ]);
    }

    private function serializeRecurringTask(RecurringTask $rt): array
    {
        return [
            'id' => $rt->getId(),
            'title' => $rt->getTitle(),
            'recurrenceType' => $rt->getRecurrenceType()->value,
            'recurrenceDays' => $rt->getRecurrenceDays(),
            'startDate' => $rt->getStartDate()?->format('Y-m-d'),
            'endDate' => $rt->getEndDate()?->format('Y-m-d'),
            'category' => $rt->getCategory()->value,
            'estimatedMinutes' => $rt->getEstimatedMinutes(),
            'fixedTime' => $rt->getFixedTime()?->format('H:i'),
            'isActive' => $rt->isActive(),
            'createdAt' => $rt->getCreatedAt()?->format('c'),
        ];
    }
}
