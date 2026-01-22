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

    #[Route('s', name: 'note_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $sort = $request->query->get('sort', 'newest');
        $notes = $this->noteRepository->findByUserSorted($user, $sort);

        return $this->json(array_map(fn(Note $note) => $this->serializeNote($note), $notes));
    }

    #[Route('/search', name: 'note_search', methods: ['GET'])]
    public function search(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        $notes = $this->noteRepository->findByUserWithSearch($user, $query);

        return $this->json(array_map(fn(Note $note) => $this->serializeNote($note), $notes));
    }

    #[Route('', name: 'note_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content']) || empty($data['date'])) {
            return $this->json([
                'error' => 'Date is required',
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
        $note->setContent($data['content'] ?? '');
        $note->setDailyNote($dailyNote);

        if (isset($data['title'])) {
            $note->setTitle($data['title']);
        }

        if (isset($data['format'])) {
            $note->setFormat($data['format']);
        }

        $this->entityManager->persist($note);
        $this->entityManager->flush();

        return $this->json($this->serializeNote($note), Response::HTTP_CREATED);
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

        if (array_key_exists('title', $data)) {
            $note->setTitle($data['title']);
        }

        if (isset($data['format'])) {
            $note->setFormat($data['format']);
        }

        $this->entityManager->flush();

        return $this->json($this->serializeNote($note));
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

    /**
     * @return array<string, mixed>
     */
    private function serializeNote(Note $note): array
    {
        return [
            'id' => $note->getId(),
            'content' => $note->getContent(),
            'title' => $note->getTitle(),
            'format' => $note->getFormat(),
            'createdAt' => $note->getCreatedAt()?->format('c'),
            'updatedAt' => $note->getUpdatedAt()?->format('c'),
        ];
    }
}
