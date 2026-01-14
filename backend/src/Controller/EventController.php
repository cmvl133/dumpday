<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\EventRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/event')]
class EventController extends AbstractController
{
    public function __construct(
        private readonly EventRepository $eventRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/{id}', name: 'event_update', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepository->find($id);

        if ($event === null) {
            return $this->json([
                'error' => 'Event not found',
            ], Response::HTTP_NOT_FOUND);
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
    public function delete(int $id): JsonResponse
    {
        $event = $this->eventRepository->find($id);

        if ($event === null) {
            return $this->json([
                'error' => 'Event not found',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($event);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
