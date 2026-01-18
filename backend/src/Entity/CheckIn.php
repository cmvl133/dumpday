<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\CheckInRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CheckInRepository::class)]
#[ORM\Table(name: 'check_ins')]
#[ORM\Index(columns: ['user_id', 'date'], name: 'idx_check_ins_user_date')]
class CheckIn
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $statsDone = 0;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $statsTomorrow = 0;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $statsToday = 0;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $statsDropped = 0;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $statsOverdueCleared = 0;

    #[ORM\Column(options: [
        'default' => 0,
    ])]
    private int $bestCombo = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(\DateTimeImmutable $completedAt): static
    {
        $this->completedAt = $completedAt;

        return $this;
    }

    public function getStatsDone(): int
    {
        return $this->statsDone;
    }

    public function setStatsDone(int $statsDone): static
    {
        $this->statsDone = $statsDone;

        return $this;
    }

    public function getStatsTomorrow(): int
    {
        return $this->statsTomorrow;
    }

    public function setStatsTomorrow(int $statsTomorrow): static
    {
        $this->statsTomorrow = $statsTomorrow;

        return $this;
    }

    public function getStatsToday(): int
    {
        return $this->statsToday;
    }

    public function setStatsToday(int $statsToday): static
    {
        $this->statsToday = $statsToday;

        return $this;
    }

    public function getStatsDropped(): int
    {
        return $this->statsDropped;
    }

    public function setStatsDropped(int $statsDropped): static
    {
        $this->statsDropped = $statsDropped;

        return $this;
    }

    public function getStatsOverdueCleared(): int
    {
        return $this->statsOverdueCleared;
    }

    public function setStatsOverdueCleared(int $statsOverdueCleared): static
    {
        $this->statsOverdueCleared = $statsOverdueCleared;

        return $this;
    }

    public function getBestCombo(): int
    {
        return $this->bestCombo;
    }

    public function setBestCombo(int $bestCombo): static
    {
        $this->bestCombo = $bestCombo;

        return $this;
    }
}
