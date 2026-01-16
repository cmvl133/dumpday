<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Task;
use App\Entity\User;
use App\Enum\TaskCategory;
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

    /**
     * Find all overdue tasks:
     * - Tasks with dueDate < today
     * - Tasks with category='today' from previous daily notes (dn.date < today) that have no dueDate set
     * All must be not completed and not dropped.
     *
     * @return Task[]
     */
    public function findOverdueTasks(User $user, \DateTimeInterface $today): array
    {
        return $this->createQueryBuilder('t')
            ->join('t.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->andWhere('(t.dueDate < :today OR (t.category = :todayCategory AND dn.date < :today AND t.dueDate IS NULL))')
            ->andWhere('t.isCompleted = false')
            ->andWhere('t.isDropped = false')
            ->setParameter('user', $user)
            ->setParameter('today', $today->format('Y-m-d'))
            ->setParameter('todayCategory', TaskCategory::TODAY->value)
            ->orderBy('dn.date', 'ASC')
            ->addOrderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all incomplete tasks for today:
     * - Tasks with dueDate = today
     * - Tasks with category='today' from today's daily note
     * All must be not completed and not dropped.
     *
     * @return Task[]
     */
    public function findTodayIncompleteTasks(User $user, \DateTimeInterface $today): array
    {
        return $this->createQueryBuilder('t')
            ->join('t.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->andWhere('(t.dueDate = :today OR (t.category = :todayCategory AND dn.date = :today))')
            ->andWhere('t.isCompleted = false')
            ->andWhere('t.isDropped = false')
            ->setParameter('user', $user)
            ->setParameter('today', $today->format('Y-m-d'))
            ->setParameter('todayCategory', TaskCategory::TODAY->value)
            ->orderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
