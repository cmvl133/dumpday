<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Task;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    /**
     * Find all scheduled tasks with a specific due date for a given user.
     *
     * @return Task[]
     */
    public function findByUserAndDueDate(User $user, \DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('t')
            ->join('t.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->andWhere('t.dueDate = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date->format('Y-m-d'))
            ->orderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
