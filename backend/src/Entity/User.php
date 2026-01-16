<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $email = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, DailyNote>
     */
    #[ORM\OneToMany(targetEntity: DailyNote::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $dailyNotes;

    /**
     * @var Collection<int, LoginCode>
     */
    #[ORM\OneToMany(targetEntity: LoginCode::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $loginCodes;

    #[ORM\Column(length: 20, options: ['default' => '3h'])]
    private string $checkInInterval = '3h';

    #[ORM\Column(options: ['default' => false])]
    private bool $zenMode = false;

    #[ORM\Column(options: ['default' => false])]
    private bool $soundEnabled = false;

    public function __construct()
    {
        $this->dailyNotes = new ArrayCollection();
        $this->loginCodes = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection<int, DailyNote>
     */
    public function getDailyNotes(): Collection
    {
        return $this->dailyNotes;
    }

    public function addDailyNote(DailyNote $dailyNote): static
    {
        if (! $this->dailyNotes->contains($dailyNote)) {
            $this->dailyNotes->add($dailyNote);
            $dailyNote->setUser($this);
        }

        return $this;
    }

    public function removeDailyNote(DailyNote $dailyNote): static
    {
        if ($this->dailyNotes->removeElement($dailyNote)) {
            if ($dailyNote->getUser() === $this) {
                $dailyNote->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, LoginCode>
     */
    public function getLoginCodes(): Collection
    {
        return $this->loginCodes;
    }

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function eraseCredentials(): void
    {
    }

    public function getUserIdentifier(): string
    {
        return $this->email ?? '';
    }

    public function getCheckInInterval(): string
    {
        return $this->checkInInterval;
    }

    public function setCheckInInterval(string $checkInInterval): static
    {
        $this->checkInInterval = $checkInInterval;

        return $this;
    }

    public function isZenMode(): bool
    {
        return $this->zenMode;
    }

    public function setZenMode(bool $zenMode): static
    {
        $this->zenMode = $zenMode;

        return $this;
    }

    public function isSoundEnabled(): bool
    {
        return $this->soundEnabled;
    }

    public function setSoundEnabled(bool $soundEnabled): static
    {
        $this->soundEnabled = $soundEnabled;

        return $this;
    }
}
