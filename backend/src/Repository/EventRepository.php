<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Event;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Event>
 */
class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    /**
     * @return Event[]
     */
    public function findByUserAndDate(User $user, \DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('e')
            ->join('e.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->andWhere('e.date = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date)
            ->orderBy('e.startTime', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
