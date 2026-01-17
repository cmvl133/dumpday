<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DailyNote;
use App\Entity\JournalEntry;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
use App\Repository\JournalEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/journal')]
class JournalEntryController extends AbstractController
{
    public function __construct(
        private readonly JournalEntryRepository $journalEntryRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'journal_entry_create', methods: ['POST'])]
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

        $entry = new JournalEntry();
        $entry->setContent((string) $data['content']);
        $entry->setDailyNote($dailyNote);

        $this->entityManager->persist($entry);
        $this->entityManager->flush();

        return $this->json([
            'id' => $entry->getId(),
            'content' => $entry->getContent(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'journal_entry_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $entry = $this->journalEntryRepository->find($id);

        if ($entry === null) {
            return $this->json([
                'error' => 'Journal entry not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($entry->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['content'])) {
            $entry->setContent((string) $data['content']);
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $entry->getId(),
            'content' => $entry->getContent(),
        ]);
    }

    #[Route('/{id}', name: 'journal_entry_delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $entry = $this->journalEntryRepository->find($id);

        if ($entry === null) {
            return $this->json([
                'error' => 'Journal entry not found',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($entry->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return $this->json([
                'error' => 'Access denied',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($entry);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
