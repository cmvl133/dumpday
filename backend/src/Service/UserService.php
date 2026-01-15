<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly string $allowedUsers,
    ) {
    }

    public function findByEmail(string $email): ?User
    {
        return $this->userRepository->findByEmail($email);
    }

    public function findOrCreateUser(string $email): User
    {
        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            $user = new User();
            $user->setEmail($email);
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        }

        return $user;
    }

    public function isEmailAllowed(string $email): bool
    {
        if ($this->allowedUsers === '') {
            return false;
        }

        $allowedList = array_map(
            fn (string $e) => mb_strtolower(trim($e)),
            explode(',', $this->allowedUsers)
        );

        return in_array(mb_strtolower(trim($email)), $allowedList, true);
    }
}
