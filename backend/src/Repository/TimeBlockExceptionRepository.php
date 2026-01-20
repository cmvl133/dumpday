<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TimeBlock;
use App\Entity\TimeBlockException;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TimeBlockException>
 */
class TimeBlockExceptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TimeBlockException::class);
    }

    /**
     * Find all exceptions for a user on a specific date.
     *
     * @return TimeBlockException[]
     */
    public function findByUserAndDate(User $user, \DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('e')
            ->join('e.timeBlock', 'tb')
            ->where('tb.user = :user')
            ->andWhere('e.exceptionDate = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date->format('Y-m-d'))
            ->getQuery()
            ->getResult();
    }

    /**
     * Find exception for a specific time block on a specific date.
     */
    public function findByTimeBlockAndDate(TimeBlock $timeBlock, \DateTimeInterface $date): ?TimeBlockException
    {
        return $this->createQueryBuilder('e')
            ->where('e.timeBlock = :timeBlock')
            ->andWhere('e.exceptionDate = :date')
            ->setParameter('timeBlock', $timeBlock)
            ->setParameter('date', $date->format('Y-m-d'))
            ->getQuery()
            ->getOneOrNullResult();
    }
}
