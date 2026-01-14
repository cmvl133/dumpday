<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Task;
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
     * Find all scheduled tasks with a specific due date.
     *
     * @return Task[]
     */
    public function findByDueDate(\DateTimeInterface $date): array
    {
        return $this->createQueryBuilder('t')
            ->where('t.dueDate = :date')
            ->setParameter('date', $date->format('Y-m-d'))
            ->orderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
