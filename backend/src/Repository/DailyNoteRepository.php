<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\DailyNote;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DailyNote>
 */
class DailyNoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DailyNote::class);
    }

    public function findByDate(\DateTimeInterface $date): ?DailyNote
    {
        return $this->createQueryBuilder('dn')
            ->andWhere('dn.date = :date')
            ->setParameter('date', $date->format('Y-m-d'))
            ->getQuery()
            ->getOneOrNullResult();
    }
}
