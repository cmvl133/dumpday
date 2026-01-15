<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class SessionAuthenticator extends AbstractAuthenticator
{
    public const SESSION_USER_KEY = 'authenticated_user_email';

    public function supports(Request $request): ?bool
    {
        return $request->hasSession() && $request->getSession()->has(self::SESSION_USER_KEY);
    }

    public function authenticate(Request $request): Passport
    {
        $email = $request->getSession()->get(self::SESSION_USER_KEY);

        if ($email === null) {
            throw new AuthenticationException('No session found.');
        }

        return new SelfValidatingPassport(new UserBadge($email));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'success' => false,
            'message' => 'Sesja wygasła. Zaloguj się ponownie.',
        ], Response::HTTP_UNAUTHORIZED);
    }
}
