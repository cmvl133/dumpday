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

#[Route('/api/brain-dump')]
class BrainDumpController extends AbstractController
{
    public function __construct(
        private readonly BrainDumpFacade $facade,
    ) {
    }

    #[Route('/analyze', name: 'brain_dump_analyze', methods: ['POST'])]
    public function analyze(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (! isset($data['rawContent']) || ! is_string($data['rawContent'])) {
            return $this->json([
                'error' => 'rawContent is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $date = isset($data['date']) ? new \DateTime($data['date']) : new \DateTime();
        } catch (\Exception) {
            $date = new \DateTime();
        }

        try {
            $result = $this->facade->analyze($user, $data['rawContent'], $date);

            return $this->json($result);
        } catch (\Throwable $e) {
            return $this->json(
                [
                    'error' => 'Analysis failed: ' . $e->getMessage(),
                ],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
