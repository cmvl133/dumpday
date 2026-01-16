<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/settings')]
class SettingsController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'settings_get', methods: ['GET'])]
    public function get(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json([
            'checkInInterval' => $user->getCheckInInterval(),
            'zenMode' => $user->isZenMode(),
            'soundEnabled' => $user->isSoundEnabled(),
            'reminderTone' => $user->getReminderTone(),
        ]);
    }

    #[Route('', name: 'settings_update', methods: ['PATCH'])]
    public function update(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['checkInInterval'])) {
            $interval = (string) $data['checkInInterval'];
            if (in_array($interval, ['off', '2h', '3h', '4h'], true)) {
                $user->setCheckInInterval($interval);
            }
        }

        if (isset($data['zenMode'])) {
            $user->setZenMode((bool) $data['zenMode']);
        }

        if (isset($data['soundEnabled'])) {
            $user->setSoundEnabled((bool) $data['soundEnabled']);
        }

        if (isset($data['reminderTone'])) {
            $tone = (string) $data['reminderTone'];
            if (in_array($tone, ['gentle', 'normal', 'aggressive', 'vulgar', 'bigpoppapump'], true)) {
                $user->setReminderTone($tone);
            }
        }

        $this->entityManager->flush();

        return $this->json([
            'checkInInterval' => $user->getCheckInInterval(),
            'zenMode' => $user->isZenMode(),
            'soundEnabled' => $user->isSoundEnabled(),
            'reminderTone' => $user->getReminderTone(),
        ]);
    }
}
