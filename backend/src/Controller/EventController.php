<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DailyNote;
use App\Entity\Event;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
use App\Repository\EventRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/event')]
class EventController extends AbstractController
{
    public function __construct(
        private readonly EventRepository $eventRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'event_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['title']) || empty($data['date']) || empty($data['startTime'])) {
            return $this->json([
                'error' => 'Title, date and startTime are required',
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

        $event = new Event();
        $event->setTitle((string) $data['title']);
        $event->setDailyNote($dailyNote);
        $event->setDate($date);

        $startTime = \DateTime::createFromFormat('H:i', $data['startTime']);
        if ($startTime === false) {
            return $this->json([
                'error' => 'Invalid startTime format (expected H:i)',
            ], Response::HTTP_BAD_REQUEST);
        }
        $event->setStartTime($startTime);

        if (isset($data['endTime']) && $data['endTime']) {
            $endTime = \DateTime::createFromFormat('H:i', $data['endTime']);
            if ($endTime !== false) {
                $event->setEndTime($endTime);
            }
        }

        $this->entityManager->persist($event);
        $this->entityManager->flush();

        return $this->json([
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'date' => $event->getDate()?->format('Y-m-d'),
            'startTime' => $event->getStartTime()?->format('H:i'),
            'endTime' => $event->getEndTime()?->format('H:i'),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'event_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepository->find($id);

        if ($event === null) {
            return $this->json([
                'error' => 'Event not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($event->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) {
            $event->setTitle((string) $data['title']);
        }

        if (isset($data['startTime'])) {
            $startTime = \DateTime::createFromFormat('H:i', $data['startTime']);
            if ($startTime !== false) {
                $event->setStartTime($startTime);
            }
        }

        if (isset($data['endTime'])) {
            $endTime = \DateTime::createFromFormat('H:i', $data['endTime']);
            if ($endTime !== false) {
                $event->setEndTime($endTime);
            }
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'startTime' => $event->getStartTime()?->format('H:i'),
            'endTime' => $event->getEndTime()?->format('H:i'),
            'date' => $event->getDate()?->format('Y-m-d'),
        ]);
    }

    #[Route('/{id}', name: 'event_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $event = $this->eventRepository->find($id);

        if ($event === null) {
            return $this->json([
                'error' => 'Event not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($event->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($event);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
