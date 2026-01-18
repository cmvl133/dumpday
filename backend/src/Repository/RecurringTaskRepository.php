<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\RecurringTask;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RecurringTask>
 */
class RecurringTaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RecurringTask::class);
    }

    /**
     * Find all active recurring tasks for a given user.
     *
     * @return RecurringTask[]
     */
    public function findActiveByUser(User $user): array
    {
        return $this->createQueryBuilder('rt')
            ->where('rt.user = :user')
            ->andWhere('rt.isActive = true')
            ->setParameter('user', $user)
            ->orderBy('rt.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all recurring tasks that should generate a task for the target date.
     * This includes:
     * - Active recurring tasks
     * - Where startDate <= targetDate
     * - Where endDate is null OR endDate >= targetDate
     * - Where lastGeneratedDate is null OR lastGeneratedDate < targetDate
     *
     * @return RecurringTask[]
     */
    public function findDueForGeneration(\DateTimeInterface $targetDate, ?User $user = null): array
    {
        $qb = $this->createQueryBuilder('rt')
            ->where('rt.isActive = true')
            ->andWhere('rt.startDate <= :targetDate')
            ->andWhere('(rt.endDate IS NULL OR rt.endDate >= :targetDate)')
            ->andWhere('(rt.lastGeneratedDate IS NULL OR rt.lastGeneratedDate < :targetDate)')
            ->setParameter('targetDate', $targetDate->format('Y-m-d'));

        if ($user !== null) {
            $qb->andWhere('rt.user = :user')
                ->setParameter('user', $user);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Find all tasks generated from a recurring task that are in the future or on a specific date.
     *
     * @return \App\Entity\Task[]
     */
    public function findFutureGeneratedTasks(RecurringTask $recurringTask, \DateTimeInterface $fromDate): array
    {
        return $this->getEntityManager()
            ->createQueryBuilder()
            ->select('t')
            ->from(\App\Entity\Task::class, 't')
            ->join('t.dailyNote', 'dn')
            ->where('t.recurringTask = :recurringTask')
            ->andWhere('dn.date >= :fromDate')
            ->setParameter('recurringTask', $recurringTask)
            ->setParameter('fromDate', $fromDate->format('Y-m-d'))
            ->getQuery()
            ->getResult();
    }
}
