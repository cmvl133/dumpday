<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Facade\BrainDumpFacade;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/daily-note')]
class DailyNoteController extends AbstractController
{
    public function __construct(
        private readonly BrainDumpFacade $facade,
    ) {
    }

    #[Route('/{date}', name: 'daily_note_get', methods: ['GET'], requirements: [
        'date' => '\d{4}-\d{2}-\d{2}',
    ])]
    public function get(#[CurrentUser] User $user, string $date): JsonResponse
    {
        try {
            $dateTime = new \DateTime($date);
        } catch (\Exception) {
            return $this->json([
                'error' => 'Invalid date format',
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = $this->facade->getDailyNoteData($user, $dateTime);

        if ($data === null) {
            return $this->json(null, Response::HTTP_NOT_FOUND);
        }

        return $this->json($data);
    }

    #[Route('', name: 'daily_note_create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (! isset($data['rawContent']) || ! is_string($data['rawContent'])) {
            return $this->json([
                'error' => 'rawContent is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (! isset($data['analysis']) || ! is_array($data['analysis'])) {
            return $this->json([
                'error' => 'analysis is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $date = isset($data['date']) ? new \DateTime($data['date']) : new \DateTime();
        } catch (\Exception) {
            $date = new \DateTime();
        }

        try {
            $dailyNote = $this->facade->saveAnalysis(
                $user,
                $data['rawContent'],
                $data['analysis'],
                $date
            );

            $responseData = $this->facade->getDailyNoteData($user, $date);

            return $this->json($responseData, Response::HTTP_CREATED);
        } catch (\Throwable $e) {
            return $this->json(
                [
                    'error' => 'Failed to save: ' . $e->getMessage(),
                ],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
