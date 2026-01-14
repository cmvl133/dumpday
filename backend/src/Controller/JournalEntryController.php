<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\JournalEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/journal')]
class JournalEntryController extends AbstractController
{
    public function __construct(
        private readonly JournalEntryRepository $journalEntryRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/{id}', name: 'journal_entry_update', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $entry = $this->journalEntryRepository->find($id);

        if ($entry === null) {
            return $this->json([
                'error' => 'Journal entry not found',
            ], Response::HTTP_NOT_FOUND);
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
    public function delete(int $id): JsonResponse
    {
        $entry = $this->journalEntryRepository->find($id);

        if ($entry === null) {
            return $this->json([
                'error' => 'Journal entry not found',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($entry);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
