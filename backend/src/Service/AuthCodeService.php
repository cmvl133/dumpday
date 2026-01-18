<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\LoginCode;
use App\Entity\User;
use App\Repository\LoginCodeRepository;
use Doctrine\ORM\EntityManagerInterface;

class AuthCodeService
{
    private const CODE_VALIDITY_MINUTES = 10;

    private const MAX_CODES_PER_HOUR = 3;

    private const MAX_ATTEMPTS = 3;

    private const BLOCK_MINUTES = 15;

    public function __construct(
        private readonly LoginCodeRepository $loginCodeRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public function createLoginCode(User $user): LoginCode
    {
        $loginCode = new LoginCode();
        $loginCode->setUser($user);
        $loginCode->setCode($this->generateCode());
        $loginCode->setExpiresAt(new \DateTimeImmutable(sprintf('+%d minutes', self::CODE_VALIDITY_MINUTES)));

        $this->entityManager->persist($loginCode);
        $this->entityManager->flush();

        return $loginCode;
    }

    public function verifyCode(User $user, string $code): bool
    {
        $loginCode = $this->loginCodeRepository->findValidCode($user, $code);

        if ($loginCode === null) {
            $this->incrementAttempts($user);

            return false;
        }

        $this->entityManager->remove($loginCode);
        $this->entityManager->flush();

        return true;
    }

    public function isRateLimited(User $user): bool
    {
        $oneHourAgo = new \DateTimeImmutable('-1 hour');
        $recentCodes = $this->loginCodeRepository->countRecentCodes($user, $oneHourAgo);

        return $recentCodes >= self::MAX_CODES_PER_HOUR;
    }

    public function isBlocked(User $user): bool
    {
        $latestCode = $this->loginCodeRepository->findLatestForUser($user);

        if ($latestCode === null) {
            return false;
        }

        if ($latestCode->getAttempts() < self::MAX_ATTEMPTS) {
            return false;
        }

        $blockUntil = $latestCode->getCreatedAt()?->modify(sprintf('+%d minutes', self::BLOCK_MINUTES));

        return $blockUntil !== null && $blockUntil > new \DateTimeImmutable();
    }

    public function cleanupExpiredCodes(): int
    {
        return $this->loginCodeRepository->deleteExpiredCodes();
    }

    private function incrementAttempts(User $user): void
    {
        $latestCode = $this->loginCodeRepository->findLatestForUser($user);

        if ($latestCode !== null && ! $latestCode->isExpired()) {
            $latestCode->incrementAttempts();
            $this->entityManager->flush();
        }
    }
}
