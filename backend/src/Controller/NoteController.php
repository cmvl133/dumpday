<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DailyNote;
use App\Entity\Note;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
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
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'note_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['content']) || empty($data['date'])) {
            return $this->json([
                'error' => 'Content and date are required',
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

        $note = new Note();
        $note->setContent((string) $data['content']);
        $note->setDailyNote($dailyNote);

        $this->entityManager->persist($note);
        $this->entityManager->flush();

        return $this->json([
            'id' => $note->getId(),
            'content' => $note->getContent(),
        ], Response::HTTP_CREATED);
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
