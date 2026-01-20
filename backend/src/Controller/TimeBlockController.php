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

    #[Route('/{id}', name: 'time_block_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $timeBlock = $this->timeBlockRepository->find($id);

        if ($timeBlock === null) {
            return $this->json([
                'error' => 'Time block not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($timeBlock->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $timeBlock->setName((string) $data['name']);
        }

        if (isset($data['color'])) {
            if (in_array($data['color'], self::ALLOWED_COLORS, true)) {
                $timeBlock->setColor($data['color']);
            }
        }

        if (isset($data['startTime'])) {
            $timeBlock->setStartTime(new \DateTime($data['startTime']));
        }

        if (isset($data['endTime'])) {
            $timeBlock->setEndTime(new \DateTime($data['endTime']));
        }

        if (isset($data['recurrenceType'])) {
            $recurrenceType = RecurrenceType::tryFrom($data['recurrenceType']);
            if ($recurrenceType !== null) {
                $timeBlock->setRecurrenceType($recurrenceType);
            }
        }

        if (array_key_exists('recurrenceDays', $data)) {
            $timeBlock->setRecurrenceDays(is_array($data['recurrenceDays']) ? $data['recurrenceDays'] : null);
        }

        if (isset($data['isActive'])) {
            $timeBlock->setIsActive((bool) $data['isActive']);
        }

        // Handle tags: if tagIds is provided, clear existing and add new ones
        if (array_key_exists('tagIds', $data)) {
            // Clear existing tags
            foreach ($timeBlock->getTags()->toArray() as $tag) {
                $timeBlock->removeTag($tag);
            }

            // Add new tags if provided
            if (is_array($data['tagIds'])) {
                foreach ($data['tagIds'] as $tagId) {
                    $tag = $this->tagRepository->find($tagId);
                    if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
                        $timeBlock->addTag($tag);
                    }
                }
            }
        }

        $this->entityManager->flush();

        return $this->json($this->serializeTimeBlock($timeBlock));
    }

    #[Route('/{id}', name: 'time_block_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $timeBlock = $this->timeBlockRepository->find($id);

        if ($timeBlock === null) {
            return $this->json([
                'error' => 'Time block not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($timeBlock->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        // Soft delete - just deactivate
        $timeBlock->setIsActive(false);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
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
