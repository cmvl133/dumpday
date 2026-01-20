<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\TimeBlock;
use App\Entity\User;
use App\Enum\RecurrenceType;
use App\Repository\TagRepository;
use App\Repository\TimeBlockRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/time-block')]
class TimeBlockController extends AbstractController
{
    private const ALLOWED_COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
        '#f43f5e', '#78716c',
    ];

    public function __construct(
        private readonly TimeBlockRepository $timeBlockRepository,
        private readonly TagRepository $tagRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'time_block_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $timeBlocks = $this->timeBlockRepository->findActiveByUser($user);

        return $this->json(array_map(
            fn (TimeBlock $tb) => $this->serializeTimeBlock($tb),
            $timeBlocks
        ));
    }

    #[Route('', name: 'time_block_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validate required fields
        if (empty($data['name'])) {
            return $this->json([
                'error' => 'Name is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($data['startTime'])) {
            return $this->json([
                'error' => 'Start time is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($data['endTime'])) {
            return $this->json([
                'error' => 'End time is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validate color
        $color = $data['color'] ?? self::ALLOWED_COLORS[0];
        if (!in_array($color, self::ALLOWED_COLORS, true)) {
            return $this->json([
                'error' => 'Invalid color. Must be one of the allowed colors.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validate recurrence type if provided
        $recurrenceType = RecurrenceType::DAILY;
        if (isset($data['recurrenceType'])) {
            $recurrenceType = RecurrenceType::tryFrom($data['recurrenceType']);
            if ($recurrenceType === null) {
                return $this->json([
                    'error' => 'Invalid recurrenceType',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $timeBlock = new TimeBlock();
        $timeBlock->setUser($user);
        $timeBlock->setName((string) $data['name']);
        $timeBlock->setColor($color);
        $timeBlock->setStartTime(new \DateTime($data['startTime']));
        $timeBlock->setEndTime(new \DateTime($data['endTime']));
        $timeBlock->setRecurrenceType($recurrenceType);

        // Set optional recurrence days
        if (isset($data['recurrenceDays']) && is_array($data['recurrenceDays'])) {
            $timeBlock->setRecurrenceDays($data['recurrenceDays']);
        }

        // Handle tag IDs if provided
        if (isset($data['tagIds']) && is_array($data['tagIds'])) {
            foreach ($data['tagIds'] as $tagId) {
                $tag = $this->tagRepository->find($tagId);
                if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
                    $timeBlock->addTag($tag);
                }
            }
        }

        $this->entityManager->persist($timeBlock);
        $this->entityManager->flush();

        return $this->json($this->serializeTimeBlock($timeBlock), Response::HTTP_CREATED);
    }

    private function serializeTimeBlock(TimeBlock $tb): array
    {
        return [
            'id' => $tb->getId(),
            'name' => $tb->getName(),
            'color' => $tb->getColor(),
            'startTime' => $tb->getStartTime()?->format('H:i'),
            'endTime' => $tb->getEndTime()?->format('H:i'),
            'recurrenceType' => $tb->getRecurrenceType()->value,
            'recurrenceDays' => $tb->getRecurrenceDays(),
            'isActive' => $tb->isActive(),
            'createdAt' => $tb->getCreatedAt()?->format('c'),
            'tags' => array_map(fn ($tag) => [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'color' => $tag->getColor(),
            ], $tb->getTags()->toArray()),
        ];
    }
}
