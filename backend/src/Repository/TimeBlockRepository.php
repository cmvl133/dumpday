<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TimeBlock;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TimeBlock>
 */
class TimeBlockRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TimeBlock::class);
    }

    /**
     * Find all active time blocks for a given user.
     *
     * @return TimeBlock[]
     */
    public function findActiveByUser(User $user): array
    {
        return $this->createQueryBuilder('tb')
            ->where('tb.user = :user')
            ->andWhere('tb.isActive = true')
            ->setParameter('user', $user)
            ->orderBy('tb.startTime', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
