<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\CheckIn;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CheckIn>
 */
class CheckInRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CheckIn::class);
    }

    public function findLastByUser(User $user): ?CheckIn
    {
        return $this->createQueryBuilder('c')
            ->where('c.user = :user')
            ->setParameter('user', $user)
            ->orderBy('c.completedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByUserAndDate(User $user, \DateTimeInterface $date): ?CheckIn
    {
        return $this->createQueryBuilder('c')
            ->where('c.user = :user')
            ->andWhere('c.date = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date->format('Y-m-d'))
            ->getQuery()
            ->getOneOrNullResult();
    }
}
