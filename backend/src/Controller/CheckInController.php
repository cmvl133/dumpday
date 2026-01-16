<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\CheckIn;
use App\Entity\User;
use App\Repository\CheckInRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/check-in')]
class CheckInController extends AbstractController
{
    public function __construct(
        private readonly TaskRepository $taskRepository,
        private readonly CheckInRepository $checkInRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/tasks', name: 'checkin_tasks', methods: ['GET'])]
    public function getTasks(#[CurrentUser] User $user): JsonResponse
    {
        $today = new \DateTime('today');

        $overdueTasks = $this->taskRepository->findOverdueTasks($user, $today);
        $todayTasks = $this->taskRepository->findTodayIncompleteTasks($user, $today);

        $lastCheckIn = $this->checkInRepository->findLastByUser($user);

        return $this->json([
            'overdue' => array_map(fn ($task) => [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
                'category' => $task->getCategory()->value,
                'reminderTime' => $task->getReminderTime()?->format('H:i'),
            ], $overdueTasks),
            'today' => array_map(fn ($task) => [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
                'category' => $task->getCategory()->value,
                'reminderTime' => $task->getReminderTime()?->format('H:i'),
            ], $todayTasks),
            'lastCheckInAt' => $lastCheckIn?->getCompletedAt()?->format('c'),
        ]);
    }

    #[Route('/task/{id}/action', name: 'checkin_task_action', methods: ['POST'])]
    public function taskAction(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $action = $data['action'] ?? null;

        if (! in_array($action, ['done', 'tomorrow', 'today', 'drop'], true)) {
            return $this->json(['error' => 'Invalid action'], Response::HTTP_BAD_REQUEST);
        }

        switch ($action) {
            case 'done':
                $task->setIsCompleted(true);
                $task->setCompletedAt(new \DateTimeImmutable());
                break;

            case 'tomorrow':
                $tomorrow = new \DateTime('tomorrow');
                $task->setDueDate($tomorrow);
                break;

            case 'today':
                $today = new \DateTime('today');
                $task->setDueDate($today);
                break;

            case 'drop':
                $task->setIsDropped(true);
                break;
        }

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'task' => [
                'id' => $task->getId(),
                'title' => $task->getTitle(),
                'isCompleted' => $task->isCompleted(),
                'isDropped' => $task->isDropped(),
                'dueDate' => $task->getDueDate()?->format('Y-m-d'),
                'category' => $task->getCategory()->value,
                'completedAt' => $task->getCompletedAt()?->format('c'),
                'reminderTime' => $task->getReminderTime()?->format('H:i'),
            ],
        ]);
    }

    #[Route('/complete', name: 'checkin_complete', methods: ['POST'])]
    public function complete(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $stats = $data['stats'] ?? [];

        $today = new \DateTime('today');

        $checkIn = $this->checkInRepository->findByUserAndDate($user, $today);

        if ($checkIn === null) {
            $checkIn = new CheckIn();
            $checkIn->setUser($user);
            $checkIn->setDate($today);
            $this->entityManager->persist($checkIn);
        }

        $checkIn->setCompletedAt(new \DateTimeImmutable());
        $checkIn->setStatsDone((int) ($stats['done'] ?? 0));
        $checkIn->setStatsTomorrow((int) ($stats['tomorrow'] ?? 0));
        $checkIn->setStatsToday((int) ($stats['today'] ?? 0));
        $checkIn->setStatsDropped((int) ($stats['dropped'] ?? 0));
        $checkIn->setStatsOverdueCleared((int) ($stats['overdueCleared'] ?? 0));
        $checkIn->setBestCombo((int) ($stats['bestCombo'] ?? 0));

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'checkIn' => [
                'id' => $checkIn->getId(),
                'date' => $checkIn->getDate()->format('Y-m-d'),
                'completedAt' => $checkIn->getCompletedAt()->format('c'),
                'statsDone' => $checkIn->getStatsDone(),
                'statsTomorrow' => $checkIn->getStatsTomorrow(),
                'statsToday' => $checkIn->getStatsToday(),
                'statsDropped' => $checkIn->getStatsDropped(),
                'statsOverdueCleared' => $checkIn->getStatsOverdueCleared(),
                'bestCombo' => $checkIn->getBestCombo(),
            ],
        ]);
    }
}
