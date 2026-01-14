<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\NoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/note')]
class NoteController extends AbstractController
{
    public function __construct(
        private readonly NoteRepository $noteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/{id}', name: 'note_update', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $note = $this->noteRepository->find($id);

        if ($note === null) {
            return $this->json([
                'error' => 'Note not found',
            ], Response::HTTP_NOT_FOUND);
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
    public function delete(int $id): JsonResponse
    {
        $note = $this->noteRepository->find($id);

        if ($note === null) {
            return $this->json([
                'error' => 'Note not found',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($note);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
