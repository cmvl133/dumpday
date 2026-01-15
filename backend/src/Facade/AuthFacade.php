<?php

declare(strict_types=1);

namespace App\Facade;

use App\Entity\User;
use App\Service\AuthCodeService;
use App\Service\AuthMailerService;
use App\Service\UserService;

class AuthFacade
{
    public function __construct(
        private readonly UserService $userService,
        private readonly AuthCodeService $authCodeService,
        private readonly AuthMailerService $authMailerService,
    ) {
    }

    public function requestCode(string $email): array
    {
        $email = mb_strtolower(trim($email));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'Podaj prawidłowy adres email.',
            ];
        }

        if (!$this->userService->isEmailAllowed($email)) {
            return [
                'success' => true,
                'message' => 'Jeśli adres jest zarejestrowany, otrzymasz kod na email.',
            ];
        }

        $user = $this->userService->findOrCreateUser($email);

        if ($this->authCodeService->isBlocked($user)) {
            return [
                'success' => false,
                'message' => 'Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut.',
            ];
        }

        if ($this->authCodeService->isRateLimited($user)) {
            return [
                'success' => false,
                'message' => 'Wysłano zbyt wiele kodów. Spróbuj ponownie później.',
            ];
        }

        $loginCode = $this->authCodeService->createLoginCode($user);
        $this->authMailerService->sendLoginCode($user, $loginCode->getCode());

        return [
            'success' => true,
            'message' => 'Jeśli adres jest zarejestrowany, otrzymasz kod na email.',
        ];
    }

    public function verifyCode(string $email, string $code): array
    {
        $email = mb_strtolower(trim($email));
        $code = trim($code);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'Nieprawidłowy adres email.',
            ];
        }

        if (strlen($code) !== 6 || !ctype_digit($code)) {
            return [
                'success' => false,
                'message' => 'Nieprawidłowy format kodu.',
            ];
        }

        $user = $this->userService->findByEmail($email);

        if ($user === null) {
            return [
                'success' => false,
                'message' => 'Nieprawidłowy email lub kod.',
            ];
        }

        if ($this->authCodeService->isBlocked($user)) {
            return [
                'success' => false,
                'message' => 'Zbyt wiele nieudanych prób. Spróbuj ponownie za 15 minut.',
            ];
        }

        if (!$this->authCodeService->verifyCode($user, $code)) {
            return [
                'success' => false,
                'message' => 'Nieprawidłowy email lub kod.',
            ];
        }

        return [
            'success' => true,
            'user' => $user,
        ];
    }
}
