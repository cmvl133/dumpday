<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LoginCode;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LoginCode>
 */
class LoginCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LoginCode::class);
    }

    public function findValidCode(User $user, string $code): ?LoginCode
    {
        return $this->createQueryBuilder('lc')
            ->where('lc.user = :user')
            ->andWhere('lc.code = :code')
            ->andWhere('lc.expiresAt > :now')
            ->andWhere('lc.attempts < 3')
            ->setParameter('user', $user)
            ->setParameter('code', $code)
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('lc.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findLatestForUser(User $user): ?LoginCode
    {
        return $this->createQueryBuilder('lc')
            ->where('lc.user = :user')
            ->setParameter('user', $user)
            ->orderBy('lc.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countRecentCodes(User $user, \DateTimeInterface $since): int
    {
        return (int) $this->createQueryBuilder('lc')
            ->select('COUNT(lc.id)')
            ->where('lc.user = :user')
            ->andWhere('lc.createdAt > :since')
            ->setParameter('user', $user)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function deleteExpiredCodes(): int
    {
        return $this->createQueryBuilder('lc')
            ->delete()
            ->where('lc.expiresAt < :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }
}
