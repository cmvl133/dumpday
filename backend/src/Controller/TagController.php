<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Tag;
use App\Entity\User;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/tag')]
class TagController extends AbstractController
{
    private const ALLOWED_COLORS = [
        '#ff2d7a', // pink
        '#00d4ff', // cyan
        '#00ff88', // green
        '#ffee00', // yellow
        '#ff6b35', // orange
        '#9d4edd', // purple
        '#ff006e', // hot pink
        '#3a86ff', // blue
    ];

    public function __construct(
        private readonly TagRepository $tagRepository,
        private readonly TaskRepository $taskRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'tag_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $tags = $this->tagRepository->findByUser($user);

        return $this->json(array_map(fn (Tag $tag) => [
            'id' => $tag->getId(),
            'name' => $tag->getName(),
            'color' => $tag->getColor(),
        ], $tags));
    }

    #[Route('', name: 'tag_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json([
                'error' => 'Name is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        $name = trim((string) $data['name']);
        if (mb_strlen($name) > 100) {
            return $this->json([
                'error' => 'Name is too long (max 100 characters)',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Check for duplicate name
        $existing = $this->tagRepository->findByUserAndName($user, $name);
        if ($existing !== null) {
            return $this->json([
                'error' => 'Tag with this name already exists',
            ], Response::HTTP_CONFLICT);
        }

        $color = $data['color'] ?? self::ALLOWED_COLORS[0];
        if (!in_array($color, self::ALLOWED_COLORS, true)) {
            $color = self::ALLOWED_COLORS[0];
        }

        $tag = new Tag();
        $tag->setUser($user);
        $tag->setName($name);
        $tag->setColor($color);

        $this->entityManager->persist($tag);
        $this->entityManager->flush();

        return $this->json([
            'id' => $tag->getId(),
            'name' => $tag->getName(),
            'color' => $tag->getColor(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'tag_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $tag = $this->tagRepository->find($id);

        if ($tag === null) {
            return $this->json([
                'error' => 'Tag not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($tag->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $name = trim((string) $data['name']);
            if (mb_strlen($name) > 100) {
                return $this->json([
                    'error' => 'Name is too long (max 100 characters)',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check for duplicate name (exclude current tag)
            $existing = $this->tagRepository->findByUserAndName($user, $name);
            if ($existing !== null && $existing->getId() !== $id) {
                return $this->json([
                    'error' => 'Tag with this name already exists',
                ], Response::HTTP_CONFLICT);
            }

            $tag->setName($name);
        }

        if (isset($data['color'])) {
            $color = $data['color'];
            if (in_array($color, self::ALLOWED_COLORS, true)) {
                $tag->setColor($color);
            }
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $tag->getId(),
            'name' => $tag->getName(),
            'color' => $tag->getColor(),
        ]);
    }

    #[Route('/{id}', name: 'tag_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $tag = $this->tagRepository->find($id);

        if ($tag === null) {
            return $this->json([
                'error' => 'Tag not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($tag->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($tag);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/colors', name: 'tag_colors', methods: ['GET'])]
    public function colors(): JsonResponse
    {
        return $this->json(self::ALLOWED_COLORS);
    }
}
