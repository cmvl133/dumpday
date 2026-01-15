<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\NoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/note')]
class NoteController extends AbstractController
{
    public function __construct(
        private readonly NoteRepository $noteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/{id}', name: 'note_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $note = $this->noteRepository->find($id);

        if ($note === null) {
            return $this->json([
                'error' => 'Note not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($note->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['content'])) {
            $note->setContent((string) $data['content']);
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $note->getId(),
            'content' => $note->getContent(),
        ]);
    }

    #[Route('/{id}', name: 'note_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $note = $this->noteRepository->find($id);

        if ($note === null) {
            return $this->json([
                'error' => 'Note not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($note->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($note);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
