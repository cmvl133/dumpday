<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Note;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Note>
 */
class NoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Note::class);
    }

    /**
     * @return Note[]
     */
    public function findByUserWithSearch(User $user, string $query): array
    {
        $qb = $this->createQueryBuilder('n')
            ->innerJoin('n.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->setParameter('user', $user);

        if (!empty($query)) {
            $qb->andWhere('n.content LIKE :query OR n.title LIKE :query')
               ->setParameter('query', '%' . $query . '%');
        }

        $qb->orderBy('n.updatedAt', 'DESC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @return Note[]
     */
    public function findByUserSorted(User $user, string $sort = 'newest'): array
    {
        $order = $sort === 'oldest' ? 'ASC' : 'DESC';

        return $this->createQueryBuilder('n')
            ->innerJoin('n.dailyNote', 'dn')
            ->where('dn.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', $order)
            ->getQuery()
            ->getResult();
    }
}
