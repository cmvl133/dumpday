<?php

declare(strict_types=1);

namespace App\Controller;

use App\Facade\AuthFacade;
use App\Security\SessionAuthenticator;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthFacade $authFacade,
        private readonly UserService $userService,
    ) {
    }

    #[Route('/request-code', name: 'auth_request_code', methods: ['POST'])]
    public function requestCode(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';

        $result = $this->authFacade->requestCode($email);

        return new JsonResponse([
            'success' => $result['success'],
            'message' => $result['message'],
        ]);
    }

    #[Route('/verify-code', name: 'auth_verify_code', methods: ['POST'])]
    public function verifyCode(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';
        $code = $data['code'] ?? '';

        $result = $this->authFacade->verifyCode($email, $code);

        if (!$result['success']) {
            return new JsonResponse([
                'success' => false,
                'message' => $result['message'],
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = $result['user'];
        $session = $request->getSession();
        $session->set(SessionAuthenticator::SESSION_USER_KEY, $user->getEmail());
        $session->migrate(true);

        return new JsonResponse([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
            ],
        ]);
    }

    #[Route('/logout', name: 'auth_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $session = $request->getSession();
        $session->invalidate();

        return new JsonResponse([
            'success' => true,
        ]);
    }

    #[Route('/me', name: 'auth_me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        $session = $request->getSession();
        $email = $session->get(SessionAuthenticator::SESSION_USER_KEY);

        if ($email === null) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Not authenticated',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->userService->findByEmail($email);

        if ($user === null) {
            $session->invalidate();

            return new JsonResponse([
                'success' => false,
                'message' => 'Not authenticated',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
            ],
        ]);
    }
}
